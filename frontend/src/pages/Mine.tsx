import { Header } from '@/components/Header'
import { SwipeCard } from '@/components/SwipeCard'
import { QuickAdd } from '@/components/QuickAdd'
import { useTodos } from '@/contexts/TodosContext'

export function Mine() {
  const { myTodos, markDone, returnToPool } = useTodos()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 p-4">
        {myTodos.length > 0 ? (
          <div className="space-y-4 max-w-sm mx-auto">
            {myTodos.map((todo) => (
              <SwipeCard
                key={todo.id}
                todo={todo}
                onSwipeLeft={() => {}} // Not used on Mine page
                onSwipeRight={() => {}} // Not used on Mine page
                onSwipeUp={() => markDone(todo.id)}
                onSwipeDown={() => returnToPool(todo.id)}
                leftLabel=""
                rightLabel=""
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
            <div>
              <p>Keine Aufgaben zugewiesen</p>
              <p className="text-sm">Geh zum Pool und swipe dir welche!</p>
            </div>
          </div>
        )}
      </main>

      <QuickAdd />
    </div>
  )
}
