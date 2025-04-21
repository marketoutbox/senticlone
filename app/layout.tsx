import type React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import "./globals.css"
import { AuthStatus } from "./components/auth-status"

export const metadata: Metadata = {
  title: "Sentiment Dashboard",
  description: "Track market sentiment across multiple data sources",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="bg-[#0a0b14] text-white min-h-screen">
        <nav className="bg-[#0a0b14] border-b border-gray-800 px-6 py-4">
          <div className="max-w-[1200px] mx-auto flex justify-between">
            <div className="flex space-x-6 overflow-x-auto">
              <Link href="/" className="text-white hover:text-amber-400 transition-colors whitespace-nowrap">
                Home
              </Link>
              <Link
                href="/google-trend-signals"
                className="text-white hover:text-amber-400 transition-colors whitespace-nowrap"
              >
                Google Trends
              </Link>
              <Link
                href="/twitter-signals"
                className="text-white hover:text-amber-400 transition-colors whitespace-nowrap"
              >
                Twitter Signals
              </Link>
              <Link
                href="/news-signals"
                className="text-white hover:text-amber-400 transition-colors whitespace-nowrap"
              >
                News Signals
              </Link>
              <Link
                href="/trade-signals"
                className="text-white hover:text-amber-400 transition-colors whitespace-nowrap"
              >
                Trade Signals
              </Link>
              <Link href="/performance" className="text-white hover:text-amber-400 transition-colors whitespace-nowrap">
                Performance
              </Link>
              <Link
                href="/stock-signal"
                className="text-white hover:text-amber-400 transition-colors whitespace-nowrap"
              >
                Stock Signal
              </Link>
            </div>
            <div>
              <AuthStatus />
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
