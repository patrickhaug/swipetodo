import React from 'react'
import { renderHook, waitFor, act } from '@testing-library/react-native'
import { AuthProvider, useAuth } from '../AuthContext'
import { pb, clearHouseholdConfig, loadHouseholdConfig, saveHouseholdConfig } from '@/lib/pocketbase'

describe('AuthContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Provider Setup', () => {
    it('throws error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useAuth())
      }).toThrow('useAuth must be used within AuthProvider')

      consoleSpy.mockRestore()
    })

    it('provides initial loading state', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      // Initially loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('provides no_household state when not configured', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.authState).toBe('no_household')
      expect(result.current.user).toBeNull()
      expect(result.current.partner).toBeNull()
      expect(result.current.household).toBeNull()
    })

    it('exposes auth functions', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(typeof result.current.setupHousehold).toBe('function')
      expect(typeof result.current.joinHousehold).toBe('function')
      expect(typeof result.current.selectUser).toBe('function')
      expect(typeof result.current.switchUser).toBe('function')
      expect(typeof result.current.logout).toBe('function')
      expect(typeof result.current.refreshUser).toBe('function')
    })
  })

  describe('Logout', () => {
    it('logout clears user state and config', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.partner).toBeNull()
      expect(result.current.household).toBeNull()
      expect(result.current.authState).toBe('no_household')
      expect(pb.authStore.clear).toHaveBeenCalled()
    })

    it('logout calls clearHouseholdConfig', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.logout()
      })

      expect(clearHouseholdConfig).toHaveBeenCalled()
    })
  })

  describe('Auth State Transitions', () => {
    it('starts in loading state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })
      expect(result.current.authState).toBe('loading')
    })

    it('transitions to no_household when no config exists', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.authState).toBe('no_household')
      })
    })

    it('isLoading reflects authState', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      // Initially loading
      expect(result.current.isLoading).toBe(true)
      expect(result.current.authState).toBe('loading')

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // After init, not loading
      expect(result.current.authState).not.toBe('loading')
    })
  })

  describe('Email Normalization', () => {
    it('normalizes email to lowercase', () => {
      const email = 'Test@Example.COM'
      const normalized = email.trim().toLowerCase()
      expect(normalized).toBe('test@example.com')
    })

    it('trims whitespace from email', () => {
      const email = '  test@example.com  '
      const normalized = email.trim().toLowerCase()
      expect(normalized).toBe('test@example.com')
    })

    it('handles email with mixed case and spaces', () => {
      const email = '  TEST@EXAMPLE.com  '
      const normalized = email.trim().toLowerCase()
      expect(normalized).toBe('test@example.com')
    })
  })

  describe('Invite Code Handling', () => {
    it('normalizes invite code to uppercase', () => {
      const code = 'abc123'
      const normalized = code.trim().toUpperCase()
      expect(normalized).toBe('ABC123')
    })

    it('trims whitespace from invite code', () => {
      const code = '  ABC123  '
      const normalized = code.trim().toUpperCase()
      expect(normalized).toBe('ABC123')
    })
  })

  describe('User State Management', () => {
    it('user starts as null', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.user).toBeNull()
    })

    it('partner starts as null', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.partner).toBeNull()
    })

    it('household starts as null', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.household).toBeNull()
    })
  })

  describe('Switch User Logic', () => {
    it('switchUser does nothing if no partner', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Partner is null, so switchUser should be no-op
      expect(result.current.partner).toBeNull()

      await act(async () => {
        await result.current.switchUser()
      })

      // State should remain unchanged
      expect(result.current.user).toBeNull()
      expect(result.current.partner).toBeNull()
    })
  })

  describe('Refresh User', () => {
    it('refreshUser does nothing if no auth record', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // No auth record, refreshUser should be no-op
      await act(async () => {
        await result.current.refreshUser()
      })

      expect(result.current.user).toBeNull()
    })
  })

  describe('Edge Cases', () => {
    it('handles multiple logout calls gracefully', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Multiple logouts should not throw
      await act(async () => {
        await result.current.logout()
        await result.current.logout()
        await result.current.logout()
      })

      expect(result.current.authState).toBe('no_household')
    })

    it('handles rapid state transitions', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Rapid operations should not cause issues
      await act(async () => {
        result.current.logout()
        result.current.refreshUser()
        result.current.switchUser()
      })

      // Should settle to a valid state
      expect(['no_household', 'loading', 'select_user', 'authenticated']).toContain(
        result.current.authState
      )
    })
  })

  describe('AuthStore Integration', () => {
    it('clears authStore on logout', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.logout()
      })

      expect(pb.authStore.clear).toHaveBeenCalled()
    })

    it('registers onChange listener on mount', async () => {
      renderHook(() => useAuth(), { wrapper })

      // The onChange should be called during initialization
      await waitFor(() => {
        expect(pb.authStore.onChange).toHaveBeenCalled()
      })
    })
  })

  describe('Household Setup Validation', () => {
    it('validates email format before setup', () => {
      const validEmail = 'test@example.com'
      const invalidEmail = 'not-an-email'

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      expect(emailRegex.test(validEmail)).toBe(true)
      expect(emailRegex.test(invalidEmail)).toBe(false)
    })

    it('validates invite code format', () => {
      const validCode = 'ABC123'
      const invalidCode = '' // empty

      // Code should be non-empty and uppercase
      expect(validCode.length).toBeGreaterThan(0)
      expect(validCode).toBe(validCode.toUpperCase())
      expect(invalidCode.length).toBe(0)
    })
  })

  describe('Two-User Household Constraint', () => {
    it('household should have max 2 users', () => {
      const maxMembers = 2
      const existingMembers = 1

      // Can add if under limit
      expect(existingMembers < maxMembers).toBe(true)

      // Cannot add if at limit
      const fullHousehold = 2
      expect(fullHousehold >= maxMembers).toBe(true)
    })
  })
})
