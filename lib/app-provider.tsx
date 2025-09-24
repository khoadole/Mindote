"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

interface AppContextType {
  mounted: boolean
}

const AppContext = createContext<AppContextType>({ mounted: false })

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return <AppContext.Provider value={{ mounted }}>{children}</AppContext.Provider>
}

export const useAppContext = () => useContext(AppContext)
