import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Mine } from './Mine'

const mockLogout = vi.fn()
const mockMarkDone = vi.fn()
const mockReturnToPool = vi.fn()

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

describe('Mine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseTodos.mockReturnValue({
      myTodos: [
        { id: '1', text: 'My Todo 1', status: 'assigned', household: 'h1', due_date: null, assigned_to: 'user-1', created_by: 'u1', created: '2026-01-06', updated: '2026-01-06' },
        { id: '2', text: 'My Todo 2', status: 'assigned', household: 'h1', due_date: '2026-01-15', assigned_to: 'user-1', created_by: 'u1', created: '2026-01-06', updated: '2026-01-06' },
      ],
      poolTodos: [],
      isConnected: true,
      markDone: mockMarkDone,
      returnToPool: mockReturnToPool,
      createTodo: vi.fn(),
    })
  })

  it('renders list of assigned todos', () => {
    render(<Mine />, { wrapper: BrowserRouter })
    expect(screen.getByText('My Todo 1')).toBeInTheDocument()
    expect(screen.getByText('My Todo 2')).toBeInTheDocument()
  })

  it('shows count in header', () => {
    render(<Mine />, { wrapper: BrowserRouter })
    expect(screen.getByText(/meine \(2\)/i)).toBeInTheDocument()
  })

  it('shows empty state when no todos', () => {
    mockUseTodos.mockReturnValue({
      myTodos: [],
      poolTodos: [],
      isConnected: true,
      markDone: mockMarkDone,
      returnToPool: mockReturnToPool,
      createTodo: vi.fn(),
    })

    render(<Mine />, { wrapper: BrowserRouter })
    expect(screen.getByText(/keine aufgaben/i)).toBeInTheDocument()
  })

  it('renders header with navigation links', () => {
    render(<Mine />, { wrapper: BrowserRouter })
    expect(screen.getByText('Pool')).toBeInTheDocument()
    expect(screen.getByText('Meine (2)')).toBeInTheDocument()
  })

  it('renders logout button', () => {
    render(<Mine />, { wrapper: BrowserRouter })
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('displays due dates for todos that have them', () => {
    render(<Mine />, { wrapper: BrowserRouter })
    // Todo 2 has a due date
    expect(screen.getByText(/bis 15\.1\.2026/)).toBeInTheDocument()
  })
})
