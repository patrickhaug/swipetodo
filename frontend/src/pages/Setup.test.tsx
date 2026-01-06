import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { Setup } from './Setup'

const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockAuthRefresh = vi.fn()
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
    collection: (name: string) => ({
      create: mockCreate,
      update: mockUpdate,
      authRefresh: mockAuthRefresh,
    }),
    authStore: {
      model: { id: 'user-1' },
    },
  },
}))

beforeEach(() => {
  mockCreate.mockReset()
  mockUpdate.mockReset()
  mockAuthRefresh.mockReset()
  mockNavigate.mockReset()
})

describe('Setup', () => {
  it('renders household name input', () => {
    render(<Setup />, { wrapper: BrowserRouter })
    expect(screen.getByPlaceholderText(/haushaltsname/i)).toBeInTheDocument()
  })

  it('renders create button', () => {
    render(<Setup />, { wrapper: BrowserRouter })
    expect(screen.getByRole('button', { name: /haushalt erstellen/i })).toBeInTheDocument()
  })
})
