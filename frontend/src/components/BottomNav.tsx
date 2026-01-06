import { Link, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'

interface BottomNavProps {
  onAddClick?: () => void
}

export function BottomNav({ onAddClick }: BottomNavProps) {
  const location = useLocation()

  const tabs = [
    { path: '/', icon: PoolIcon },
    { path: '/mine', icon: MineIcon },
  ]

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
        className="relative flex items-center gap-8 px-6 py-3 rounded-full bg-white/90 backdrop-blur-xl shadow-soft-lg border border-[#F0EBE7]"
      >
        {/* Pool tab */}
        <Link to={tabs[0].path}>
          <motion.div
            className={`
              flex items-center justify-center w-10 h-10 rounded-full
              transition-colors duration-200
              ${location.pathname === tabs[0].path ? 'text-[#FF6B6B]' : 'text-[#8E8A94]'}
            `}
            whileTap={{ scale: 0.95 }}
          >
            <PoolIcon className="w-6 h-6" />
          </motion.div>
        </Link>

        {/* Add button - morphs out of the container */}
        <motion.button
          onClick={onAddClick}
          className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center justify-center w-[72px] h-[72px] rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] text-white shadow-lg shadow-[#FF6B6B]/30"
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </motion.button>

        {/* Spacer for the popped-out button */}
        <div className="w-10" />

        {/* Mine tab */}
        <Link to={tabs[1].path}>
          <motion.div
            className={`
              flex items-center justify-center w-10 h-10 rounded-full
              transition-colors duration-200
              ${location.pathname === tabs[1].path ? 'text-[#FF6B6B]' : 'text-[#8E8A94]'}
            `}
            whileTap={{ scale: 0.95 }}
          >
            <MineIcon className="w-6 h-6" />
          </motion.div>
        </Link>
      </motion.div>
    </nav>
  )
}

function PoolIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
    </svg>
  )
}

function MineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  )
}
