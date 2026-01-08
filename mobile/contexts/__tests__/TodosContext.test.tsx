import React from 'react'
import { renderHook, waitFor, act } from '@testing-library/react-native'
import { TodosProvider, useTodos } from '../TodosContext'
import { pb } from '@/lib/pocketbase'

// Mock user
const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  household: 'household-1',
}

jest.mock('../AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TodosProvider>{children}</TodosProvider>
)

describe('TodosContext - Business Logic', () => {
  let mockCreate: jest.Mock
  let mockUpdate: jest.Mock
  let mockGetList: jest.Mock
  let mockSubscribe: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockCreate = jest.fn()
    mockUpdate = jest.fn()
    mockGetList = jest.fn().mockResolvedValue({ items: [] })
    mockSubscribe = jest.fn().mockResolvedValue(jest.fn())

    ;(pb.collection as jest.Mock).mockReturnValue({
      getList: mockGetList,
      subscribe: mockSubscribe,
      create: mockCreate,
      update: mockUpdate,
    })
  })

  describe('createTodo - Adding a task to pool', () => {
    it('creates task with status=pool in current household', async () => {
      mockCreate.mockResolvedValue({ id: 'new-1' })

      const { result } = renderHook(() => useTodos(), { wrapper })
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.createTodo('Buy milk')
      })

      expect(mockCreate).toHaveBeenCalledWith({
        text: 'Buy milk',
        due_date: null,
        status: 'pool',
        household: 'household-1',
        created_by: 'user-1',
      })
    })

    it('returns created todo ID on success', async () => {
      mockCreate.mockResolvedValue({ id: 'todo-abc' })

      const { result } = renderHook(() => useTodos(), { wrapper })
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      let id: string | undefined
      await act(async () => {
        id = await result.current.createTodo('New task')
      })

      expect(id).toBe('todo-abc')
    })

    it('throws on API failure', async () => {
      mockCreate.mockRejectedValue(new Error('Server error'))

      const { result } = renderHook(() => useTodos(), { wrapper })
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await expect(
        act(async () => {
          await result.current.createTodo('Will fail')
        })
      ).rejects.toThrow('Server error')
    })
  })

  describe('assignTo - Assigning task to user', () => {
    it('calls API with status=assigned and user ID', async () => {
      mockGetList.mockResolvedValue({
        items: [{ id: 'todo-1', text: 'Pool task', status: 'pool', assigned_to: null }],
      })
      mockUpdate.mockResolvedValue({})

      const { result } = renderHook(() => useTodos(), { wrapper })
      await waitFor(() => expect(result.current.poolTodos).toHaveLength(1))

      await act(async () => {
        await result.current.assignTo('todo-1', 'user-1')
      })

      expect(mockUpdate).toHaveBeenCalledWith('todo-1', {
        status: 'assigned',
        assigned_to: 'user-1',
        sort_order: 1,
      })
    })

    it('optimistic: moves task to myTodos before API responds', async () => {
      mockGetList.mockResolvedValue({
        items: [{ id: 'todo-1', text: 'Task', status: 'pool', assigned_to: null }],
      })
      mockUpdate.mockReturnValue(new Promise(() => {})) // never resolves

      const { result } = renderHook(() => useTodos(), { wrapper })
      await waitFor(() => expect(result.current.poolTodos).toHaveLength(1))

      expect(result.current.myTodos).toHaveLength(0)

      act(() => {
        result.current.assignTo('todo-1', 'user-1')
      })

      // UI updates immediately, even though API hasn't responded
      await waitFor(() => {
        expect(result.current.poolTodos).toHaveLength(0)
        expect(result.current.myTodos).toHaveLength(1)
      })
    })

    it('calculates sort_order as max + 1 from existing todos', async () => {
      mockGetList.mockResolvedValue({
        items: [
          { id: 'todo-1', text: 'Existing', status: 'assigned', assigned_to: 'user-1', sort_order: 5 },
          { id: 'todo-2', text: 'Pool', status: 'pool', assigned_to: null },
        ],
      })
      mockUpdate.mockResolvedValue({})

      const { result } = renderHook(() => useTodos(), { wrapper })
      await waitFor(() => expect(result.current.myTodos).toHaveLength(1))

      await act(async () => {
        await result.current.assignTo('todo-2', 'user-1')
      })

      expect(mockUpdate).toHaveBeenCalledWith('todo-2', {
        status: 'assigned',
        assigned_to: 'user-1',
        sort_order: 6, // max(5) + 1
      })
    })
  })

  describe('markDone - Completing a task', () => {
    it('calls API with status=done', async () => {
      mockGetList.mockResolvedValue({
        items: [{ id: 'todo-1', text: 'Task', status: 'assigned', assigned_to: 'user-1' }],
      })
      mockUpdate.mockResolvedValue({})

      const { result } = renderHook(() => useTodos(), { wrapper })
      await waitFor(() => expect(result.current.myTodos).toHaveLength(1))

      await act(async () => {
        await result.current.markDone('todo-1')
      })

      expect(mockUpdate).toHaveBeenCalledWith('todo-1', { status: 'done' })
    })

    it('optimistic: removes from myTodos before API responds', async () => {
      mockGetList.mockResolvedValue({
        items: [{ id: 'todo-1', text: 'Task', status: 'assigned', assigned_to: 'user-1' }],
      })
      mockUpdate.mockReturnValue(new Promise(() => {})) // never resolves

      const { result } = renderHook(() => useTodos(), { wrapper })
      await waitFor(() => expect(result.current.myTodos).toHaveLength(1))

      act(() => {
        result.current.markDone('todo-1')
      })

      // UI updates immediately, even though API hasn't responded
      await waitFor(() => {
        expect(result.current.myTodos).toHaveLength(0)
      })
    })
  })

  describe('returnToPool - Unassigning a task', () => {
    it('calls API with status=pool and clears assigned_to', async () => {
      mockGetList.mockResolvedValue({
        items: [{ id: 'todo-1', text: 'Task', status: 'assigned', assigned_to: 'user-1' }],
      })
      mockUpdate.mockResolvedValue({})

      const { result } = renderHook(() => useTodos(), { wrapper })
      await waitFor(() => expect(result.current.myTodos).toHaveLength(1))

      await act(async () => {
        await result.current.returnToPool('todo-1')
      })

      expect(mockUpdate).toHaveBeenCalledWith('todo-1', {
        status: 'pool',
        assigned_to: '',
      })
    })

    it('optimistic: moves task back to poolTodos before API responds', async () => {
      mockGetList.mockResolvedValue({
        items: [{ id: 'todo-1', text: 'Task', status: 'assigned', assigned_to: 'user-1' }],
      })
      mockUpdate.mockReturnValue(new Promise(() => {})) // never resolves

      const { result } = renderHook(() => useTodos(), { wrapper })
      await waitFor(() => expect(result.current.myTodos).toHaveLength(1))

      expect(result.current.poolTodos).toHaveLength(0)

      act(() => {
        result.current.returnToPool('todo-1')
      })

      // UI updates immediately, even though API hasn't responded
      await waitFor(() => {
        expect(result.current.myTodos).toHaveLength(0)
        expect(result.current.poolTodos).toHaveLength(1)
      })
    })
  })

  describe('Derived state - poolTodos vs myTodos', () => {
    it('poolTodos = tasks with status pool', async () => {
      mockGetList.mockResolvedValue({
        items: [
          { id: '1', status: 'pool', assigned_to: null },
          { id: '2', status: 'assigned', assigned_to: 'user-1' },
          { id: '3', status: 'pool', assigned_to: null },
        ],
      })

      const { result } = renderHook(() => useTodos(), { wrapper })
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.poolTodos).toHaveLength(2)
      expect(result.current.poolTodos.map(t => t.id)).toEqual(['1', '3'])
    })

    it('myTodos = tasks assigned to current user (not done)', async () => {
      mockGetList.mockResolvedValue({
        items: [
          { id: '1', status: 'assigned', assigned_to: 'user-1' },
          { id: '2', status: 'assigned', assigned_to: 'user-2' },
          { id: '3', status: 'done', assigned_to: 'user-1' },
        ],
      })

      const { result } = renderHook(() => useTodos(), { wrapper })
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.myTodos).toHaveLength(1)
      expect(result.current.myTodos[0].id).toBe('1')
    })

    it('myTodos sorted by sort_order', async () => {
      mockGetList.mockResolvedValue({
        items: [
          { id: 'c', status: 'assigned', assigned_to: 'user-1', sort_order: 2 },
          { id: 'a', status: 'assigned', assigned_to: 'user-1', sort_order: 0 },
          { id: 'b', status: 'assigned', assigned_to: 'user-1', sort_order: 1 },
        ],
      })

      const { result } = renderHook(() => useTodos(), { wrapper })
      await waitFor(() => expect(result.current.myTodos).toHaveLength(3))

      expect(result.current.myTodos.map(t => t.id)).toEqual(['a', 'b', 'c'])
    })
  })
})
