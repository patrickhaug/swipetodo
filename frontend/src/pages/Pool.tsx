import { motion } from 'motion/react'
import { SwipeStack } from '@/components/SwipeCard'
import { useAuth } from '@/contexts/AuthContext'
import { useTodos } from '@/contexts/TodosContext'
import type { Todo } from '@/types'

export function PoolContent() {
  const { user, partner } = useAuth()
  const { poolTodos, assignTo } = useTodos()

  const handleSwipeLeft = (todo: Todo) => {
    if (user) {
      assignTo(todo.id, user.id)
    }
  }

  const handleSwipeRight = (todo: Todo) => {
    if (partner) {
      assignTo(todo.id, partner.id)
    }
  }

  if (poolTodos.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-center"
      >
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#FFE8E8] to-[#FFF9F5] flex items-center justify-center">
          <svg className="w-16 h-16 text-[#FF8E8E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-sm flex flex-col items-center"
    >
      {/* Card stack container */}
      <div className="relative w-full aspect-[3/4] max-h-[420px]">
        <SwipeStack
          items={poolTodos}
          keyExtractor={(todo) => todo.id}
          renderItem={(todo) => (
            <div className="flex flex-col items-center text-center">
              <p className="text-xl font-semibold text-[#2D2A32] leading-relaxed">
                {todo.text}
              </p>
              {todo.due_date && (
                <p className="text-sm text-[#8E8A94] mt-3 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  bis {new Date(todo.due_date).toLocaleDateString('de-DE')}
                </p>
              )}
            </div>
          )}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          leftLabel="Ich"
          rightLabel="Partner"
        />
      </div>

    </motion.div>
  )
}
