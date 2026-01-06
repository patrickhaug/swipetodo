import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '@/contexts/AuthContext'
import { useTodos } from '@/contexts/TodosContext'

interface QuickAddProps {
  open: boolean
  onClose: () => void
  autoAssignToMe?: boolean
}

export function QuickAdd({ open, onClose, autoAssignToMe }: QuickAddProps) {
  const [text, setText] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const { createTodo, assignTo } = useTodos()
  const dateInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setText('')
      setDueDate('')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return

    setIsLoading(true)
    try {
      const todoId = await createTodo(text, dueDate || undefined)
      if (autoAssignToMe && user && todoId) {
        await assignTo(todoId, user.id)
      }
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed left-4 right-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
          >
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-soft-lg overflow-hidden p-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Neue Aufgabe..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  autoFocus
                  className="flex-1 h-12 px-4 rounded-xl border border-[#F0EBE7] bg-[#F5F0EC] focus:bg-white focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/20 outline-none transition-all text-[#2D2A32] placeholder:text-[#8E8A94]"
                />

                <button
                  type="button"
                  onClick={() => dateInputRef.current?.showPicker()}
                  className={`flex-shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center transition-colors ${
                    dueDate
                      ? 'border-[#FF6B6B] bg-[#FF6B6B]/10 text-[#FF6B6B]'
                      : 'border-[#F0EBE7] bg-[#F5F0EC] text-[#8E8A94] hover:text-[#FF6B6B]'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="sr-only"
                  />
                </button>

                <button
                  type="submit"
                  disabled={isLoading || !text.trim()}
                  className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] text-white flex items-center justify-center disabled:opacity-50 transition-opacity"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </div>

              {dueDate && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-xs text-[#8E8A94] mt-2 pl-1"
                >
                  Fällig: {new Date(dueDate).toLocaleDateString('de-DE')}
                </motion.p>
              )}
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
