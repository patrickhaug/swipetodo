import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { pb } from '@/lib/pocketbase'
import { AuthModel } from 'pocketbase'

interface AuthContextType {
  user: AuthModel | null
  isLoading: boolean
  requestOTP: (email: string) => Promise<{ otpId: string }>
  verifyOTP: (otpId: string, code: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthModel | null>(pb.authStore.model)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(false)

    const unsubscribe = pb.authStore.onChange((_, model) => {
      setUser(model)
    })

    return () => unsubscribe()
  }, [])

  const requestOTP = async (email: string) => {
    return await pb.collection('users').requestOTP(email)
  }

  const verifyOTP = async (otpId: string, code: string) => {
    await pb.collection('users').authWithOTP(otpId, code)
  }

  const logout = () => {
    pb.authStore.clear()
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, requestOTP, verifyOTP, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
