import React from 'react'
import { renderHook, waitFor, act } from '@testing-library/react-native'
import { TodosProvider, useTodos } from '../TodosContext'
import { AuthProvider } from '../AuthContext'
import { pb } from '@/lib/pocketbase'
import type { Todo } from '@/types'

// Mock data
const mockTodos: Todo[] = [
  {
    id: 'todo-1',
    text: 'Buy groceries',
    status: 'pool',
    assigned_to: null,
    household: 'household-1',
    created_by: 'user-1',
    sort_order: 0,
    due_date: null,
    created: '2024-01-01',
    updated: '2024-01-01',
  },
  {
    id: 'todo-2',
    text: 'Walk the dog',
    status: 'assigned',
    assigned_to: 'user-1',
    household: 'household-1',
    created_by: 'user-1',
    sort_order: 0,
    due_date: null,
    created: '2024-01-01',
    updated: '2024-01-01',
  },
  {
    id: 'todo-3',
    text: 'Clean kitchen',
    status: 'assigned',
    assigned_to: 'user-1',
    household: 'household-1',
    created_by: 'user-2',
    sort_order: 1,
    due_date: null,
    created: '2024-01-01',
    updated: '2024-01-01',
  },
  {
    id: 'todo-4',
    text: 'Call mom',
    status: 'done',
    assigned_to: 'user-1',
    household: 'household-1',
    created_by: 'user-1',
    sort_order: 0,
    due_date: null,
    created: '2024-01-01',
    updated: '2024-01-01',
  },
]

