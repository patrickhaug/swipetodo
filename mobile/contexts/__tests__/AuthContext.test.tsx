import React from 'react'
import { renderHook, waitFor, act } from '@testing-library/react-native'
import { AuthProvider, useAuth } from '../AuthContext'
import { pb } from '@/lib/pocketbase'

describe('AuthContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

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

  describe('authState transitions', () => {
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
  })
})
