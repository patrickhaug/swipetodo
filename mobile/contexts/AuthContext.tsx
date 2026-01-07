import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import * as Crypto from 'expo-crypto'
import {
  pb,
  initAuth,
  loadHouseholdConfig,
  saveHouseholdConfig,
  clearHouseholdConfig,
  loginOrCreateUser,
} from '@/lib/pocketbase'
import type { User, Household } from '@/types'

type AuthState = 'loading' | 'no_household' | 'select_user' | 'authenticated'

interface AuthContextType {
  user: User | null
  partner: User | null
  household: Household | null
  authState: AuthState
  isLoading: boolean

  // Household setup
  setupHousehold: (name: string, email1: string, email2: string) => Promise<void>
  joinHousehold: (inviteCode: string, email: string) => Promise<void>

  // User selection & switching
  selectUser: (email: string) => Promise<void>
  switchUser: () => Promise<void>

  // Logout
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [partner, setPartner] = useState<User | null>(null)
  const [household, setHousehold] = useState<Household | null>(null)
  const [authState, setAuthState] = useState<AuthState>('loading')

  // Initialize auth on mount
  useEffect(() => {
    const init = async () => {
      await initAuth()

      const config = await loadHouseholdConfig()

      if (!config) {
        // No household configured - need setup
        setAuthState('no_household')
        return
      }

      // Try to restore session
      if (pb.authStore.isValid && pb.authStore.record) {
        const currentUser = pb.authStore.record as unknown as User
        setUser(currentUser)

        // Load household and partner
        await loadHouseholdData(currentUser.household)
        setAuthState('authenticated')
      } else if (config.currentUserEmail) {
        // Config exists but not logged in - try auto-login
        try {
          await loginOrCreateUser(config.currentUserEmail)
          const currentUser = pb.authStore.record as unknown as User
          setUser(currentUser)

          if (currentUser.household) {
            await loadHouseholdData(currentUser.household)
            setAuthState('authenticated')
          } else {
            // User exists but no household - go to select
            setAuthState('select_user')
          }
        } catch (err) {
          console.error('Auto-login failed:', err)
          setAuthState('select_user')
        }
      } else {
        // Household exists but no user selected
        setAuthState('select_user')
      }
    }

    init()

    const unsubscribe = pb.authStore.onChange((_, record) => {
      if (record) {
        setUser(record as unknown as User)
        if (record.household) {
          loadHouseholdData(record.household as string)
        }
      } else {
        setUser(null)
        setPartner(null)
        setHousehold(null)
      }
    })

    return () => unsubscribe()
  }, [])

  const loadHouseholdData = async (householdId: string) => {
    if (!householdId) return

    try {
      // Load household
      const hh = await pb.collection('households').getOne<Household>(householdId)
      setHousehold(hh)

      // Load partner (other user in same household)
      if (pb.authStore.record) {
        const result = await pb.collection('users').getList<User>(1, 1, {
          filter: pb.filter('household = {:householdId} && id != {:odId}', {
            householdId,
            odId: pb.authStore.record.id,
          }),
        })
        setPartner(result.items[0] || null)
      }
    } catch (err) {
      console.error('Failed to load household data:', err)
    }
  }

  const setupHousehold = async (name: string, email1: string, email2: string) => {
    const normalizedEmail1 = email1.trim().toLowerCase()
    const normalizedEmail2 = email2.trim().toLowerCase()

    let createdHouseholdId: string | null = null
    let user1Id: string | null = null
    let user2Id: string | null = null

    try {
      // Create/login first user
      await loginOrCreateUser(normalizedEmail1)
      const user1 = pb.authStore.record as unknown as User
      user1Id = user1.id

      // Generate invite code using crypto-secure random
      const inviteCode = await generateInviteCode()

      // Create household
      const newHousehold = await pb.collection('households').create<Household>({
        name: name.trim(),
        invite_code: inviteCode,
        created_by: user1.id,
      })
      createdHouseholdId = newHousehold.id

      // Update first user with household
      await pb.collection('users').update(user1.id, {
        household: newHousehold.id,
      })

      // Create second user (logout first, then create)
      pb.authStore.clear()
      await loginOrCreateUser(normalizedEmail2)
      const user2 = pb.authStore.record as unknown as User
      user2Id = user2.id

      // Update second user with household
      await pb.collection('users').update(user2.id, {
        household: newHousehold.id,
      })

      // Log back in as first user (the one who set it up)
      pb.authStore.clear()
      await loginOrCreateUser(normalizedEmail1)

      // Save config
      await saveHouseholdConfig({
        householdId: newHousehold.id,
        currentUserEmail: normalizedEmail1,
      })

      // Update state
      setUser(pb.authStore.record as unknown as User)
      setHousehold(newHousehold)
      setPartner(user2)
      setAuthState('authenticated')
    } catch (err) {
      // Rollback: clean up partially created resources
      try {
        if (createdHouseholdId) {
          await pb.collection('households').delete(createdHouseholdId)
        }
        if (user1Id) {
          await pb.collection('users').update(user1Id, { household: '' })
        }
        if (user2Id) {
          await pb.collection('users').update(user2Id, { household: '' })
        }
      } catch (rollbackErr) {
        console.error('Rollback failed:', rollbackErr)
      }
      throw err
    }
  }

