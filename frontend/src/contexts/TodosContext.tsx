import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react'
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
}

const TodosContext = createContext<TodosContextType | null>(null)

export function TodosProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [todos, setTodos] = useState<Todo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)

  const poolTodos = useMemo(
    () => todos.filter(t => t.status === 'pool'),
    [todos]
  )

  const myTodos = useMemo(
    () => todos.filter(t => t.status === 'assigned' && t.assigned_to === user?.id),
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
        // PocketBase subscription already filtered by collection rules
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
    // Optimistic update
    setTodos(current =>
      current.map(t =>
        t.id === todoId ? { ...t, status: 'assigned' as const, assigned_to: userId } : t
      )
    )

    try {
      await pb.collection('todos').update(todoId, {
        status: 'assigned',
        assigned_to: userId,
      })
    } catch (err) {
      console.error('Failed to assign todo:', err)
      loadTodos() // Rollback on error
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
      loadTodos() // Rollback on error
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
      loadTodos() // Rollback on error
    }
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
