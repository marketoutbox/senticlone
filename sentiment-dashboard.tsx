"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ArrowUp,
  ArrowDown,
  Activity,
  BarChart3,
  Edit2,
  Lock,
  Unlock,
  RotateCw,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StockSelector } from "./components/stock-selector"
import { StockDetailView } from "./components/stock-detail-view"
import { CorrelationChart } from "./components/correlation-chart"
import StockAllocation from "./components/stock-allocation"
import { useAuth } from "@/context/auth-context"
import {
  saveBasket,
  getMostRecentBasket,
  getAllUserBaskets,
  getBasketById,
  deleteBasket,
  type StockBasket,
  type BasketStock,
} from "@/lib/basket-service"
import { useToast } from "@/hooks/use-toast"
import { Slider } from "@/components/ui/slider"

const SentimentDashboard = () => {
  // Auth context
  const { user } = useAuth()
  const { toast } = useToast()

  // State for time period and source weights
  const [timePeriod, setTimePeriod] = useState("1w")
  const [weights, setWeights] = useState({
    twitter: 0.4,
    googleTrends: 0.3,
    news: 0.3,
  })

  // Add this after the weights state
  const [weightLocks, setWeightLocks] = useState({
    twitter: false,
    googleTrends: false,
    news: false,
  })

  // Sample basket of stocks with allocation percentages
  const [stocks, setStocks] = useState([
    { id: 1, symbol: "AAPL", name: "Apple Inc.", sector: "Technology", allocation: 25, locked: false },
    { id: 2, symbol: "MSFT", name: "Microsoft Corp.", sector: "Technology", allocation: 20, locked: true },
    { id: 3, symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Cyclical", allocation: 20, locked: false },
    { id: 4, symbol: "TSLA", name: "Tesla Inc.", sector: "Automotive", allocation: 15, locked: false },
    { id: 5, symbol: "META", name: "Meta Platforms Inc.", sector: "Technology", allocation: 20, locked: true },
  ])

  // State for basket management
  const [basketName, setBasketName] = useState("Tech Leaders")
  const [basketId, setBasketId] = useState<string | null>(null)
  const [basketLocked, setBasketLocked] = useState(false)
  const [basketDates, setBasketDates] = useState({
    created: null,
    updated: null,
  })

  // State for basket management
  const [allBaskets, setAllBaskets] = useState<StockBasket[]>([])
  const [selectedBasketId, setSelectedBasketId] = useState<string | null>(null)
  const [isLoadingBaskets, setIsLoadingBaskets] = useState(false)

  // State for loading
  const [isLoading, setIsLoading] = useState(false)

  // Sample sentiment data
  const sentimentData = {
    "1d": generateSentimentData(1),
    "1w": generateSentimentData(7),
    "1m": generateSentimentData(30),
  }

  // Sample correlation data
  const correlationData = {
    twitter: 0.68,
    googleTrends: 0.42,
    news: 0.53,
  }

  // State for stock selector dialog
  const [isStockSelectorOpen, setIsStockSelectorOpen] = useState(false)

  // State for selected stock
  const [selectedStock, setSelectedStock] = useState(null)

  // State for allocation editor
  const [isAllocationEditorOpen, setIsAllocationEditorOpen] = useState(false)

  // State for premium features card index
  const [premiumFeatureIndex, setPremiumFeatureIndex] = useState(0)

  // State for premium features
  const premiumFeatures = [
    {
      title: "User Benchmarking",
      description: "Compare your sentiment-based returns against other users",
      value: "+3.2%",
      comparison: "outperforming 78% of users",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: "Sentiment-Price Correlation",
      description: "Detailed analysis of sentiment impact on price movements",
      value: "0.72",
      comparison: "Strong positive correlation",
      icon: <Activity className="h-5 w-5" />,
    },
    {
      title: "Predictive Signals",
      description: "Early indicators of sentiment shifts before price movement",
      value: "4",
      comparison: "active signals available",
      icon: <ArrowUp className="h-5 w-5" />,
    },
  ]

  // State for section collapse
  const [sectionsCollapsed, setSectionsCollapsed] = useState({
    inputs: false,
    insights: false,
    tracking: false,
  })

  // Load user's baskets and most recent basket when component mounts
  useEffect(() => {
    if (user) {
      loadUserBaskets()
      loadMostRecentBasket()
    }
  }, [user])

  // Load all user baskets
  const loadUserBaskets = async () => {
    setIsLoadingBaskets(true)
    try {
      const { baskets, error } = await getAllUserBaskets()

      if (error) {
        console.error("Error loading baskets:", error)
        return
      }

      if (baskets) {
        setAllBaskets(baskets)
      }
    } catch (error) {
      console.error("Error in loadUserBaskets:", error)
    } finally {
      setIsLoadingBaskets(false)
    }
  }

  // Load a specific basket
  const loadBasket = async (basketId: string) => {
    setIsLoading(true)
    try {
      const { basket, stocks: basketStocks, error } = await getBasketById(basketId)

      if (error) {
        console.error("Error loading basket:", error)
        toast({
          title: "Error",
          description: "Failed to load the selected basket. Please try again.",
          variant: "destructive",
        })
        return
      }

      if (basket) {
        // Update the state with the loaded basket
        setBasketId(basket.id)
        setSelectedBasketId(basket.id)
        setBasketName(basket.name)
        setBasketLocked(basket.is_locked)
        setWeights(basket.source_weights)

        // Convert dates
        if (basket.created_at) {
          setBasketDates({
            created: new Date(basket.created_at),
            updated: basket.updated_at ? new Date(basket.updated_at) : null,
          })
        }

        // Convert stocks format
        if (basketStocks && basketStocks.length > 0) {
          const formattedStocks = basketStocks.map((stock) => ({
            id: stock.id,
            symbol: stock.symbol,
            name: stock.name,
            sector: stock.sector,
            allocation: stock.allocation,
            locked: stock.is_locked,
          }))
          setStocks(formattedStocks)
        } else {
          setStocks([])
        }

        toast({
          title: "Basket Loaded",
          description: `Successfully loaded "${basket.name}" basket.`,
        })
      }
    } catch (error) {
      console.error("Error in loadBasket:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load the most recent basket
  const loadMostRecentBasket = async () => {
    setIsLoading(true)
    try {
      const { basket, stocks: basketStocks, error } = await getMostRecentBasket()

      if (error) {
        console.error("Error loading basket:", error)
        toast({
          title: "Error",
          description: "Failed to load your basket. Please try again.",
          variant: "destructive",
        })
        return
      }

      if (basket) {
        // Update the state with the loaded basket
        setBasketId(basket.id)
        setSelectedBasketId(basket.id)
        setBasketName(basket.name)
        setBasketLocked(basket.is_locked)
        setWeights(basket.source_weights)

        // Convert dates
        if (basket.created_at) {
          setBasketDates({
            created: new Date(basket.created_at),
            updated: basket.updated_at ? new Date(basket.updated_at) : null,
          })
        }

        // Convert stocks format
        if (basketStocks && basketStocks.length > 0) {
          const formattedStocks = basketStocks.map((stock) => ({
            id: stock.id,
            symbol: stock.symbol,
            name: stock.name,
            sector: stock.sector,
            allocation: stock.allocation,
            locked: stock.is_locked,
          }))
          setStocks(formattedStocks)
        }
      }
    } catch (error) {
      console.error("Error in loadMostRecentBasket:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Save the current basket to the database
  const saveCurrentBasket = async (isLocked = false, forceNew = false) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save your basket.",
        variant: "destructive",
      })
      return
    }

    if (!basketName.trim()) {
      toast({
        title: "Basket Name Required",
        description: "Please enter a name for your basket.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Format the basket data
      const basketData: StockBasket = {
        id: forceNew ? undefined : basketId,
        name: basketName,
        source_weights: weights,
        is_locked: isLocked,
      }

      // Format the stocks data
      const stocksData: BasketStock[] = stocks.map((stock) => ({
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sector || "Unknown",
        allocation: stock.allocation,
        is_locked: stock.locked,
      }))

      // Save the basket
      const { error, basketId: newBasketId } = await saveBasket(basketData, stocksData, forceNew)

      if (error) {
        console.error("Error saving basket:", error)
        toast({
          title: "Error",
          description: "Failed to save your basket. Please try again.",
          variant: "destructive",
        })
        return
      }

      // Update the basket ID
      if (newBasketId) {
        setBasketId(newBasketId)
        setSelectedBasketId(newBasketId)
      }

      toast({
        title: "Success",
        description: forceNew ? "New basket created successfully." : "Your basket has been saved.",
      })

      // If locking the basket, update the state
      if (isLocked) {
        setBasketLocked(true)
        const now = new Date()
        setBasketDates({
          created: basketDates.created || now,
          updated: now,
        })
      }

      // Reload baskets list
      await loadUserBaskets()
    } catch (error) {
      console.error("Error in saveCurrentBasket:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle basket selection change
  const handleBasketChange = (basketId: string) => {
    if (basketId === "new") {
      // Create new basket
      setBasketId(null)
      setSelectedBasketId(null)
      setBasketName("")
      setBasketLocked(false)
      setStocks([])
      setWeights({
        twitter: 0.4,
        googleTrends: 0.3,
        news: 0.3,
      })
      setBasketDates({
        created: null,
        updated: null,
      })
    } else {
      loadBasket(basketId)
    }
  }

  // Handle basket deletion
  const handleDeleteBasket = async (basketIdToDelete: string) => {
    if (!basketIdToDelete) return

    setIsLoading(true)
    try {
      const { error } = await deleteBasket(basketIdToDelete)

      if (error) {
        console.error("Error deleting basket:", error)
        toast({
          title: "Error",
          description: "Failed to delete the basket. Please try again.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Basket deleted successfully.",
      })

      // If we deleted the current basket, reset to new basket
      if (basketIdToDelete === basketId) {
        handleBasketChange("new")
      }

      // Reload baskets list
      await loadUserBaskets()
    } catch (error) {
      console.error("Error in handleDeleteBasket:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle section collapse
  const toggleSection = (section) => {
    setSectionsCollapsed({
      ...sectionsCollapsed,
      [section]: !sectionsCollapsed[section],
    })
  }

  // Update the handleSaveStocks function to ensure new stocks start with 0% allocation
  // Function to handle saving stocks from the stock selector
  const handleSaveStocks = (newStocks) => {
    // If these are stocks from the StockAllocation component, just update them directly
    if (newStocks.length > 0 && newStocks[0].hasOwnProperty("allocation")) {
      // Remove duplicates by id before setting
      const uniqueStocks = newStocks.filter((stock, index, self) => index === self.findIndex((s) => s.id === stock.id))
      setStocks(uniqueStocks)
      if (basketId) {
        saveCurrentBasket(basketLocked)
      }
      return
    }

    // Otherwise, this is from the StockSelector - handle adding new stocks
    const existingStockIds = stocks.map((stock) => stock.id)
    const brandNewStocks = newStocks.filter((stock) => !existingStockIds.includes(stock.id))
    const continuingStocks = newStocks.filter((stock) => existingStockIds.includes(stock.id))

    // Preserve allocations and locked status for existing stocks
    const updatedContinuingStocks = continuingStocks.map((newStock) => {
      const existingStock = stocks.find((s) => s.id === newStock.id)
      return {
        ...newStock,
        allocation: existingStock?.allocation || 0,
        locked: existingStock?.locked || false,
      }
    })

    // Set new stocks to 0% allocation by default
    const updatedNewStocks = brandNewStocks.map((stock) => ({
      ...stock,
      allocation: 0,
      locked: false,
    }))

    // Combine continuing and new stocks, ensuring no duplicates
    const finalStocks = [...updatedContinuingStocks, ...updatedNewStocks]
    const uniqueFinalStocks = finalStocks.filter(
      (stock, index, self) => index === self.findIndex((s) => s.id === stock.id),
    )

    setStocks(uniqueFinalStocks)
    if (basketId) {
      saveCurrentBasket(basketLocked)
    }
  }

  // Generate weighted composite sentiment
  const calculateWeightedSentiment = () => {
    return sentimentData[timePeriod].map((day) => {
      const weightedSentiment =
        day.twitterSentiment * weights.twitter +
        day.googleTrendsSentiment * weights.googleTrends +
        day.newsSentiment * weights.news

      return {
        ...day,
        compositeSentiment: Number.parseFloat(weightedSentiment.toFixed(2)),
      }
    })
  }

  // Add these functions after the calculateWeightedSentiment function
  // Function to toggle lock status of a weight
  const toggleWeightLock = (source) => {
    setWeightLocks({
      ...weightLocks,
      [source]: !weightLocks[source],
    })
  }

  // Update the handleWeightChange function to respect locks
  const handleWeightChange = (source, value) => {
    const newValue = Number.parseFloat(value[0])

    // Calculate how much we need to adjust other weights to maintain sum = 1
    const otherSources = Object.keys(weights).filter((key) => key !== source && !weightLocks[key])

    // If all other sources are locked, we can't adjust
    if (otherSources.length === 0) {
      // Just update this source and normalize
      const newWeights = { ...weights, [source]: newValue }
      const sum = Object.values(newWeights).reduce((a, b) => a + b, 0)

      // Normalize to ensure sum is exactly 1
      if (Math.abs(sum - 1) > 0.001) {
        // Adjust this source to make sum = 1
        newWeights[source] = newValue + (1 - sum)
      }

      setWeights(newWeights)
      return
    }

    // Calculate the total weight that should be distributed among other sources
    const remainingWeight =
      1 -
      newValue -
      Object.keys(weights)
        .filter((key) => key !== source && weightLocks[key])
        .reduce((sum, key) => sum + weights[key], 0)

    // Calculate the current sum of other unlocked weights
    const currentOtherSum = otherSources.reduce((sum, key) => sum + weights[key], 0)

    // Create new weights object
    const newWeights = { ...weights, [source]: newValue }

    // If other weights sum to zero, distribute evenly
    if (currentOtherSum === 0) {
      const evenDistribution = remainingWeight / otherSources.length
      otherSources.forEach((key) => {
        newWeights[key] = evenDistribution
      })
    } else {
      // Otherwise, distribute proportionally
      otherSources.forEach((key) => {
        const proportion = weights[key] / currentOtherSum
        newWeights[key] = remainingWeight * proportion
      })
    }

    // Ensure all weights are non-negative and sum to 1
    Object.keys(newWeights).forEach((key) => {
      newWeights[key] = Math.max(0, newWeights[key])
    })

    // Normalize to ensure sum is exactly 1
    const sum = Object.values(newWeights).reduce((a, b) => a + b, 0)
    if (sum > 0 && Math.abs(sum - 1) > 0.001) {
      // Find an unlocked source to adjust
      const adjustSource = otherSources.length > 0 ? otherSources[0] : source
      newWeights[adjustSource] += 1 - sum
    }

    setWeights(newWeights)

    // Save the updated weights to the database if the basket is already saved
    if (basketId) {
      saveCurrentBasket(basketLocked)
    }
  }

  const weightedData = calculateWeightedSentiment()

  // Update the handleWeightChange function to ensure weights sum to 100%

  // Function to handle clicking on a stock
  const handleStockClick = (stock) => {
    if (!stock) return // Guard clause to prevent clicking on undefined stock

    // Find the full stock data with price
    const stockWithPrice = stockPerformanceData.find((s) => s.id === stock.id) || {
      ...stock,
      price: 100, // Default price if not found
      change: 0, // Default change if not found
    }

    setSelectedStock(stockWithPrice)
  }

  // Function to toggle lock status of a stock
  const handleToggleLock = (stockId) => {
    const updatedStocks = stocks.map((stock) => (stock.id === stockId ? { ...stock, locked: !stock.locked } : stock))
    setStocks(updatedStocks)

    // Save the updated stocks to the database if the basket is already saved
    if (basketId) {
      saveCurrentBasket(basketLocked)
    }
  }

  // Function to reset allocations to equal distribution
  const handleResetAllocations = () => {
    // Create a copy of stocks
    const updatedStocks = [...stocks]

    // Calculate total allocation of locked stocks
    const lockedStocks = updatedStocks.filter((stock) => stock.locked)
    const lockedAllocation = lockedStocks.reduce((sum, stock) => sum + stock.allocation, 0)

    // Calculate number of unlocked stocks
    const unlockedStocks = updatedStocks.filter((stock) => !stock.locked)
    const unlockedCount = unlockedStocks.length

    if (unlockedCount === 0) {
      // If all stocks are locked, we can't reset
      return
    }

    // Calculate equal distribution for unlocked stocks
    const remainingAllocation = 100 - lockedAllocation
    const equalAllocation = Math.floor(remainingAllocation / unlockedCount)

    // Distribute equally among unlocked stocks
    updatedStocks.forEach((stock) => {
      if (!stock.locked) {
        stock.allocation = equalAllocation
      }
    })

    // Adjust for rounding errors
    const newTotal = updatedStocks.reduce((sum, stock) => sum + stock.allocation, 0)
    if (newTotal < 100) {
      // Find the first unlocked stock to adjust
      const firstUnlockedStock = updatedStocks.find((stock) => !stock.locked)
      if (firstUnlockedStock) {
        firstUnlockedStock.allocation += 100 - newTotal
      }
    }

    setStocks(updatedStocks)

    // Save the updated stocks to the database if the basket is already saved
    if (basketId) {
      saveCurrentBasket(basketLocked)
    }
  }

  // Function to update stock allocation using slider
  const handleAllocationChange = (stockId, newAllocation) => {
    // Create a copy of stocks
    const updatedStocks = [...stocks]

    // Find the stock to update
    const stockIndex = updatedStocks.findIndex((s) => s.id === stockId)
    if (stockIndex === -1) return

    // Calculate the difference in allocation
    const oldAllocation = updatedStocks[stockIndex].allocation
    const difference = newAllocation - oldAllocation

    // Update the allocation for the selected stock
    updatedStocks[stockIndex].allocation = newAllocation

    // Find unlocked stocks to adjust (excluding the one being modified)
    const unlockedStocks = updatedStocks.filter((s) => !s.locked && s.id !== stockId)

    if (unlockedStocks.length > 0) {
      // Get the total allocation of unlocked stocks (excluding the one being modified)
      const totalUnlockedAllocation = unlockedStocks.reduce((sum, s) => sum + s.allocation, 0)

      // Adjust each unlocked stock proportionally
      updatedStocks.forEach((stock) => {
        if (!stock.locked && stock.id !== stockId) {
          // Calculate the proportion this stock represents of all unlocked stocks
          const proportion =
            totalUnlockedAllocation > 0 ? stock.allocation / totalUnlockedAllocation : 1 / unlockedStocks.length
          // Reduce this stock's allocation proportionally
          stock.allocation = Math.max(0, stock.allocation - difference * proportion)
        }
      })

      // Ensure total allocation is exactly 100%
      const totalAllocation = updatedStocks.reduce((sum, stock) => sum + stock.allocation, 0)
      if (Math.abs(totalAllocation - 100) > 0.01) {
        // Find the first unlocked stock that's not the one we're updating
        const adjustmentStock = updatedStocks.find((s) => !s.locked && s.id !== stockId)
        if (adjustmentStock) {
          adjustmentStock.allocation += 100 - totalAllocation
        }
      }
    }

    // Round all allocations to integers
    updatedStocks.forEach((stock) => {
      stock.allocation = Math.round(stock.allocation)
    })

    setStocks(updatedStocks)

    // Save the updated stocks to the database if the basket is already saved
    if (basketId) {
      saveCurrentBasket(basketLocked)
    }
  }

  // Generate stock performance data
  const stockPerformanceData = stocks.map((stock) => {
    const basePerformance = Math.random() * 10 - 5 // Random between -5% and +5%
    const compositeSentiment = weightedData[weightedData.length - 1].compositeSentiment
    const sentimentImpact = compositeSentiment > 0 ? compositeSentiment * 2 : compositeSentiment
    const performance = Number.parseFloat((basePerformance + sentimentImpact).toFixed(2))

    // Generate a random price between 50 and 500
    const price = Number.parseFloat((Math.random() * 450 + 50).toFixed(2))
    const change = performance // Use performance as the change percentage

    return {
      ...stock,
      price,
      change,
      performance,
      twitterSentiment: weightedData[weightedData.length - 1].twitterSentiment,
      googleTrendsSentiment: weightedData[weightedData.length - 1].googleTrendsSentiment,
      newsSentiment: weightedData[weightedData.length - 1].compositeSentiment,
      compositeSentiment: weightedData[weightedData.length - 1].compositeSentiment,
    }
  })

  // Color function for sentiment
  const getSentimentColor = (value) => {
    if (value > 0.3) return "text-emerald-500"
    if (value >= -0.3) return "text-amber-500"
    return "text-red-500"
  }

  // Color function for performance
  const getPerformanceColor = (value) => {
    if (value > 0) return "text-emerald-500"
    return "text-red-500"
  }

  // Get sentiment icon
  const getSentimentIcon = (value) => {
    if (value > 0.3) return <ArrowUp className="h-4 w-4 text-emerald-500" />
    if (value >= -0.3) return <Activity className="h-4 w-4 text-amber-500" />
    return <ArrowDown className="h-4 w-4 text-red-500" />
  }

  // Get overall sentiment status
  const getOverallSentiment = () => {
    const latestComposite = weightedData[weightedData.length - 1].compositeSentiment

    if (latestComposite > 0.5) return { text: "Very Positive", color: "bg-emerald-500" }
    if (latestComposite > 0.2) return { text: "Positive", color: "bg-emerald-400" }
    if (latestComposite > -0.2) return { text: "Neutral", color: "bg-amber-400" }
    if (latestComposite > -0.5) return { text: "Negative", color: "bg-red-400" }
    return { text: "Very Negative", color: "bg-red-500" }
  }

  const overallSentiment = getOverallSentiment()

  // Function to handle locking in the basket
  const handleLockBasket = () => {
    // Save the basket with locked status
    saveCurrentBasket(true)

    // Scroll to the basket tracking section
    setTimeout(() => {
      const trackingSection = document.getElementById("tracking-section")
      if (trackingSection) {
        trackingSection.scrollIntoView({ behavior: "smooth" })
      }
    }, 100)
  }

  // Format date for display
  const formatDate = (date) => {
    if (!date) return "N/A"
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        {isLoading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card p-6 rounded-lg shadow-xl flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-card-foreground">
                {isLoadingBaskets ? "Loading baskets..." : "Saving your basket..."}
              </span>
            </div>
          </div>
        )}
        {selectedStock ? (
          <StockDetailView stock={selectedStock} onBack={() => setSelectedStock(null)} timePeriod={timePeriod} />
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Sentiment Analysis Dashboard</h1>
                <p className="text-muted-foreground mt-1">Track market sentiment across multiple data sources</p>
              </div>

              <div className="flex items-center gap-3">
                <Badge className={`${overallSentiment.color} px-3 py-1.5 text-white`}>{overallSentiment.text}</Badge>
                <Tabs defaultValue={timePeriod} onValueChange={setTimePeriod} className="w-[200px]">
                  <TabsList className="grid grid-cols-3">
                    <TabsTrigger value="1d">1D</TabsTrigger>
                    <TabsTrigger value="1w">1W</TabsTrigger>
                    <TabsTrigger value="1m">1M</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Inputs Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-foreground">Inputs</h2>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toggleSection("inputs")}>
                  {sectionsCollapsed.inputs ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                </Button>
              </div>

              {!sectionsCollapsed.inputs && (
                <>
                  {/* Stock Allocation */}
                  <Card className="mb-6">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            Stock Allocation
                          </CardTitle>
                          <CardDescription>
                            Adjust your portfolio allocation and lock in positions based on sentiment
                          </CardDescription>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1"
                          onClick={() => setIsStockSelectorOpen(true)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Edit Basket
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-6">
                        {stocks.map((stock) => {
                          const stockData = stockPerformanceData.find((s) => s.id === stock.id) || stock
                          return (
                            <div key={stock.id} className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-16 font-medium text-foreground">{stock.symbol}</div>
                                  <div className="text-sm text-muted-foreground truncate">{stock.name}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-sm font-medium text-foreground min-w-[3rem] text-right">
                                    {stock.allocation}%
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleToggleLock(stock.id)}
                                  >
                                    {stock.locked ? (
                                      <Lock className="h-4 w-4 text-amber-500" />
                                    ) : (
                                      <Unlock className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </Button>
                                </div>
                              </div>

                              {/* Single Interactive Allocation Bar */}
                              <div className="space-y-2">
                                <div className="relative">
                                  <Slider
                                    value={[stock.allocation]}
                                    max={100}
                                    step={1}
                                    disabled={stock.locked}
                                    onValueChange={(value) => handleAllocationChange(stock.id, value[0])}
                                    className="py-1"
                                  />
                                  {/* Overlay the sentiment color on the slider track */}
                                  <div
                                    className={`absolute top-1/2 left-0 h-2 rounded-full pointer-events-none transform -translate-y-1/2 transition-all duration-300 ${
                                      stockData.compositeSentiment > 0.3
                                        ? "bg-emerald-500/20"
                                        : stockData.compositeSentiment > -0.3
                                          ? "bg-amber-500/20"
                                          : "bg-red-500/20"
                                    }`}
                                    style={{ width: `${stock.allocation}%` }}
                                  />
                                </div>
                                {stock.locked && (
                                  <div className="text-xs text-amber-600 flex items-center gap-1">
                                    <Lock className="h-3 w-3" />
                                    Position locked at {stock.allocation}%
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>

                    <CardFooter className="flex justify-between border-t pt-4">
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">{stocks.filter((s) => s.locked).length}</span>{" "}
                          of {stocks.length} positions locked
                        </div>
                        <Button size="sm" variant="outline" onClick={handleResetAllocations} className="gap-1">
                          <RotateCw className="h-3.5 w-3.5" />
                          Reset
                        </Button>
                      </div>
                      <Button size="sm" onClick={() => setIsAllocationEditorOpen(true)}>
                        Adjust Allocations
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Source Weighting and Correlation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Source Weighting Controls */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-primary" />
                          Source Weighting
                        </CardTitle>
                        <CardDescription>
                          Adjust the influence of each data source on the composite sentiment
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-2">
                              <label className="text-sm text-muted-foreground font-medium">Twitter</label>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium bg-muted text-foreground px-2 py-0.5 rounded">
                                  {(weights.twitter * 100).toFixed(0)}%
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => toggleWeightLock("twitter")}
                                >
                                  {weightLocks.twitter ? (
                                    <Lock className="h-3.5 w-3.5 text-amber-500" />
                                  ) : (
                                    <Unlock className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <Slider
                              defaultValue={[weights.twitter]}
                              value={[weights.twitter]}
                              max={1}
                              step={0.05}
                              onValueChange={(value) => handleWeightChange("twitter", value)}
                              className="py-1"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between mb-2">
                              <label className="text-sm text-muted-foreground font-medium">Google Trends</label>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium bg-muted text-foreground px-2 py-0.5 rounded">
                                  {(weights.googleTrends * 100).toFixed(0)}%
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => toggleWeightLock("googleTrends")}
                                >
                                  {weightLocks.googleTrends ? (
                                    <Lock className="h-3.5 w-3.5 text-amber-500" />
                                  ) : (
                                    <Unlock className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <Slider
                              defaultValue={[weights.googleTrends]}
                              value={[weights.googleTrends]}
                              max={1}
                              step={0.05}
                              onValueChange={(value) => handleWeightChange("googleTrends", value)}
                              className="py-1"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between mb-2">
                              <label className="text-sm text-muted-foreground font-medium">News</label>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium bg-muted text-foreground px-2 py-0.5 rounded">
                                  {(weights.news * 100).toFixed(0)}%
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => toggleWeightLock("news")}
                                >
                                  {weightLocks.news ? (
                                    <Lock className="h-3.5 w-3.5 text-amber-500" />
                                  ) : (
                                    <Unlock className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <Slider
                              defaultValue={[weights.news]}
                              value={[weights.news]}
                              max={1}
                              step={0.05}
                              onValueChange={(value) => handleWeightChange("news", value)}
                              className="py-1"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Sentiment-Performance Correlation */}
                    <CorrelationChart stocks={stocks} weights={weights} />
                  </div>

                  {/* Enhanced Basket Management Section */}
                  <div className="mt-8">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-primary" />
                          Basket Management
                        </CardTitle>
                        <CardDescription>
                          Manage your stock baskets - create new ones or select from existing baskets
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Basket Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">
                              Select Basket
                            </label>
                            <Select value={selectedBasketId || "new"} onValueChange={handleBasketChange}>
                              <SelectTrigger className="bg-background border-border">
                                <SelectValue placeholder="Select a basket" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">
                                  <div className="flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    Create New Basket
                                  </div>
                                </SelectItem>
                                {allBaskets.map((basket) => (
                                  <SelectItem key={basket.id} value={basket.id}>
                                    <div className="flex items-center justify-between w-full">
                                      <span>{basket.name}</span>
                                      {basket.is_locked && <Lock className="h-3 w-3 text-amber-500 ml-2" />}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">Basket Name</label>
                            <Input
                              value={basketName}
                              onChange={(e) => setBasketName(e.target.value)}
                              className="bg-background border-border"
                              placeholder="Enter basket name"
                            />
                          </div>
                        </div>

                        {/* Basket Actions */}
                        <div className="flex flex-wrap gap-2 pt-4 border-t">
                          <Button
                            variant="outline"
                            onClick={() => saveCurrentBasket(false, false)}
                            disabled={!basketName.trim() || isLoading || !basketId}
                            className="gap-1"
                          >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Update Current
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() => saveCurrentBasket(false, true)}
                            disabled={!basketName.trim() || isLoading}
                            className="gap-1"
                          >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            <Plus className="h-4 w-4" />
                            Save as New
                          </Button>

                          <Button
                            onClick={() => saveCurrentBasket(true, false)}
                            disabled={!basketName.trim() || isLoading || basketLocked}
                            className="gap-1"
                          >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            <Lock className="h-4 w-4" />
                            Lock Basket
                          </Button>

                          {basketId && !basketLocked && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteBasket(basketId)}
                              disabled={isLoading}
                              className="gap-1"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          )}
                        </div>

                        {/* Basket Info */}
                        {basketId && (
                          <div className="pt-4 border-t">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Stocks:</span>
                                <span className="font-medium ml-1">{stocks.length}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Locked:</span>
                                <span className="font-medium ml-1">{stocks.filter((s) => s.locked).length}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Created:</span>
                                <span className="font-medium ml-1">{formatDate(basketDates.created)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Updated:</span>
                                <span className="font-medium ml-1">{formatDate(basketDates.updated)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>

            {/* Basket Tracking Section - Only shown after basket is locked */}
            {basketLocked && (
              <div className="mb-8" id="tracking-section">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-foreground">Basket Tracking</h2>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toggleSection("tracking")}>
                    {sectionsCollapsed.tracking ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronUp className="h-5 w-5" />
                    )}
                  </Button>
                </div>

                {!sectionsCollapsed.tracking && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basket Details */}
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            Basket Details
                          </CardTitle>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1"
                            onClick={() => setIsStockSelectorOpen(true)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                        </div>
                        <CardDescription>Information about the current stock basket</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-1 border-b">
                            <span className="text-muted-foreground">Name</span>
                            <span className="font-medium text-foreground">{basketName}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b">
                            <span className="text-muted-foreground">Stocks</span>
                            <span className="font-medium text-foreground">{stocks.length}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b">
                            <span className="text-muted-foreground">Locked Positions</span>
                            <span className="font-medium text-foreground">
                              {stocks.filter((s) => s.locked).length} of {stocks.length}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b">
                            <span className="text-muted-foreground">Created</span>
                            <span className="font-medium text-foreground">{formatDate(basketDates.created)}</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-muted-foreground">Last Updated</span>
                            <span className="font-medium text-foreground">{formatDate(basketDates.updated)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Stock Performance Table */}
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <BarChart3 className="h-5 w-5 text-primary" />
                              Stock Basket Performance
                            </CardTitle>
                            <CardDescription>Performance metrics correlated with sentiment analysis</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Symbol</th>
                                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Sentiment</th>
                                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Performance</th>
                                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {stockPerformanceData.map((stock) => (
                                <tr
                                  key={stock.id}
                                  className="border-b hover:bg-accent transition-colors cursor-pointer"
                                  onClick={() => handleStockClick(stock)}
                                >
                                  <td className="py-3 px-4 font-medium text-foreground">{stock.symbol}</td>
                                  <td className="py-3 px-4 text-right font-medium">
                                    <div className="flex items-center justify-end gap-1">
                                      {getSentimentIcon(stock.compositeSentiment)}
                                      <span className={getSentimentColor(stock.compositeSentiment)}>
                                        {stock.compositeSentiment.toFixed(2)}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-right font-bold">
                                    <div className="flex items-center justify-end gap-1">
                                      {stock.performance > 0 ? (
                                        <ArrowUp className="h-4 w-4 text-emerald-500" />
                                      ) : (
                                        <ArrowDown className="h-4 w-4 text-red-500" />
                                      )}
                                      <span className={getPerformanceColor(stock.performance)}>
                                        {stock.performance > 0 ? "+" : ""}
                                        {stock.performance}%
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    {stock.locked ? (
                                      <Badge variant="outline" className="border-amber-500 text-amber-600">
                                        Locked
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="border-muted-foreground text-muted-foreground"
                                      >
                                        Flexible
                                      </Badge>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t text-center text-muted-foreground text-sm">
              <p>© 2025 Sentiment Analysis Dashboard. Data refreshes every 15 minutes.</p>
            </div>
            <StockSelector
              open={isStockSelectorOpen}
              onOpenChange={setIsStockSelectorOpen}
              initialStocks={stocks}
              onSave={handleSaveStocks}
            />
            <StockAllocation
              open={isAllocationEditorOpen}
              onOpenChange={setIsAllocationEditorOpen}
              stocks={stocks}
              onSave={handleSaveStocks}
              onAllocationChange={handleAllocationChange}
              onToggleLock={handleToggleLock}
            />
          </>
        )}
      </div>
    </div>
  )
}

// Helper function to generate sample sentiment data
function generateSentimentData(days) {
  const data = []
  const now = new Date()
  let twitterBaseline = Math.random() * 0.4 + 0.1 // 0.1 to 0.5
  let googleBaseline = Math.random() * 0.4 - 0.2 // -0.2 to 0.2
  let newsBaseline = Math.random() * 0.6 - 0.3 // -0.3 to 0.3

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    // Create some variability in the sentiment
    const twitterVariation = Math.random() * 0.4 - 0.2 // -0.2 to 0.2
    const googleVariation = Math.random() * 0.3 - 0.15 // -0.15 to 0.15
    const newsVariation = Math.random() * 0.5 - 0.25 // -0.25 to 0.25

    // Create some correlation between the sentiments
    const commonFactor = Math.random() * 0.3 - 0.15 // -0.15 to 0.15

    // Calculate sentiments with bounds checking
    const twitterSentiment = clamp(twitterBaseline + twitterVariation + commonFactor, -1, 1)
    const googleTrendsSentiment = clamp(googleBaseline + googleVariation + commonFactor, -1, 1)
    const newsSentiment = clamp(newsBaseline + newsVariation + commonFactor, -1, 1)

    // Format date as MM/DD
    const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`

    data.push({
      date: formattedDate,
      twitterSentiment,
      googleTrendsSentiment,
      newsSentiment,
    })

    // Adjust baselines slightly for trend
    twitterBaseline += Math.random() * 0.1 - 0.05
    googleBaseline += Math.random() * 0.08 - 0.04
    newsBaseline += Math.random() * 0.12 - 0.06

    // Keep baselines in reasonable range
    twitterBaseline = clamp(twitterBaseline, -0.7, 0.7)
    googleBaseline = clamp(googleBaseline, -0.7, 0.7)
    newsBaseline = clamp(newsBaseline, -0.7, 0.7)
  }

  return data
}

// Helper function to clamp a value between min and max
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export default SentimentDashboard
