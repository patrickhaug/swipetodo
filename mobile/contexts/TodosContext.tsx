import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useRef } from 'react'
import { pb } from '@/lib/pocketbase'
import { useAuth } from './AuthContext'
import type { Todo } from '@/types'

interface TodosContextType {
  todos: Todo[]
  poolTodos: Todo[]
  myTodos: Todo[]
  isLoading: boolean
  isConnected: boolean
  createTodo: (text: string, dueDate?: string) => Promise<string | undefined>
  assignTo: (todoId: string, userId: string) => Promise<void>
  markDone: (todoId: string) => Promise<void>
  returnToPool: (todoId: string) => Promise<void>
  reorder: (reorderedData: Todo[]) => void
}

const TodosContext = createContext<TodosContextType | null>(null)

export function TodosProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [todos, setTodos] = useState<Todo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const isReorderingRef = useRef(false)

  const poolTodos = useMemo(
    () => todos.filter(t => t.status === 'pool'),
    [todos]
  )

  const myTodos = useMemo(
    () => todos
      .filter(t => t.status === 'assigned' && t.assigned_to === user?.id)
      .sort((a, b) => {
        // Primary: sort by sort_order
        const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0)
        if (orderDiff !== 0) return orderDiff
        // Secondary: stable tiebreaker by id (prevents reordering on re-renders)
        return a.id.localeCompare(b.id)
      }),
    [todos, user]
  )

  useEffect(() => {
    if (!user?.household) {
      setIsLoading(false)
      return
    }

    loadTodos()
    const unsubscribePromise = subscribeToTodos()

    return () => {
      unsubscribePromise.then(unsub => unsub?.())
    }
  }, [user?.household])

  const loadTodos = async () => {
    try {
      const result = await pb.collection('todos').getList<Todo>(1, 200, {
        sort: '-created',
        $autoCancel: false,
      })
      setTodos(result.items)
      setIsConnected(true)
    } catch (err) {
      console.error('Failed to load todos:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const subscribeToTodos = async () => {
    try {
      return await pb.collection('todos').subscribe<Todo>('*', (e) => {
        // Skip ALL events during reordering to prevent flicker
        if (isReorderingRef.current) {
          return
        }

        setTodos(current => {
          switch (e.action) {
            case 'create':
              return [e.record, ...current]
            case 'update':
              return current.map(t => t.id === e.record.id ? e.record : t)
            case 'delete':
              return current.filter(t => t.id !== e.record.id)
            default:
              return current
          }
        })
      })
    } catch (err) {
      console.error('Failed to subscribe:', err)
      setIsConnected(false)
    }
  }

  const createTodo = async (text: string, dueDate?: string): Promise<string | undefined> => {
    try {
      const record = await pb.collection('todos').create({
        text,
        due_date: dueDate || null,
        status: 'pool',
        household: user!.household,
        created_by: user!.id,
      })
      return record.id
    } catch (err) {
      console.error('Failed to create todo:', err)
      throw err
    }
  }

  const assignTo = async (todoId: string, userId: string) => {
    // Get max sort_order for this user's todos
    const userTodos = todos.filter(t => t.status === 'assigned' && t.assigned_to === userId)
    const maxOrder = userTodos.reduce((max, t) => Math.max(max, t.sort_order ?? 0), 0)
    const newOrder = maxOrder + 1

    // Optimistic update
    setTodos(current =>
      current.map(t =>
        t.id === todoId ? { ...t, status: 'assigned' as const, assigned_to: userId, sort_order: newOrder } : t
      )
    )

    try {
      await pb.collection('todos').update(todoId, {
        status: 'assigned',
        assigned_to: userId,
        sort_order: newOrder,
      })
    } catch (err) {
      console.error('Failed to assign todo:', err)
      loadTodos()
    }
  }

  const markDone = async (todoId: string) => {
    // Optimistic update
    setTodos(current =>
      current.map(t =>
        t.id === todoId ? { ...t, status: 'done' as const } : t
      )
    )

    try {
      await pb.collection('todos').update(todoId, { status: 'done' })
    } catch (err) {
      loadTodos()
    }
  }

  const returnToPool = async (todoId: string) => {
    // Optimistic update
    setTodos(current =>
      current.map(t =>
        t.id === todoId ? { ...t, status: 'pool' as const, assigned_to: null } : t
      )
    )

    try {
      await pb.collection('todos').update(todoId, {
        status: 'pool',
        assigned_to: '',
      })
    } catch (err) {
      loadTodos()
    }
  }

  const reorder = (reorderedData: Todo[]) => {
    // Optimistic update - immediately update local state
    const updatedItems = reorderedData.map((item, index) => ({
      ...item,
      sort_order: index,
    }))

    setTodos(current => {
      const others = current.filter(t => !(t.status === 'assigned' && t.assigned_to === user?.id))
      return [...others, ...updatedItems]
    })

    // Persist to DB in background
    isReorderingRef.current = true
    const updates = reorderedData.map((item, index) => ({
      id: item.id,
      sort_order: index,
    }))

    Promise.all(
      updates.map(({ id, sort_order }) =>
        pb.collection('todos').update(id, { sort_order })
      )
    )
      .catch(err => {
        console.error('Failed to reorder:', err)
        loadTodos()
      })
      .finally(() => {
        setTimeout(() => {
          isReorderingRef.current = false
        }, 500)
      })
  }

  return (
    <TodosContext.Provider value={{
      todos,
      poolTodos,
      myTodos,
      isLoading,
      isConnected,
      createTodo,
      assignTo,
      markDone,
      returnToPool,
      reorder,
    }}>
      {children}
    </TodosContext.Provider>
  )
}

export function useTodos() {
  const context = useContext(TodosContext)
  if (!context) {
    throw new Error('useTodos must be used within TodosProvider')
  }
  return context
}
