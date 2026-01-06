import { motion } from 'motion/react'
import { useAuth } from '@/contexts/AuthContext'
import { useTodos } from '@/contexts/TodosContext'

export function Header() {
  const { logout, user } = useAuth()
  const { isConnected } = useTodos()

  return (
    <header className="relative z-40">
      {/* Glass header background */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-xl border-b border-[#F0EBE7]" />

      {/* Header content */}
      <div className="relative flex items-center justify-between px-5 py-4">
        {/* Logo / Brand */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          {/* Heart logo */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6B6B] to-[#FF8E8E] flex items-center justify-center shadow-soft">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#2D2A32] tracking-tight">
              SwipeTodo
            </h1>
            <p className="text-xs text-[#8E8A94] -mt-0.5">
              {user?.display_name || 'Zusammen schaffen'}
            </p>
          </div>
        </motion.div>

        {/* Right side actions */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          {/* Connection status */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5F0EC]">
            <motion.span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-[#4ECDC4]' : 'bg-[#FF6B6B]'
              }`}
              animate={
                isConnected
                  ? { scale: [1, 1.2, 1] }
                  : { opacity: [1, 0.5, 1] }
              }
              transition={{ repeat: Infinity, duration: 2 }}
            />
            <span className="text-xs font-medium text-[#8E8A94]">
              {isConnected ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Logout button */}
          <motion.button
            onClick={logout}
            className="w-9 h-9 rounded-xl bg-[#F5F0EC] hover:bg-[#FFE8E8] flex items-center justify-center text-[#8E8A94] hover:text-[#FF6B6B] transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </motion.button>
        </motion.div>
      </div>
    </header>
  )
}
