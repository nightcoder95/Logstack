'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

type AccentColor = 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'yellow' | 'teal'

type ThemeContextType = {
  theme: Theme
  accentColor: AccentColor
  setAccentColor: (color: AccentColor) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme] = useState<Theme>('dark')
  const [accentColor, setAccentColorState] = useState<AccentColor>('red')

  useEffect(() => {
    const stored = localStorage.getItem('accent-color') as AccentColor
    if (stored) {
      setAccentColorState(stored)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.add('dark')
    document.documentElement.setAttribute('data-accent', accentColor)
  }, [accentColor])

  const setAccentColor = (color: AccentColor) => {
    setAccentColorState(color)
    localStorage.setItem('accent-color', color)
    document.documentElement.setAttribute('data-accent', color)
  }

  return (
    <ThemeContext.Provider value={{ theme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
