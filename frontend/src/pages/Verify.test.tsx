import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { Verify } from './Verify'

const mockAuthWithOTP = vi.fn()
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/lib/pocketbase', () => ({
  pb: {
    collection: () => ({
      authWithOTP: mockAuthWithOTP,
    }),
    authStore: {
      model: { household: null },
    },
  },
}))

beforeEach(() => {
  mockAuthWithOTP.mockReset()
  mockNavigate.mockReset()
  localStorage.clear()
})

describe('Verify', () => {
  it('renders code input', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/verify', state: { otpId: 'test', email: 'test@test.com' } }]}>
        <Routes>
          <Route path="/verify" element={<Verify />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByPlaceholderText(/123456/i)).toBeInTheDocument()
  })

  it('redirects to login if no otpId', () => {
    render(
      <MemoryRouter initialEntries={['/verify']}>
        <Routes>
          <Route path="/verify" element={<Verify />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })
})
