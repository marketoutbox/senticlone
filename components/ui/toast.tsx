"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastActionElement = React.ReactNode

export interface ToastProps {
  id: string
  title: string
  description?: string
  variant?: "default" | "success" | "error" | "warning" | "destructive"
  visible: boolean
  onClose: () => void
}

export function Toast({ id, title, description, variant = "default", visible, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(visible)

  useEffect(() => {
    setIsVisible(visible)
  }, [visible])

  const variantStyles = {
    default: "bg-slate-800 border-slate-700",
    success: "bg-emerald-900 border-emerald-800",
    error: "bg-red-900 border-red-800",
    warning: "bg-amber-900 border-amber-800",
    destructive: "bg-red-900 border-red-800",
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 w-full max-w-md transform rounded-lg border p-4 shadow-lg transition-all duration-300 ease-in-out",
        variantStyles[variant],
        isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0 pointer-events-none",
      )}
    >
      <div className="flex items-start">
        <div className="flex-1">
          <h3 className="font-medium text-white">{title}</h3>
          {description && <p className="mt-1 text-sm text-slate-300">{description}</p>}
        </div>
        <button
          onClick={onClose}
          className="ml-4 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  )
}

export function ToastContainer({ toasts, onClose }) {
  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          visible={toast.visible}
          onClose={() => onClose(toast.id)}
        />
      ))}
    </div>
  )
}
