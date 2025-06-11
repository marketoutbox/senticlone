"use client"

import SentimentDashboard from "../sentiment-dashboard"
import WinRateDisplay from "@/components/win-rate-display"

export default function Home() {
  return (
    <>
      <WinRateDisplay />
      <SentimentDashboard />
    </>
  )
}
