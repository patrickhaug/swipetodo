import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

// Mock PocketBase
vi.mock('@/lib/pocketbase', () => ({
  pb: {
    authStore: {
      model: null,
      onChange: vi.fn((callback) => {
        return () => {} // unsubscribe
      }),
      clear: vi.fn(),
    },
    collection: vi.fn(() => ({
      requestOTP: vi.fn().mockResolvedValue({ otpId: 'test-otp-id' }),
      authWithOTP: vi.fn().mockResolvedValue({ record: { id: 'user-1' } }),
    })),
  },
}))

function TestComponent() {
  const { user, isLoading } = useAuth()
  return (
    <div>
      <span data-testid="loading">{isLoading ? 'loading' : 'ready'}</span>
      <span data-testid="user">{user ? user.id : 'no-user'}</span>
    </div>
  )
}

describe('AuthContext', () => {
  it('provides initial loading state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
  })

  it('throws when useAuth is used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestComponent />)).toThrow('useAuth must be used within AuthProvider')
    consoleSpy.mockRestore()
  })
})
