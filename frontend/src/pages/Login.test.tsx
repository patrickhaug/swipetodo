import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { Login } from './Login'

const mockRequestOTP = vi.fn()
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
      requestOTP: mockRequestOTP,
    }),
  },
}))

describe('Login', () => {
  it('renders email input and submit button', () => {
    render(<Login />, { wrapper: BrowserRouter })

    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /code senden/i })).toBeInTheDocument()
  })

  it('submits email and navigates to verify', async () => {
    mockRequestOTP.mockResolvedValueOnce({ otpId: 'test-otp' })
    const user = userEvent.setup()

    render(<Login />, { wrapper: BrowserRouter })

    await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com')
    await user.click(screen.getByRole('button', { name: /code senden/i }))

    expect(mockRequestOTP).toHaveBeenCalledWith('test@example.com')
    expect(mockNavigate).toHaveBeenCalledWith('/verify', { state: { otpId: 'test-otp', email: 'test@example.com' } })
  })

  it('shows error on failed request', async () => {
    mockRequestOTP.mockRejectedValueOnce(new Error('Failed'))
    const user = userEvent.setup()

    render(<Login />, { wrapper: BrowserRouter })

    await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com')
    await user.click(screen.getByRole('button', { name: /code senden/i }))

    expect(await screen.findByText(/fehler/i)).toBeInTheDocument()
  })
})
