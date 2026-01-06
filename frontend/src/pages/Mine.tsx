import { useState, useEffect } from 'react'
import { motion, Reorder, useDragControls } from 'motion/react'
import { useTodos } from '@/contexts/TodosContext'
import type { Todo } from '@/types'

export function MineContent() {
  const { myTodos, markDone, returnToPool } = useTodos()
  const [orderedTodos, setOrderedTodos] = useState<Todo[]>(myTodos)

  // Sync with context when todos change
  useEffect(() => {
    setOrderedTodos(myTodos)
  }, [myTodos])

  if (myTodos.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center px-8"
      >
        <motion.div
          className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#4ECDC4]/20 to-[#95E1D3]/10 flex items-center justify-center"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <svg className="w-16 h-16 text-[#4ECDC4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </motion.div>
        <h2 className="text-xl font-semibold text-[#2D2A32] mb-2">
          Alles erledigt!
        </h2>
        <p className="text-[#8E8A94] max-w-xs mx-auto">
          Du hast keine Aufgaben. Geh zum Pool und schnapp dir welche!
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md px-4 flex flex-col justify-center min-h-full"
    >
      <Reorder.Group
        axis="y"
        values={orderedTodos}
        onReorder={setOrderedTodos}
        className="space-y-3"
      >
        {orderedTodos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onDone={() => markDone(todo.id)}
            onReturn={() => returnToPool(todo.id)}
          />
        ))}
      </Reorder.Group>
    </motion.div>
  )
}

interface TodoItemProps {
  todo: Todo
  onDone: () => void
  onReturn: () => void
}

function TodoItem({ todo, onDone, onReturn }: TodoItemProps) {
  const dragControls = useDragControls()
  const [swipeX, setSwipeX] = useState(0)

  const handleDragEnd = () => {
    if (swipeX > 100) {
      onDone()
    } else if (swipeX < -100) {
      onReturn()
    }
    setSwipeX(0)
  }

  return (
    <Reorder.Item
      value={todo}
      dragListener={false}
      dragControls={dragControls}
      className="relative"
      data-swipe-card
    >
      {/* Swipe indicators behind */}
      <div className="absolute inset-0 rounded-2xl flex items-center justify-between px-4 overflow-hidden">
        <div
          className="flex items-center gap-2 text-[#4ECDC4] transition-opacity"
          style={{ opacity: Math.max(0, swipeX / 100) }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium">Erledigt</span>
        </div>
        <div
          className="flex items-center gap-2 text-[#FF6B6B] transition-opacity"
          style={{ opacity: Math.max(0, -swipeX / 100) }}
        >
          <span className="text-sm font-medium">Zurück</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </div>
      </div>

      {/* Main card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.5}
        onDrag={(_, info) => setSwipeX(info.offset.x)}
        onDragEnd={handleDragEnd}
        animate={{ x: 0 }}
        className="relative bg-white rounded-2xl shadow-soft border border-[#F0EBE7] p-4 cursor-grab active:cursor-grabbing"
        style={{
          x: swipeX,
          backgroundColor: swipeX > 50 ? `rgba(78, 205, 196, ${swipeX / 300})` :
                           swipeX < -50 ? `rgba(255, 107, 107, ${-swipeX / 300})` : 'white'
        }}
      >
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="touch-none"
        >
          <p className="text-[#2D2A32] font-medium leading-snug">
            {todo.text}
          </p>
          {todo.due_date && (
            <p className="text-xs text-[#8E8A94] mt-1.5 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              bis {new Date(todo.due_date).toLocaleDateString('de-DE')}
            </p>
          )}
        </div>
      </motion.div>
    </Reorder.Item>
  )
}
