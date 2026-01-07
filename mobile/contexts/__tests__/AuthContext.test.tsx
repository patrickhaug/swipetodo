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

  it('provides null user when not authenticated', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.partner).toBeNull()
  })

  it('exposes auth functions', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(typeof result.current.requestOTP).toBe('function')
    expect(typeof result.current.verifyOTP).toBe('function')
    expect(typeof result.current.logout).toBe('function')
    expect(typeof result.current.refreshUser).toBe('function')
  })

  it('logout clears user state', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.partner).toBeNull()
    expect(pb.authStore.clear).toHaveBeenCalled()
  })
})
