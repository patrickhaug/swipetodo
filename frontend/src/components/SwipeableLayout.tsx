import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValue, animate } from 'motion/react'
import { BottomNav } from './BottomNav'
import { QuickAdd } from './QuickAdd'

interface SwipeableLayoutProps {
  poolContent: React.ReactNode
  mineContent: React.ReactNode
}

const SWIPE_THRESHOLD = 80

export function SwipeableLayout({ poolContent, mineContent }: SwipeableLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  const currentPage = location.pathname === '/mine' ? 'mine' : 'pool'

  const x = useMotionValue(0)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const isHorizontalSwipe = useRef<boolean | null>(null)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('[data-swipe-card], button, a, input')) return

    isDragging.current = true
    isHorizontalSwipe.current = null
    startX.current = e.clientX
    startY.current = e.clientY
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return

    const deltaX = e.clientX - startX.current
    const deltaY = e.clientY - startY.current

    if (isHorizontalSwipe.current === null && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY)
    }

    if (isHorizontalSwipe.current) {
      // Limit drag based on current page
      let limitedX = deltaX * 0.5
      if (currentPage === 'pool' && deltaX > 0) limitedX = deltaX * 0.1 // Resist right swipe on pool
      if (currentPage === 'mine' && deltaX < 0) limitedX = deltaX * 0.1 // Resist left swipe on mine
      x.set(limitedX)
    }
  }, [x, currentPage])

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false

    const currentX = x.get()

    if (isHorizontalSwipe.current) {
      if (currentX < -SWIPE_THRESHOLD && currentPage === 'pool') {
        navigate('/mine')
      } else if (currentX > SWIPE_THRESHOLD && currentPage === 'mine') {
        navigate('/')
      }
    }

    animate(x, 0, { duration: 0.2 })
    isHorizontalSwipe.current = null
  }, [x, currentPage, navigate])

  // Reset x when page changes
  useEffect(() => {
    x.set(0)
  }, [currentPage, x])

  return (
    <div className="min-h-screen bg-[#FFF9F5]">
      <div
        className="min-h-screen"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: 'pan-y' }}
      >
        <motion.div style={{ x }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.main
              key={currentPage}
              initial={{ opacity: 0, x: currentPage === 'mine' ? 100 : -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: currentPage === 'mine' ? -100 : 100 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex-1 flex flex-col items-center justify-center px-4 py-8 pb-36 min-h-screen"
            >
              {currentPage === 'pool' ? poolContent : mineContent}
            </motion.main>
          </AnimatePresence>
        </motion.div>
      </div>

      <BottomNav onAddClick={() => setShowQuickAdd(true)} />
      <QuickAdd
        open={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        autoAssignToMe={currentPage === 'mine'}
      />
    </div>
  )
}
