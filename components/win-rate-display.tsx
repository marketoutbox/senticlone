"use client"

import { useWinRates } from "@/context/win-rate-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export function WinRateDisplay() {
  const { winRates } = useWinRates()

  const isLoading = winRates.news === null || winRates.googleTrends === null || winRates.twitter === null

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Overall Signal Win Rates</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="animate-spin w-5 h-5 mr-2 text-primary" />
            <span className="text-muted-foreground">Loading win rates...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center">
              <span className="text-muted-foreground text-sm">News Signals</span>
              <span className="text-foreground text-2xl font-bold">
                {winRates.news !== null ? `${winRates.news.toFixed(2)}%` : "N/A"}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-muted-foreground text-sm">Google Trends Signals</span>
              <span className="text-foreground text-2xl font-bold">
                {winRates.googleTrends !== null ? `${winRates.googleTrends.toFixed(2)}%` : "N/A"}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-muted-foreground text-sm">Twitter Signals</span>
              <span className="text-foreground text-2xl font-bold">
                {winRates.twitter !== null ? `${winRates.twitter.toFixed(2)}%` : "N/A"}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
