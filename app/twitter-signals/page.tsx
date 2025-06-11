"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Search, ChevronDown, ChevronUp, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts"

interface TwitterSignal {
  date: string
  comp_symbol: string
  analyzed_tweets: number
  sentiment_score: number
  sentiment: string
  entry_price: number
}

interface StockPrice {
  symbol: string
  price: number
  source?: string
}

export default function TwitterSignalsPage() {
  const [data, setData] = useState<TwitterSignal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filteredData, setFilteredData] = useState<TwitterSignal[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sentimentFilter, setSentimentFilter] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState("desc")
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    positive: 0,
    negative: 0,
    neutral: 0,
    lastUpdate: "",
    totalTweets: 0,
    wins: 0, // New
    losses: 0, // New
    winRate: 0, // New
  })

  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({})
  const [pricesLoading, setPricesLoading] = useState(false)

  // Fetch current stock price using our API route
  const getCurrentPrice = async (symbol: string): Promise<number> => {
    try {
      console.log(`Fetching price for ${symbol} from API route`)
      const response = await fetch(`/api/stock-price/current/${symbol}`)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API returned ${response.status}: ${errorText}`)
      }

      const data: StockPrice = await response.json()
      console.log(`Received price for ${symbol}: ${data.price} (source: ${data.source || "unknown"})`)
      return data.price
    } catch (error) {
      console.error(`Error fetching current price for ${symbol}:`, error)
      return 0
    }
  }

  // Fetch current prices for all symbols
  const fetchCurrentPrices = async (symbols: string[]) => {
    setPricesLoading(true)
    console.log(`Fetching prices for ${symbols.length} symbols`)

    const prices: Record<string, number> = {}

    for (const symbol of symbols) {
      try {
        prices[symbol] = await getCurrentPrice(symbol)
      } catch (error) {
        console.error(`Failed to get price for ${symbol}:`, error)
        prices[symbol] = 0
      }
    }

    console.log("All prices fetched:", prices)
    setCurrentPrices(prices)
    setPricesLoading(false)
  }

  // Helper function to format dates safely
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"

    try {
      // If it's already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString

      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Invalid Date"

      return date.toISOString().split("T")[0] // Returns YYYY-MM-DD
    } catch (e) {
      console.error("Date formatting error:", e)
      return "Invalid Date"
    }
  }

  // Helper function to safely get number value
  const safeNumber = (value: any, defaultValue = 0): number => {
    if (value === null || value === undefined) return defaultValue
    const num = Number(value)
    return isNaN(num) ? defaultValue : num
  }

  // Helper function to safely get string value
  const safeString = (value: any, defaultValue = ""): string => {
    if (value === null || value === undefined) return defaultValue
    return String(value)
  }

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        console.log("Fetching Twitter signals...")
        const res = await fetch("/api/twitter-signals")
        console.log("Response status:", res.status)

        if (!res.ok) {
          const errorText = await res.text()
          throw new Error(`API returned ${res.status}: ${errorText}`)
        }

        const rawData = await res.json()
        console.log("Raw Twitter signals data:", rawData)

        if (!Array.isArray(rawData)) {
          throw new Error("Invalid data format received from API")
        }

        // Safely process the data
        const processedData = rawData.map((item: any, index: number) => {
          try {
            return {
              date: formatDate(item.date),
              comp_symbol: safeString(item.comp_symbol, `UNKNOWN_${index}`),
              analyzed_tweets: safeNumber(item.analyzed_tweets, 0),
              sentiment_score: safeNumber(item.sentiment_score, 0),
              sentiment: safeString(item.sentiment, "neutral"),
              entry_price: safeNumber(item.entry_price, 0),
            }
          } catch (itemError) {
            console.error("Error processing item:", item, itemError)
            return {
              date: "Invalid Date",
              comp_symbol: `ERROR_${index}`,
              analyzed_tweets: 0,
              sentiment_score: 0,
              sentiment: "neutral",
              entry_price: 0,
            }
          }
        })

        setData(processedData)
        setFilteredData(processedData)

        // Generate summary stats safely
        try {
          const stats = {
            total: processedData.length,
            positive: processedData.filter(
              (item: TwitterSignal) => safeString(item.sentiment).toLowerCase() === "positive",
            ).length,
            negative: processedData.filter(
              (item: TwitterSignal) => safeString(item.sentiment).toLowerCase() === "negative",
            ).length,
            neutral: processedData.filter(
              (item: TwitterSignal) => safeString(item.sentiment).toLowerCase() === "neutral",
            ).length,
            lastUpdate: processedData.length > 0 ? processedData[0].date : "N/A",
            totalTweets: processedData.reduce(
              (sum: number, item: TwitterSignal) => sum + safeNumber(item.analyzed_tweets, 0),
              0,
            ),
            wins: 0, // Will be calculated in a separate useEffect
            losses: 0, // Will be calculated in a separate useEffect
            winRate: 0, // Will be calculated in a separate useEffect
          }
          setSummaryStats(stats)
        } catch (statsError) {
          console.error("Error generating stats:", statsError)
          setSummaryStats({
            total: 0,
            positive: 0,
            negative: 0,
            neutral: 0,
            lastUpdate: "N/A",
            totalTweets: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
          })
        }
      } catch (err: any) {
        console.error("Error fetching Twitter signals:", err)
        setError(`Failed to load Twitter Signals: ${err.message || "Unknown error"}`)
      } finally {
        setLoading(false)
      }
    }

    fetchSignals()
  }, [])

  useEffect(() => {
    if (data.length > 0) {
      const uniqueSymbols = [...new Set(data.map((item) => item.comp_symbol))]
      console.log(`Found ${uniqueSymbols.length} unique symbols:`, uniqueSymbols)
      fetchCurrentPrices(uniqueSymbols)
    }
  }, [data])

  // New useEffect to calculate Win Rate
  useEffect(() => {
    if (filteredData.length > 0 && !pricesLoading) {
      let wins = 0
      let losses = 0

      filteredData.forEach((signal) => {
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
      const calculatedWinRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0

      setSummaryStats((prevStats) => ({
        ...prevStats,
        wins,
        losses,
        winRate: calculatedWinRate,
      }))
    }
  }, [filteredData, currentPrices, pricesLoading])

  useEffect(() => {
    try {
      // Apply filters and sorting safely
      let result = [...data]

      // Apply sentiment filter
      if (sentimentFilter !== "all") {
        result = result.filter((item) => safeString(item.sentiment).toLowerCase() === sentimentFilter.toLowerCase())
      }

      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        result = result.filter((item) => safeString(item.comp_symbol).toLowerCase().includes(query))
      }

      // Apply sorting
      result.sort((a, b) => {
        try {
          if (sortBy === "date") {
            const dateA = new Date(a.date)
            const dateB = new Date(b.date)
            return dateA.getTime() - dateB.getTime()
          } else if (sortBy === "symbol") {
            return safeString(a.comp_symbol).localeCompare(safeString(b.comp_symbol))
          } else if (sortBy === "sentiment_score") {
            return safeNumber(a.sentiment_score) - safeNumber(b.sentiment_score)
          } else if (sortBy === "tweets") {
            return safeNumber(a.analyzed_tweets) - safeNumber(b.analyzed_tweets)
          }
          return 0
        } catch (sortError) {
          console.error("Sorting error:", sortError)
          return 0
        }
      })

      // Apply sort order
      if (sortOrder === "desc") {
        result.reverse()
      }

      setFilteredData(result)
    } catch (filterError) {
      console.error("Filtering error:", filterError)
      setFilteredData([])
    }
  }, [data, searchQuery, sentimentFilter, sortBy, sortOrder])

  // Generate comparison data safely
  const comparisonData = [
    { symbol: "AAPL", googleTrends: 0.5, twitter: 0.7, news: 0.6 },
    { symbol: "MSFT", googleTrends: 0.6, twitter: 0.7, news: 0.5 },
    { symbol: "AMZN", googleTrends: 0.4, twitter: 0.3, news: 0.2 },
    { symbol: "GOOGL", googleTrends: 0.6, twitter: 0.8, news: 0.7 },
    { symbol: "META", googleTrends: -0.3, twitter: -0.2, news: -0.1 },
    { symbol: "TSLA", googleTrends: 0.3, twitter: 0.4, news: 0.5 },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {" "}
        {/* Updated classes */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">X Signals</h1>
          <p className="text-muted-foreground mt-2">View the latest Twitter sentiment signals for each stock.</p>
        </div>
        {/* Summary Stats Card */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Total Signals</span>
                <span className="text-foreground text-2xl font-bold">{summaryStats.total}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Analyzed Tweets</span>
                <span className="text-foreground text-2xl font-bold">{summaryStats.totalTweets.toLocaleString()}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Win Rate %</span> {/* New Display */}
                <span className="text-foreground text-2xl font-bold">{summaryStats.winRate.toFixed(2)}%</span>{" "}
                {/* New Display */}
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Positive Signals</span>
                <span className="text-green-600 text-2xl font-bold">{summaryStats.positive}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Negative Signals</span>
                <span className="text-red-600 text-2xl font-bold">{summaryStats.negative}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Last updated: {summaryStats.lastUpdate}</span>
            </div>
          </CardContent>
        </Card>
        {/* Filters and Controls */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row flex-wrap gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by symbol..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by sentiment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sentiments</SelectItem>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="symbol">Symbol</SelectItem>
                    <SelectItem value="sentiment_score">Sentiment Score</SelectItem>
                    <SelectItem value="tweets">Analyzed Tweets</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                >
                  {sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Table View */}
        <Card className="mb-8">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin w-6 h-6 mr-2 text-primary" />
                <span className="text-muted-foreground">Loading sentiment data...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col justify-center items-center h-64 space-y-4">
                <p className="text-red-500 text-center">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline">
                  Retry
                </Button>
              </div>
            ) : filteredData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-6 py-4 font-medium text-muted-foreground">Date</th>
                      <th className="px-6 py-4 font-medium text-muted-foreground">Symbol</th>
                      <th className="px-6 py-4 font-medium text-right text-muted-foreground">Analyzed Tweets</th>
                      <th className="px-6 py-4 font-medium text-right text-muted-foreground">Sentiment Score</th>
                      <th className="px-6 py-4 text-center font-medium text-muted-foreground">Sentiment</th>
                      <th className="px-6 py-4 font-medium text-right text-muted-foreground">Entry Price</th>
                      <th className="px-6 py-4 font-medium text-right text-muted-foreground">Current Price</th>
                      <th className="px-6 py-4 font-medium text-right text-muted-foreground">P/L%</th>{" "}
                      {/* Updated Header */}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((signal, i) => {
                      const currentPrice = currentPrices[signal.comp_symbol] || 0
                      const entryPrice = safeNumber(signal.entry_price)
                      let pLPercentage: number | null = null
                      let changeColorClass = ""

                      if (safeString(signal.sentiment).toLowerCase() === "positive") {
                        if (entryPrice !== 0) {
                          pLPercentage = ((currentPrice - entryPrice) / entryPrice) * 100
                        }
                      } else if (safeString(signal.sentiment).toLowerCase() === "negative") {
                        if (entryPrice !== 0) {
                          pLPercentage = ((entryPrice - currentPrice) / entryPrice) * 100 // Inverted for profit
                        }
                      }

                      if (pLPercentage !== null) {
                        changeColorClass = pLPercentage > 0 ? "text-green-600" : pLPercentage < 0 ? "text-red-600" : ""
                      }

                      return (
                        <tr
                          key={`${signal.comp_symbol}-${signal.date}-${i}`}
                          className="border-b border-border hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-6 py-4 text-foreground">{signal.date}</td>
                          <td className="px-6 py-4 font-medium text-foreground">{signal.comp_symbol}</td>
                          <td className="px-6 py-4 text-right text-foreground">{signal.analyzed_tweets}</td>
                          <td className="px-6 py-4 text-right text-foreground">
                            {safeNumber(signal.sentiment_score).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium inline-block
                                ${
                                  safeString(signal.sentiment).toLowerCase() === "positive"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border border-green-200 dark:border-green-800"
                                    : safeString(signal.sentiment).toLowerCase() === "negative"
                                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border border-red-200 dark:border-red-800"
                                      : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                }`}
                            >
                              {signal.sentiment}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-foreground">
                            ${safeNumber(signal.entry_price).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right text-foreground">
                            {pricesLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin inline" />
                            ) : (
                              `$${(currentPrices[signal.comp_symbol] || 0).toFixed(2)}`
                            )}
                          </td>
                          <td className={`px-6 py-4 text-right font-medium ${changeColorClass}`}>
                            {pLPercentage !== null ? `${pLPercentage.toFixed(2)}%` : "N/A"}
                          </td>{" "}
                          {/* Updated Column */}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex justify-center items-center h-64">
                <p className="text-muted-foreground">No Twitter signals found matching your criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Signal Source Comparison */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Signal Source Comparison</CardTitle>
            </div>
            <CardDescription>Compare Twitter with Google Trends and News signals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="symbol" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" domain={[-1, 1]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.375rem",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value: any) => [Number(value).toFixed(2), "Sentiment Score"]}
                  />
                  <Legend />
                  <Bar dataKey="googleTrends" name="Google Trends" fill="#10b981" />
                  <Bar dataKey="twitter" name="Twitter" fill="#3b82f6" />
                  <Bar dataKey="news" name="News" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
