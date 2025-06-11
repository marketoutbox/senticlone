import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
})

// Helper function to safely get number value
const safeNumber = (value, defaultValue = 0) => {
  if (value === null || value === undefined) return defaultValue
  const num = Number(value)
  return isNaN(num) ? defaultValue : num
}

// Helper function to safely get string value
const safeString = (value, defaultValue = "") => {
  if (value === null || value === undefined) return defaultValue
  return String(value)
}

// Function to fetch current stock price from our existing API route
const getCurrentPrice = async (symbol) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/stock-price/current/${symbol}`)
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API returned ${response.status}: ${errorText}`)
    }
    const data = await response.json()
    return data.price
  } catch (error) {
    console.error(`Error fetching current price for ${symbol}:`, error)
    return 0
  }
}

export async function GET() {
  try {
    // Fetch all signals data
    const [newsRes, gtrendRes, twitterRes] = await Promise.all([
      pool.query(`SELECT date, comp_symbol, sentiment, entry_price FROM news_signals_full`),
      pool.query(`SELECT date, comp_symbol, sentiment, entry_price FROM gtrend_signals_full`),
      pool.query(`SELECT date, comp_symbol, sentiment, entry_price FROM twitter_signals_full`),
    ])

    const newsSignals = newsRes.rows
    const gtrendSignals = gtrendRes.rows
    const twitterSignals = twitterRes.rows

    // Collect all unique symbols
    const allSymbols = new Set()
    newsSignals.forEach((s) => allSymbols.add(s.comp_symbol))
    gtrendSignals.forEach((s) => allSymbols.add(s.comp_symbol))
    twitterSignals.forEach((s) => allSymbols.add(s.comp_symbol))

    // Fetch current prices for all unique symbols
    const currentPrices = {}
    const pricePromises = Array.from(allSymbols).map(async (symbol) => {
      currentPrices[symbol] = await getCurrentPrice(symbol)
    })
    await Promise.all(pricePromises)

    // Function to calculate win rate for a given set of signals
    const calculateWinRate = (signals) => {
      let wins = 0
      let losses = 0

      signals.forEach((signal) => {
        const currentPrice = currentPrices[signal.comp_symbol] || 0
        const entryPrice = safeNumber(signal.entry_price)

        if (entryPrice === 0) return // Cannot calculate P/L if entry price is 0

        if (safeString(signal.sentiment).toLowerCase() === "positive") {
          if (currentPrice >= entryPrice) {
            wins++
          } else {
            losses++
          }
        } else if (safeString(signal.sentiment).toLowerCase() === "negative") {
          if (currentPrice <= entryPrice) {
            wins++
          } else {
            losses++
          }
        }
        // Neutral signals are ignored for win/loss calculation
      })

      const totalTrades = wins + losses
      return totalTrades > 0 ? (wins / totalTrades) * 100 : 0
    }

    const newsWinRate = calculateWinRate(newsSignals)
    const gtrendWinRate = calculateWinRate(gtrendSignals)
    const twitterWinRate = calculateWinRate(twitterSignals)

    return Response.json({
      news: newsWinRate,
      googleTrends: gtrendWinRate,
      twitter: twitterWinRate,
    })
  } catch (error) {
    console.error("API error fetching aggregated win rates:", error)
    return Response.json({ error: "Failed to fetch aggregated win rates" }, { status: 500 })
  }
}
