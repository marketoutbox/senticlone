"use client"

import type React from "react"

import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/context/auth-context"
import { WinRateProvider } from "@/context/win-rate-context"
import { Toaster } from "@/components/ui/toaster"
import { ToastProvider } from "./toast-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <ToastProvider>
          <WinRateProvider>{children}</WinRateProvider>
          <Toaster />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