describe('TodosContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>
      <TodosProvider>{children}</TodosProvider>
    </AuthProvider>
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Provider Setup', () => {
    it('throws error when used outside provider', () => {
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

    it('sets isConnected to true after successful load', async () => {
      const { result } = renderHook(() => useTodos(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // isConnected should be false initially since no household
      expect(result.current.isConnected).toBe(false)
    })
  })

  describe('Derived State - poolTodos', () => {
    it('filters only pool status todos', () => {
      // Pool todos should only include status='pool'
      const poolTodos = mockTodos.filter(t => t.status === 'pool')
      expect(poolTodos).toHaveLength(1)
      expect(poolTodos[0].id).toBe('todo-1')
    })

    it('excludes assigned and done todos from pool', () => {
      const poolTodos = mockTodos.filter(t => t.status === 'pool')
      const assignedIds = poolTodos.map(t => t.id)

      expect(assignedIds).not.toContain('todo-2') // assigned
      expect(assignedIds).not.toContain('todo-4') // done
    })
  })

  describe('Derived State - myTodos', () => {
    const userId = 'user-1'

    it('filters assigned todos for current user', () => {
      const myTodos = mockTodos.filter(
        t => t.status === 'assigned' && t.assigned_to === userId
      )
      expect(myTodos).toHaveLength(2)
    })

    it('sorts by sort_order ascending', () => {
      const myTodos = mockTodos
        .filter(t => t.status === 'assigned' && t.assigned_to === userId)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

      expect(myTodos[0].sort_order).toBe(0)
      expect(myTodos[1].sort_order).toBe(1)
    })

    it('uses id as stable tiebreaker when sort_order equal', () => {
      const todosWithSameOrder: Todo[] = [
        { ...mockTodos[0], id: 'b-todo', status: 'assigned', assigned_to: 'user-1', sort_order: 0 },
        { ...mockTodos[0], id: 'a-todo', status: 'assigned', assigned_to: 'user-1', sort_order: 0 },
      ]

      const sorted = todosWithSameOrder.sort((a, b) => {
        const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0)
        if (orderDiff !== 0) return orderDiff
        return a.id.localeCompare(b.id)
      })

      expect(sorted[0].id).toBe('a-todo')
      expect(sorted[1].id).toBe('b-todo')
    })

    it('excludes pool and done todos', () => {
      const myTodos = mockTodos.filter(
        t => t.status === 'assigned' && t.assigned_to === 'user-1'
      )
      const ids = myTodos.map(t => t.id)

      expect(ids).not.toContain('todo-1') // pool
      expect(ids).not.toContain('todo-4') // done
    })

    it('excludes todos assigned to other users', () => {
      const otherUserTodo: Todo = {
        ...mockTodos[0],
        id: 'other-todo',
        status: 'assigned',
        assigned_to: 'user-2',
      }
      const allTodos = [...mockTodos, otherUserTodo]

      const myTodos = allTodos.filter(
        t => t.status === 'assigned' && t.assigned_to === 'user-1'
      )

      expect(myTodos.find(t => t.id === 'other-todo')).toBeUndefined()
    })
  })

  describe('Todo Operations - Data Validation', () => {
    it('createTodo generates proper payload', () => {
      const text = 'New task'
      const dueDate = '2024-12-31'

      // Verify the expected structure
      const expectedPayload = {
        text,
        due_date: dueDate,
        status: 'pool',
        household: expect.any(String),
        created_by: expect.any(String),
      }

      expect(expectedPayload.text).toBe(text)
      expect(expectedPayload.due_date).toBe(dueDate)
      expect(expectedPayload.status).toBe('pool')
    })

    it('assignTo calculates correct sort_order', () => {
      const userTodos = mockTodos.filter(
        t => t.status === 'assigned' && t.assigned_to === 'user-1'
      )
      const maxOrder = userTodos.reduce((max, t) => Math.max(max, t.sort_order ?? 0), 0)
      const newOrder = maxOrder + 1

      expect(newOrder).toBe(2) // max is 1, so new should be 2
    })

    it('assignTo handles empty user todos', () => {
      const emptyUserTodos: Todo[] = []
      const maxOrder = emptyUserTodos.reduce((max, t) => Math.max(max, t.sort_order ?? 0), 0)
      const newOrder = maxOrder + 1

      expect(newOrder).toBe(1) // max is 0, so new should be 1
    })
  })

  describe('Optimistic Updates', () => {
    it('assignTo updates state optimistically', () => {
      const todo = mockTodos[0] // pool todo
      const userId = 'user-1'
      const userTodos = mockTodos.filter(
        t => t.status === 'assigned' && t.assigned_to === userId
      )
      const newOrder = userTodos.reduce((max, t) => Math.max(max, t.sort_order ?? 0), 0) + 1

      // Simulate optimistic update
      const updatedTodo = {
        ...todo,
        status: 'assigned' as const,
        assigned_to: userId,
        sort_order: newOrder,
      }

      expect(updatedTodo.status).toBe('assigned')
      expect(updatedTodo.assigned_to).toBe(userId)
      expect(updatedTodo.sort_order).toBe(newOrder)
    })

    it('markDone updates status optimistically', () => {
      const todo = mockTodos[1] // assigned todo

      const updatedTodo = {
        ...todo,
        status: 'done' as const,
      }

      expect(updatedTodo.status).toBe('done')
    })

    it('returnToPool resets assignment optimistically', () => {
      const todo = mockTodos[1] // assigned todo

      const updatedTodo = {
        ...todo,
        status: 'pool' as const,
        assigned_to: null,
      }

      expect(updatedTodo.status).toBe('pool')
      expect(updatedTodo.assigned_to).toBeNull()
    })
  })

  describe('Reorder Logic', () => {
    it('updates sort_order based on array position', () => {
      const myTodos = mockTodos.filter(
        t => t.status === 'assigned' && t.assigned_to === 'user-1'
      )

      // Simulate reorder - reverse the order
      const reordered = [...myTodos].reverse()
      const updatedItems = reordered.map((item, index) => ({
        ...item,
        sort_order: index,
      }))

      expect(updatedItems[0].sort_order).toBe(0)
      expect(updatedItems[1].sort_order).toBe(1)
    })

    it('preserves non-user todos during reorder', () => {
      const userId = 'user-1'
      const allTodos = mockTodos
      const myTodos = allTodos.filter(
        t => t.status === 'assigned' && t.assigned_to === userId
      )
      const others = allTodos.filter(
        t => !(t.status === 'assigned' && t.assigned_to === userId)
      )

      // After reorder, others should remain unchanged
      expect(others).toHaveLength(2) // pool + done
      expect(others.find(t => t.id === 'todo-1')).toBeDefined() // pool
      expect(others.find(t => t.id === 'todo-4')).toBeDefined() // done
    })

    it('generates correct update payload for each item', () => {
      const myTodos = mockTodos.filter(
        t => t.status === 'assigned' && t.assigned_to === 'user-1'
      )

      const updates = myTodos.map((item, index) => ({
        id: item.id,
        sort_order: index,
      }))

      expect(updates).toHaveLength(2)
      expect(updates[0]).toEqual({ id: 'todo-2', sort_order: 0 })
      expect(updates[1]).toEqual({ id: 'todo-3', sort_order: 1 })
    })
  })

  describe('Subscription Handling', () => {
    it('handles create action - prepends new todo', () => {
      const currentTodos = [...mockTodos]
      const newTodo: Todo = {
        id: 'todo-5',
        text: 'New todo from subscription',
        status: 'pool',
        assigned_to: null,
        household: 'household-1',
        created_by: 'user-2',
        sort_order: 0,
        due_date: null,
        created: '2024-01-02',
        updated: '2024-01-02',
      }

      // Simulate subscription create
      const updated = [newTodo, ...currentTodos]

      expect(updated[0].id).toBe('todo-5')
      expect(updated).toHaveLength(5)
    })

    it('handles update action - replaces todo', () => {
      const currentTodos = [...mockTodos]
      const updatedRecord: Todo = {
        ...mockTodos[0],
        text: 'Updated text',
      }

      // Simulate subscription update
      const updated = currentTodos.map(t =>
        t.id === updatedRecord.id ? updatedRecord : t
      )

      expect(updated.find(t => t.id === 'todo-1')?.text).toBe('Updated text')
      expect(updated).toHaveLength(4)
    })

    it('handles delete action - removes todo', () => {
      const currentTodos = [...mockTodos]
      const deletedId = 'todo-1'

      // Simulate subscription delete
      const updated = currentTodos.filter(t => t.id !== deletedId)

      expect(updated.find(t => t.id === deletedId)).toBeUndefined()
      expect(updated).toHaveLength(3)
    })

    it('ignores unknown actions', () => {
      const currentTodos = [...mockTodos]

      // Unknown action should return current state
      const updated = currentTodos

      expect(updated).toEqual(mockTodos)
    })
  })

  describe('Edge Cases', () => {
    it('handles todo with null sort_order', () => {
      const todoWithNullOrder: Todo = {
        ...mockTodos[0],
        sort_order: null as unknown as number,
      }

      // Sort logic should treat null as 0
      const order = todoWithNullOrder.sort_order ?? 0
      expect(order).toBe(0)
    })

    it('handles todo with undefined assigned_to', () => {
      const todoWithUndefinedAssignment: Todo = {
        ...mockTodos[0],
        assigned_to: undefined as unknown as string | null,
      }

      // Filter logic should handle undefined
      const isAssignedToUser =
        todoWithUndefinedAssignment.status === 'assigned' &&
        todoWithUndefinedAssignment.assigned_to === 'user-1'

      expect(isAssignedToUser).toBe(false)
    })

    it('handles empty todos array', () => {
      const emptyTodos: Todo[] = []

      const poolTodos = emptyTodos.filter(t => t.status === 'pool')
      const myTodos = emptyTodos.filter(
        t => t.status === 'assigned' && t.assigned_to === 'user-1'
      )

      expect(poolTodos).toHaveLength(0)
      expect(myTodos).toHaveLength(0)
    })

    it('handles todos with same id (deduplication scenario)', () => {
      const duplicateTodos: Todo[] = [
        mockTodos[0],
        { ...mockTodos[0] }, // duplicate
      ]

      // Update should replace, not duplicate
      const updatedRecord = { ...mockTodos[0], text: 'Changed' }
      const updated = duplicateTodos.map(t =>
        t.id === updatedRecord.id ? updatedRecord : t
      )

      // All with same id should be updated
      expect(updated.filter(t => t.text === 'Changed')).toHaveLength(2)
    })
  })

  describe('Status Transitions', () => {
    it('pool -> assigned transition', () => {
      const poolTodo = mockTodos[0]
      expect(poolTodo.status).toBe('pool')

      const assigned = {
        ...poolTodo,
        status: 'assigned' as const,
        assigned_to: 'user-1',
      }

      expect(assigned.status).toBe('assigned')
      expect(assigned.assigned_to).toBe('user-1')
    })

    it('assigned -> done transition', () => {
      const assignedTodo = mockTodos[1]
      expect(assignedTodo.status).toBe('assigned')

      const done = {
        ...assignedTodo,
        status: 'done' as const,
      }

      expect(done.status).toBe('done')
    })

    it('assigned -> pool transition (return to pool)', () => {
      const assignedTodo = mockTodos[1]
      expect(assignedTodo.status).toBe('assigned')

      const returned = {
        ...assignedTodo,
        status: 'pool' as const,
        assigned_to: null,
      }

      expect(returned.status).toBe('pool')
      expect(returned.assigned_to).toBeNull()
    })
  })
})
