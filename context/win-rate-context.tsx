"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"

type WinRates = {
  news: number | null
  googleTrends: number | null
  twitter: number | null
}

type WinRateContextType = {
  winRates: WinRates
  setNewsWinRate: (rate: number) => void
  setGoogleTrendsWinRate: (rate: number) => void
  setTwitterWinRate: (rate: number) => void
}

const WinRateContext = createContext<WinRateContextType | undefined>(undefined)

export function WinRateProvider({ children }: { children: React.ReactNode }) {
  const [winRates, setWinRates] = useState<WinRates>({
    news: null,
    googleTrends: null,
    twitter: null,
  })

  const setNewsWinRate = useCallback((rate: number) => {
    setWinRates((prev) => ({ ...prev, news: rate }))
  }, [])

  const setGoogleTrendsWinRate = useCallback((rate: number) => {
    setWinRates((prev) => ({ ...prev, googleTrends: rate }))
  }, [])

  const setTwitterWinRate = useCallback((rate: number) => {
    setWinRates((prev) => ({ ...prev, twitter: rate }))
  }, [])

  return (
    <WinRateContext.Provider
      value={{
        winRates,
        setNewsWinRate,
        setGoogleTrendsWinRate,
        setTwitterWinRate,
      }}
    >
      {children}
    </WinRateContext.Provider>
  )
}

export function useWinRates() {
  const context = useContext(WinRateContext)
  if (context === undefined) {
    throw new Error("useWinRates must be used within a WinRateProvider")
  }
  return context
}
