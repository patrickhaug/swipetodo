import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface FocusModeContextType {
  isFocusMode: boolean
  toggleFocusMode: () => void
  setFocusMode: (value: boolean) => void
}

const FocusModeContext = createContext<FocusModeContextType | null>(null)

export function FocusModeProvider({ children }: { children: ReactNode }) {
  const [isFocusMode, setIsFocusMode] = useState(true)

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode(prev => !prev)
  }, [])

  const setFocusMode = useCallback((value: boolean) => {
    setIsFocusMode(value)
  }, [])

  return (
    <FocusModeContext.Provider value={{ isFocusMode, toggleFocusMode, setFocusMode }}>
      {children}
    </FocusModeContext.Provider>
  )
}

export function useFocusMode() {
  const context = useContext(FocusModeContext)
  if (!context) {
    throw new Error('useFocusMode must be used within a FocusModeProvider')
  }
  return context
}
