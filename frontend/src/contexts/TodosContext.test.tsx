import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { TodosProvider, useTodos } from './TodosContext'
import { AuthProvider } from './AuthContext'

const mockGetFullList = vi.fn()
const mockSubscribe = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()

vi.mock('@/lib/pocketbase', () => ({
  pb: {
    collection: () => ({
      getFullList: mockGetFullList,
      subscribe: mockSubscribe,
      create: mockCreate,
      update: mockUpdate,
    }),
    authStore: {
      model: { id: 'user-1', household: 'h1' },
      onChange: vi.fn(() => () => {}),
    },
  },
}))

beforeEach(() => {
  mockGetFullList.mockReset()
  mockSubscribe.mockReset()
  mockCreate.mockReset()
  mockUpdate.mockReset()
  mockGetFullList.mockResolvedValue([
    { id: '1', text: 'Test Todo', status: 'pool', household: 'h1' },
  ])
  mockSubscribe.mockResolvedValue(() => {})
})

function TestComponent() {
  const { poolTodos, isLoading } = useTodos()
  return (
    <div>
      <span data-testid="loading">{isLoading ? 'loading' : 'ready'}</span>
      <span data-testid="count">{poolTodos.length}</span>
    </div>
  )
}

describe('TodosContext', () => {
  it('provides todos state', async () => {
    render(
      <AuthProvider>
        <TodosProvider>
          <TestComponent />
        </TodosProvider>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('1')
    })
  })

  it('throws when useTodos is used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestComponent />)).toThrow('useTodos must be used within TodosProvider')
    consoleSpy.mockRestore()
  })
})
