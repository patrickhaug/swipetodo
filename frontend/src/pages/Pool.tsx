import { useState } from 'react'
import { Header } from '@/components/Header'
import { SwipeCard } from '@/components/SwipeCard'
import { QuickAdd } from '@/components/QuickAdd'
import { useAuth } from '@/contexts/AuthContext'
import { useTodos } from '@/contexts/TodosContext'

export function Pool() {
  const { user } = useAuth()
  const { poolTodos, assignTo } = useTodos()
  const [currentIndex, setCurrentIndex] = useState(0)

  const currentTodo = poolTodos[currentIndex]

  const handleSwipe = (userId: string) => {
    if (currentTodo) {
      assignTo(currentTodo.id, userId)
      // Move to next card (or back to 0 if at end)
      setCurrentIndex((prev) => (prev >= poolTodos.length - 1 ? 0 : prev + 1))
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {currentTodo ? (
          <>
            <SwipeCard
              todo={currentTodo}
              onSwipeLeft={() => handleSwipe(user!.id)}
              onSwipeRight={() => handleSwipe(user!.id)} // TODO: Get partner ID
              leftLabel="Ich"
              rightLabel="Partner"
            />
            <div className="mt-4 text-sm text-muted-foreground">
              {currentIndex + 1} von {poolTodos.length}
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground">
            <p>Keine Aufgaben im Pool</p>
          </div>
        )}
      </main>

      <QuickAdd />
    </div>
  )
}
