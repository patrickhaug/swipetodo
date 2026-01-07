import { EventSourcePolyfill } from 'event-source-polyfill'
// @ts-ignore - Polyfill EventSource for React Native
globalThis.EventSource = EventSourcePolyfill

import PocketBase, { AsyncAuthStore } from 'pocketbase'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import type { HouseholdConfig } from '@/types'

const AUTH_KEY = 'pb_auth'
const HOUSEHOLD_CONFIG_KEY = 'household_config'

// Default password for simplified auth (users don't need to remember it)
const DEFAULT_PASSWORD = 'swipetodo_household_member_2024'

// Custom auth store for React Native using SecureStore
class SecureAuthStore extends AsyncAuthStore {
  constructor() {
    super({
      save: async (serialized) => {
        if (Platform.OS === 'web') {
          localStorage.setItem(AUTH_KEY, serialized)
        } else {
          await SecureStore.setItemAsync(AUTH_KEY, serialized)
        }
      },
      clear: async () => {
        if (Platform.OS === 'web') {
          localStorage.removeItem(AUTH_KEY)
        } else {
          await SecureStore.deleteItemAsync(AUTH_KEY)
        }
      },
      initial: '', // Will be loaded async
    })
  }

  async loadInitial() {
    try {
      let data: string | null = null
      if (Platform.OS === 'web') {
        data = localStorage.getItem(AUTH_KEY)
      } else {
        data = await SecureStore.getItemAsync(AUTH_KEY)
      }
      if (data) {
        this.save(data)
      }
    } catch (e) {
      console.warn('Failed to load auth from storage:', e)
    }
  }
}

const authStore = new SecureAuthStore()

// Use environment variable or default for local development
const POCKETBASE_URL = process.env.EXPO_PUBLIC_POCKETBASE_URL || 'http://localhost:8090'

export const pb = new PocketBase(POCKETBASE_URL, authStore)

// Initialize auth store from secure storage
export const initAuth = async () => {
  await authStore.loadInitial()
}

// Household config storage functions
export const saveHouseholdConfig = async (config: HouseholdConfig): Promise<void> => {
  const serialized = JSON.stringify(config)
  if (Platform.OS === 'web') {
    localStorage.setItem(HOUSEHOLD_CONFIG_KEY, serialized)
  } else {
    await SecureStore.setItemAsync(HOUSEHOLD_CONFIG_KEY, serialized)
  }
}

export const loadHouseholdConfig = async (): Promise<HouseholdConfig | null> => {
  try {
    let data: string | null = null
    if (Platform.OS === 'web') {
      data = localStorage.getItem(HOUSEHOLD_CONFIG_KEY)
    } else {
      data = await SecureStore.getItemAsync(HOUSEHOLD_CONFIG_KEY)
    }
    return data ? JSON.parse(data) : null
  } catch (e) {
    console.warn('Failed to load household config:', e)
    return null
  }
}

export const clearHouseholdConfig = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(HOUSEHOLD_CONFIG_KEY)
  } else {
    await SecureStore.deleteItemAsync(HOUSEHOLD_CONFIG_KEY)
  }
}

// Simplified auth: create or login user by email
export const loginOrCreateUser = async (email: string): Promise<void> => {
  const normalizedEmail = email.trim().toLowerCase()

  try {
    // Try to login with existing user
    await pb.collection('users').authWithPassword(normalizedEmail, DEFAULT_PASSWORD)
  } catch (err: unknown) {
    // Check if it's an auth failure (400) vs network/server error
    const isAuthError =
      err instanceof Error &&
      'status' in err &&
      (err as { status: number }).status === 400

    if (!isAuthError) {
      // Re-throw network errors, rate limits, server errors
      throw err
    }

    // Auth failed - user doesn't exist, create new one
    await pb.collection('users').create({
      email: normalizedEmail,
      password: DEFAULT_PASSWORD,
      passwordConfirm: DEFAULT_PASSWORD,
      name: normalizedEmail.split('@')[0], // Default name from email
    })
    // Now login
    await pb.collection('users').authWithPassword(normalizedEmail, DEFAULT_PASSWORD)
  }
}

export const DEFAULT_USER_PASSWORD = DEFAULT_PASSWORD
