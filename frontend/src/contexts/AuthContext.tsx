import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { pb } from '@/lib/pocketbase'
import type { RecordModel } from 'pocketbase'

interface AuthContextType {
  user: RecordModel | null
  partner: RecordModel | null
  isLoading: boolean
  requestOTP: (email: string) => Promise<{ otpId: string }>
  verifyOTP: (otpId: string, code: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<RecordModel | null>(pb.authStore.record)
  const [partner, setPartner] = useState<RecordModel | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch partner when user or household changes
  useEffect(() => {
    const fetchPartner = async () => {
      if (!user?.household) {
        setPartner(null)
        return
      }
      try {
        const members = await pb.collection('users').getList(1, 10, {
          filter: `household = "${user.household}" && id != "${user.id}"`,
          $autoCancel: false,
        })
        setPartner(members.items[0] || null)
      } catch (err) {
        console.error('Failed to fetch partner:', err)
        setPartner(null)
      }
    }
    fetchPartner()
  }, [user?.id, user?.household])

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
    <AuthContext.Provider value={{ user, partner, isLoading, requestOTP, verifyOTP, logout }}>
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