  const joinHousehold = async (inviteCode: string, email: string) => {
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedCode = inviteCode.trim().toUpperCase()

    // Find household by invite code (using parameterized filter)
    const households = await pb.collection('households').getList<Household>(1, 1, {
      filter: pb.filter('invite_code = {:code}', { code: normalizedCode }),
    })

    if (households.items.length === 0) {
      throw new Error('Haushalt nicht gefunden')
    }

    const existingHousehold = households.items[0]

    // Check if household already has 2 members (using parameterized filter)
    const existingMembers = await pb.collection('users').getList<User>(1, 2, {
      filter: pb.filter('household = {:householdId}', { householdId: existingHousehold.id }),
    })

    if (existingMembers.items.length >= 2) {
      throw new Error('Dieser Haushalt hat bereits zwei Mitglieder')
    }

    // Create/login user
    await loginOrCreateUser(normalizedEmail)
    const newUser = pb.authStore.record as unknown as User

    // Update user with household
    await pb.collection('users').update(newUser.id, {
      household: existingHousehold.id,
    })

    // Save config
    await saveHouseholdConfig({
      householdId: existingHousehold.id,
      currentUserEmail: normalizedEmail,
    })

    // Update state
    setUser({ ...newUser, household: existingHousehold.id })
    setHousehold(existingHousehold)
    if (existingMembers.items.length > 0) {
      setPartner(existingMembers.items[0])
    }
    setAuthState('authenticated')
  }

  const selectUser = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase()

    await loginOrCreateUser(normalizedEmail)
    const currentUser = pb.authStore.record as unknown as User

    const config = await loadHouseholdConfig()
    if (config) {
      await saveHouseholdConfig({
        ...config,
        currentUserEmail: normalizedEmail,
      })
    }

    setUser(currentUser)
    if (currentUser.household) {
      await loadHouseholdData(currentUser.household)
      setAuthState('authenticated')
    }
  }

  const switchUser = useCallback(async () => {
    if (!partner) return

    pb.authStore.clear()
    await loginOrCreateUser(partner.email)
    const newUser = pb.authStore.record as unknown as User

    const config = await loadHouseholdConfig()
    if (config) {
      await saveHouseholdConfig({
        ...config,
        currentUserEmail: partner.email,
      })
    }

    // Swap user and partner
    setPartner(user)
    setUser(newUser)
  }, [partner, user])

  const logout = async () => {
    pb.authStore.clear()
    await clearHouseholdConfig()
    setUser(null)
    setPartner(null)
    setHousehold(null)
    setAuthState('no_household')
  }

  const refreshUser = async () => {
    if (!pb.authStore.record?.id) return

    try {
      const updated = await pb.collection('users').getOne<User>(pb.authStore.record.id)
      setUser(updated)
      if (updated.household) {
        await loadHouseholdData(updated.household)
      }
    } catch (err) {
      console.error('Failed to refresh user:', err)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        partner,
        household,
        authState,
        isLoading: authState === 'loading',
        setupHousehold,
        joinHousehold,
        selectUser,
        switchUser,
        logout,
        refreshUser,
      }}
    >
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

// Generate a cryptographically secure 6-character invite code
async function generateInviteCode(): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Avoid confusing chars (0/O, 1/I)
  const randomBytes = await Crypto.getRandomBytesAsync(6)
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(randomBytes[i] % chars.length)
  }
  return code
}
