import { EventSourcePolyfill } from 'event-source-polyfill'
// @ts-ignore - Polyfill EventSource for React Native
globalThis.EventSource = EventSourcePolyfill

import PocketBase, { AsyncAuthStore } from 'pocketbase'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const AUTH_KEY = 'pb_auth'

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
