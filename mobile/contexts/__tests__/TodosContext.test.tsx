import React from 'react'
import { renderHook, waitFor, act } from '@testing-library/react-native'
import { TodosProvider, useTodos } from '../TodosContext'
import { pb } from '@/lib/pocketbase'

// Mock PocketBase module
jest.mock('@/lib/pocketbase', () => ({
  pb: {
    collection: jest.fn(),
  },
}))

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

  describe('reorder - Drag to reorder tasks', () => {
    it('optimistic: updates myTodos order immediately', async () => {
      mockGetList.mockResolvedValue({
        items: [
          { id: 'a', text: 'A', status: 'assigned', assigned_to: 'user-1', sort_order: 0 },
          { id: 'b', text: 'B', status: 'assigned', assigned_to: 'user-1', sort_order: 1 },
          { id: 'c', text: 'C', status: 'assigned', assigned_to: 'user-1', sort_order: 2 },
        ],
      })
      mockUpdate.mockResolvedValue({})

      const { result } = renderHook(() => useTodos(), { wrapper })
      await waitFor(() => expect(result.current.myTodos).toHaveLength(3))

      // Reorder: move C to first position (pass current myTodos in new order)
      const reordered = result.current.myTodos.slice().reverse()

      act(() => {
        result.current.reorder(reordered)
      })

      // UI updates immediately with new order (reversed: c, b, a)
      expect(result.current.myTodos.map(t => t.id)).toEqual(['c', 'b', 'a'])
    })

    it('calls API update for each reordered item', async () => {
      mockGetList.mockResolvedValue({
        items: [
          { id: 'a', text: 'A', status: 'assigned', assigned_to: 'user-1', sort_order: 0 },
          { id: 'b', text: 'B', status: 'assigned', assigned_to: 'user-1', sort_order: 1 },
        ],
      })
      mockUpdate.mockResolvedValue({})

      const { result } = renderHook(() => useTodos(), { wrapper })
      await waitFor(() => expect(result.current.myTodos).toHaveLength(2))

      // Swap order: b first, then a
      const reordered = result.current.myTodos.slice().reverse()

      await act(async () => {
        result.current.reorder(reordered)
        // Wait for Promise.all to complete
        await new Promise(resolve => setTimeout(resolve, 10))
      })

      expect(mockUpdate).toHaveBeenCalledWith('b', { sort_order: 0 })
      expect(mockUpdate).toHaveBeenCalledWith('a', { sort_order: 1 })
    })

    it('preserves pool todos during reorder', async () => {
      mockGetList.mockResolvedValue({
        items: [
          { id: 'pool-1', text: 'Pool', status: 'pool', assigned_to: null },
          { id: 'a', text: 'A', status: 'assigned', assigned_to: 'user-1', sort_order: 0 },
        ],
      })
      mockUpdate.mockResolvedValue({})

      const { result } = renderHook(() => useTodos(), { wrapper })
      await waitFor(() => expect(result.current.myTodos).toHaveLength(1))
      expect(result.current.poolTodos).toHaveLength(1)

      act(() => {
        result.current.reorder(result.current.myTodos)
      })

      // Pool todos should still exist
      expect(result.current.poolTodos).toHaveLength(1)
      expect(result.current.poolTodos[0].id).toBe('pool-1')
    })
  })

  describe('Subscription lifecycle', () => {
    it('subscribes to todos collection on mount', async () => {
      const { result } = renderHook(() => useTodos(), { wrapper })
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(mockSubscribe).toHaveBeenCalledWith('*', expect.any(Function))
    })

    it('unsubscribes on unmount', async () => {
      const mockUnsubscribe = jest.fn()
      mockSubscribe.mockResolvedValue(mockUnsubscribe)

      const { result, unmount } = renderHook(() => useTodos(), { wrapper })
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      unmount()

      await waitFor(() => {
        expect(mockUnsubscribe).toHaveBeenCalled()
      })
    })

    it('subscription: handles create event', async () => {
      let subscriptionCallback: (e: { action: string; record: any }) => void

      mockSubscribe.mockImplementation((_filter, callback) => {
        subscriptionCallback = callback
        return Promise.resolve(jest.fn())
      })

      const { result } = renderHook(() => useTodos(), { wrapper })
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      // Simulate a create event from PocketBase
      act(() => {
        subscriptionCallback({
          action: 'create',
          record: { id: 'new-todo', text: 'New', status: 'pool', assigned_to: null },
        })
      })

      expect(result.current.poolTodos).toHaveLength(1)
      expect(result.current.poolTodos[0].id).toBe('new-todo')
    })

    it('subscription: handles update event', async () => {
      mockGetList.mockResolvedValue({
        items: [{ id: 'todo-1', text: 'Original', status: 'pool', assigned_to: null }],
      })

      let subscriptionCallback: (e: { action: string; record: any }) => void

      mockSubscribe.mockImplementation((_filter, callback) => {
        subscriptionCallback = callback
        return Promise.resolve(jest.fn())
      })

      const { result } = renderHook(() => useTodos(), { wrapper })
      await waitFor(() => expect(result.current.poolTodos).toHaveLength(1))

      // Simulate an update event
      act(() => {
        subscriptionCallback({
          action: 'update',
          record: { id: 'todo-1', text: 'Updated', status: 'pool', assigned_to: null },
        })
      })

      expect(result.current.poolTodos[0].text).toBe('Updated')
    })

    it('subscription: handles delete event', async () => {
      mockGetList.mockResolvedValue({
        items: [{ id: 'todo-1', text: 'To delete', status: 'pool', assigned_to: null }],
      })

      let subscriptionCallback: (e: { action: string; record: any }) => void

      mockSubscribe.mockImplementation((_filter, callback) => {
        subscriptionCallback = callback
        return Promise.resolve(jest.fn())
      })

      const { result } = renderHook(() => useTodos(), { wrapper })
      await waitFor(() => expect(result.current.poolTodos).toHaveLength(1))

      // Simulate a delete event
      act(() => {
        subscriptionCallback({
          action: 'delete',
          record: { id: 'todo-1' },
        })
      })

      expect(result.current.poolTodos).toHaveLength(0)
    })
  })

  describe('isConnected state', () => {
    it('starts as false, becomes true after loadTodos succeeds', async () => {
      const { result } = renderHook(() => useTodos(), { wrapper })

      // Initially loading
      expect(result.current.isLoading).toBe(true)

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      // After successful load, isConnected should be true
      expect(result.current.isConnected).toBe(true)
    })

    it('remains false if loadTodos fails', async () => {
      mockGetList.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useTodos(), { wrapper })
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      // Connection failed
      expect(result.current.isConnected).toBe(false)
    })
  })
})
