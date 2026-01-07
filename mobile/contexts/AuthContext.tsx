import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { pb, initAuth } from '@/lib/pocketbase'
import type { User } from '@/types'

interface AuthContextType {
  user: User | null
  partner: User | null
  isLoading: boolean
  requestOTP: (email: string) => Promise<void>
  verifyOTP: (otpId: string, code: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [partner, setPartner] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      await initAuth()

      if (pb.authStore.isValid && pb.authStore.record) {
        setUser(pb.authStore.record as unknown as User)
        await loadPartner(pb.authStore.record.household as string)
      }
      setIsLoading(false)
    }

    init()

    const unsubscribe = pb.authStore.onChange((_, record) => {
      if (record) {
        setUser(record as unknown as User)
        loadPartner(record.household as string)
      } else {
        setUser(null)
        setPartner(null)
      }
    })

    return () => unsubscribe()
  }, [])

  const loadPartner = async (householdId: string) => {
    if (!householdId || !pb.authStore.record) return

    try {
      const result = await pb.collection('users').getList<User>(1, 1, {
        filter: `household = "${householdId}" && id != "${pb.authStore.record.id}"`,
      })
      setPartner(result.items[0] || null)
    } catch (err) {
      console.error('Failed to load partner:', err)
    }
  }

  const requestOTP = async (email: string) => {
    await pb.collection('users').requestOTP(email)
  }

  const verifyOTP = async (otpId: string, code: string) => {
    await pb.collection('users').authWithOTP(otpId, code)
  }

  const logout = async () => {
    pb.authStore.clear()
    setUser(null)
    setPartner(null)
  }

  const refreshUser = async () => {
    if (!pb.authStore.record?.id) return

    try {
      const updated = await pb.collection('users').getOne<User>(pb.authStore.record.id)
      setUser(updated)
      if (updated.household) {
        await loadPartner(updated.household)
      }
    } catch (err) {
      console.error('Failed to refresh user:', err)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      partner,
      isLoading,
      requestOTP,
      verifyOTP,
      logout,
      refreshUser,
    }}>
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
