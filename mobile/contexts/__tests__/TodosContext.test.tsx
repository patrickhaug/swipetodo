import React from 'react'
import { renderHook, waitFor } from '@testing-library/react-native'
import { TodosProvider, useTodos } from '../TodosContext'
import { AuthProvider } from '../AuthContext'

describe('TodosContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>
      <TodosProvider>{children}</TodosProvider>
    </AuthProvider>
  )

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useTodos())
    }).toThrow('useTodos must be used within TodosProvider')

    consoleSpy.mockRestore()
  })

  it('provides initial empty state', async () => {
    const { result } = renderHook(() => useTodos(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.todos).toEqual([])
    expect(result.current.poolTodos).toEqual([])
    expect(result.current.myTodos).toEqual([])
  })

  it('exposes required functions', async () => {
    const { result } = renderHook(() => useTodos(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(typeof result.current.createTodo).toBe('function')
    expect(typeof result.current.assignTo).toBe('function')
    expect(typeof result.current.markDone).toBe('function')
    expect(typeof result.current.returnToPool).toBe('function')
    expect(typeof result.current.reorder).toBe('function')
  })
})
