"use client"

import { createContext, useContext, useState } from "react"
import { ToastContainer } from "@/components/ui/toast"

const ToastContext = createContext({
  toast: ({ title, description, variant, duration }) => {},
  toasts: [],
})

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = ({ title, description, variant = "default", duration = 5000 }) => {
    const id = Math.random().toString(36).substring(2, 9)

    const newToast = {
      id,
      title,
      description,
      variant,
      visible: true,
    }

    setToasts((prevToasts) => [...prevToasts, newToast])

    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.map((toast) => (toast.id === id ? { ...toast, visible: false } : toast)))

      // Remove from DOM after animation
      setTimeout(() => {
        setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
      }, 300)
    }, duration)

    return id
  }

  const handleClose = (id) => {
    setToasts((prevToasts) => prevToasts.map((toast) => (toast.id === id ? { ...toast, visible: false } : toast)))

    // Remove from DOM after animation
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
    }, 300)
  }

  return (
    <ToastContext.Provider value={{ toast, toasts }}>
      {children}
      <ToastContainer toasts={toasts} onClose={handleClose} />
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
