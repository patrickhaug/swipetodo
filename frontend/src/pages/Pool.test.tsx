import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Pool } from './Pool'

const mockLogout = vi.fn()
const mockAssignTo = vi.fn()

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', household: 'h1' },
    logout: mockLogout,
  }),
}))

const mockUseTodos = vi.fn()

vi.mock('@/contexts/TodosContext', () => ({
  useTodos: () => mockUseTodos(),
}))

describe('Pool', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseTodos.mockReturnValue({
      poolTodos: [
        { id: '1', text: 'Test Todo', status: 'pool', household: 'h1', due_date: null, assigned_to: null, created_by: 'u1', created: '2026-01-06', updated: '2026-01-06' },
      ],
      myTodos: [],
      isConnected: true,
      assignTo: mockAssignTo,
      createTodo: vi.fn(),
    })
  })

  it('renders pool page with swipe card', () => {
    render(<Pool />, { wrapper: BrowserRouter })
    expect(screen.getByText('Test Todo')).toBeInTheDocument()
  })

  it('shows counter for todos', () => {
    render(<Pool />, { wrapper: BrowserRouter })
    expect(screen.getByText('1 von 1')).toBeInTheDocument()
  })

  it('shows empty state when no todos', () => {
    mockUseTodos.mockReturnValue({
      poolTodos: [],
      myTodos: [],
      isConnected: true,
      assignTo: mockAssignTo,
      createTodo: vi.fn(),
    })

    render(<Pool />, { wrapper: BrowserRouter })
    expect(screen.getByText(/keine aufgaben/i)).toBeInTheDocument()
  })

  it('renders header with navigation links', () => {
    render(<Pool />, { wrapper: BrowserRouter })
    expect(screen.getByText('Pool')).toBeInTheDocument()
    expect(screen.getByText('Meine (0)')).toBeInTheDocument()
  })

  it('renders logout button', () => {
    render(<Pool />, { wrapper: BrowserRouter })
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('renders swipe labels', () => {
    render(<Pool />, { wrapper: BrowserRouter })
    expect(screen.getByText('Ich')).toBeInTheDocument()
    expect(screen.getByText('Partner')).toBeInTheDocument()
  })
})
