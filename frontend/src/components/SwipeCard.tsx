import { motion, useMotionValue, useTransform, animate } from 'motion/react'
import type { PanInfo } from 'motion/react'
import { useState, useCallback } from 'react'

interface SwipeCardProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  leftLabel?: string
  rightLabel?: string
  upLabel?: string
  downLabel?: string
  gradient?: 'coral' | 'mint' | 'warm'
}

const SWIPE_THRESHOLD = 120
const VELOCITY_THRESHOLD = 500

const gradientClasses = {
  coral: 'from-[#FF6B6B] to-[#FF8E8E]',
  mint: 'from-[#4ECDC4] to-[#95E1D3]',
  warm: 'from-[#FFE66D] to-[#FF8E8E]',
}

export function SwipeCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  leftLabel = 'Ich',
  rightLabel = 'Partner',
  upLabel = 'Erledigt',
  downLabel = 'Zurück',
  gradient = 'warm',
}: SwipeCardProps) {
  const [isExiting, setIsExiting] = useState(false)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Rotate based on horizontal drag (Tinder-like tilt)
  const rotate = useTransform(x, [-300, 0, 300], [-25, 0, 25])

  // Scale slightly when dragging
  const scale = useTransform(
    x,
    [-300, -100, 0, 100, 300],
    [0.95, 1, 1, 1, 0.95]
  )

  // Opacity for direction indicators
  const leftOpacity = useTransform(x, [-SWIPE_THRESHOLD, -40, 0], [1, 0.5, 0])
  const rightOpacity = useTransform(x, [0, 40, SWIPE_THRESHOLD], [0, 0.5, 1])
  const upOpacity = useTransform(y, [-SWIPE_THRESHOLD, -40, 0], [1, 0.5, 0])
  const downOpacity = useTransform(y, [0, 40, SWIPE_THRESHOLD], [0, 0.5, 1])

  // Background card visibility based on drag distance
  const dragProgress = useTransform(
    [x, y],
    ([latestX, latestY]) => {
      const absX = Math.abs(latestX as number)
      const absY = Math.abs(latestY as number)
      return Math.min(1, Math.max(absX, absY) / 100)
    }
  )

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info
      const swipeX = offset.x
      const swipeY = offset.y
      const velocityX = velocity.x
      const velocityY = velocity.y

      // Determine dominant direction
      const absX = Math.abs(swipeX)
      const absY = Math.abs(swipeY)

      const triggeredByVelocity =
        Math.abs(velocityX) > VELOCITY_THRESHOLD ||
        Math.abs(velocityY) > VELOCITY_THRESHOLD
      const triggeredByDistance = absX > SWIPE_THRESHOLD || absY > SWIPE_THRESHOLD

      if (!triggeredByVelocity && !triggeredByDistance) {
        // Spring back to center
        animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 })
        animate(y, 0, { type: 'spring', stiffness: 500, damping: 30 })
        return
      }

      setIsExiting(true)

      if (absX > absY) {
        // Horizontal swipe
        const exitX = swipeX > 0 ? 600 : -600

        if (swipeX > 0 && onSwipeRight) onSwipeRight()
        else if (swipeX < 0 && onSwipeLeft) onSwipeLeft()

        animate(x, exitX, { duration: 0.3, ease: 'easeOut' })
      } else {
        // Vertical swipe
        const exitY = swipeY > 0 ? 600 : -600

        if (swipeY < 0 && onSwipeUp) onSwipeUp()
        else if (swipeY > 0 && onSwipeDown) onSwipeDown()

        animate(y, exitY, { duration: 0.3, ease: 'easeOut' })
      }
    },
    [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, x, y]
  )

  return (
    <motion.div
      data-swipe-card
      className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none select-none"
      style={{ x, y, rotate, scale }}
      drag={!isExiting}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing' }}
    >
      {/* Main card with gradient background */}
      <div className="relative w-full h-full">
        {/* Gradient background layer */}
        <div
          className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${gradientClasses[gradient]} opacity-90`}
        />

        {/* White content card */}
        <div className="absolute inset-3 bg-white rounded-2xl shadow-soft-lg overflow-hidden">
          {/* Left swipe indicator */}
          {onSwipeLeft && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
              style={{ opacity: leftOpacity }}
            >
              <div className="px-6 py-3 rounded-xl border-4 border-[#4ECDC4] bg-[#4ECDC4]/10 rotate-12">
                <span className="text-[#4ECDC4] font-bold text-2xl tracking-wide">
                  {leftLabel}
                </span>
              </div>
            </motion.div>
          )}

          {/* Right swipe indicator */}
          {onSwipeRight && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
              style={{ opacity: rightOpacity }}
            >
              <div className="px-6 py-3 rounded-xl border-4 border-[#FF6B6B] bg-[#FF6B6B]/10 -rotate-12">
                <span className="text-[#FF6B6B] font-bold text-2xl tracking-wide">
                  {rightLabel}
                </span>
              </div>
            </motion.div>
          )}

          {/* Up swipe indicator */}
          {onSwipeUp && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
              style={{ opacity: upOpacity }}
            >
              <div className="px-6 py-3 rounded-xl border-4 border-[#4ECDC4] bg-[#4ECDC4]/10">
                <span className="text-[#4ECDC4] font-bold text-2xl tracking-wide">
                  {upLabel}
                </span>
              </div>
            </motion.div>
          )}

          {/* Down swipe indicator */}
          {onSwipeDown && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
              style={{ opacity: downOpacity }}
            >
              <div className="px-6 py-3 rounded-xl border-4 border-[#FFE66D] bg-[#FFE66D]/10">
                <span className="text-[#d4a500] font-bold text-2xl tracking-wide">
                  {downLabel}
                </span>
              </div>
            </motion.div>
          )}

          {/* Content */}
          <div className="p-6 flex flex-col justify-center h-full">{children}</div>
        </div>
      </div>
    </motion.div>
  )
}

interface SwipeStackProps<T> {
  items: T[]
  renderItem: (item: T) => React.ReactNode
  keyExtractor: (item: T) => string
  onSwipeLeft?: (item: T) => void
  onSwipeRight?: (item: T) => void
  onSwipeUp?: (item: T) => void
  onSwipeDown?: (item: T) => void
  leftLabel?: string
  rightLabel?: string
  upLabel?: string
  downLabel?: string
  gradient?: 'coral' | 'mint' | 'warm'
}

const stackGradients: Array<'coral' | 'mint' | 'warm'> = ['warm', 'coral', 'mint']

export function SwipeStack<T>({
  items,
  renderItem,
  keyExtractor,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  leftLabel,
  rightLabel,
  upLabel,
  downLabel,
}: SwipeStackProps<T>) {
  // Show top 3 cards for stacking effect
  const visibleItems = items.slice(0, 3)

  return (
    <div className="relative w-full h-full">
      {visibleItems
        .map((item, index) => {
          const isTop = index === 0
          const scale = 1 - index * 0.04
          const yOffset = index * 12
          const rotate = index === 1 ? 2 : index === 2 ? -2 : 0

          return (
            <motion.div
              key={keyExtractor(item)}
              className="absolute inset-0"
              style={{
                zIndex: visibleItems.length - index,
              }}
              initial={false}
              animate={{
                scale,
                y: yOffset,
                rotate,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            >
              {isTop ? (
                <SwipeCard
                  onSwipeLeft={onSwipeLeft ? () => onSwipeLeft(item) : undefined}
                  onSwipeRight={
                    onSwipeRight ? () => onSwipeRight(item) : undefined
                  }
                  onSwipeUp={onSwipeUp ? () => onSwipeUp(item) : undefined}
                  onSwipeDown={onSwipeDown ? () => onSwipeDown(item) : undefined}
                  leftLabel={leftLabel}
                  rightLabel={rightLabel}
                  upLabel={upLabel}
                  downLabel={downLabel}
                  gradient={stackGradients[0]}
                >
                  {renderItem(item)}
                </SwipeCard>
              ) : (
                <div className="relative w-full h-full">
                  <div
                    className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${stackGradients[index % 3] === 'coral' ? 'from-[#FF6B6B] to-[#FF8E8E]' : stackGradients[index % 3] === 'mint' ? 'from-[#4ECDC4] to-[#95E1D3]' : 'from-[#FFE66D] to-[#FF8E8E]'} opacity-70`}
                  />
                  <div className="absolute inset-3 bg-white/90 rounded-2xl shadow-soft overflow-hidden">
                    <div className="p-6 flex flex-col justify-center h-full opacity-60">
                      {renderItem(item)}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )
        })
        .reverse()}
    </div>
  )
}

// Circular action buttons like Tinder
interface ActionButtonProps {
  onClick: () => void
  variant: 'reject' | 'accept' | 'undo' | 'done'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

const buttonStyles = {
  reject: {
    bg: 'bg-white',
    border: 'border-[#FF6B6B]/20',
    icon: 'text-[#FF6B6B]',
    hover: 'hover:bg-[#FF6B6B]/5 hover:border-[#FF6B6B]/40',
    shadow: 'shadow-soft hover:shadow-soft-lg',
  },
  accept: {
    bg: 'bg-white',
    border: 'border-[#4ECDC4]/20',
    icon: 'text-[#4ECDC4]',
    hover: 'hover:bg-[#4ECDC4]/5 hover:border-[#4ECDC4]/40',
    shadow: 'shadow-soft hover:shadow-soft-lg',
  },
  undo: {
    bg: 'bg-white',
    border: 'border-[#FFE66D]/30',
    icon: 'text-[#d4a500]',
    hover: 'hover:bg-[#FFE66D]/10 hover:border-[#FFE66D]/50',
    shadow: 'shadow-soft hover:shadow-soft-lg',
  },
  done: {
    bg: 'bg-gradient-to-br from-[#4ECDC4] to-[#95E1D3]',
    border: 'border-transparent',
    icon: 'text-white',
    hover: 'hover:opacity-90',
    shadow: 'shadow-soft-lg',
  },
}

const buttonSizes = {
  sm: 'w-12 h-12',
  md: 'w-14 h-14',
  lg: 'w-16 h-16',
}

const iconSizes = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-7 h-7',
}

export function ActionButton({
  onClick,
  variant,
  size = 'md',
  disabled = false,
}: ActionButtonProps) {
  const styles = buttonStyles[variant]

  const icons = {
    reject: (
      <svg className={iconSizes[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    accept: (
      <svg className={iconSizes[size]} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    ),
    undo: (
      <svg className={iconSizes[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a5 5 0 015 5v2M3 10l4-4m-4 4l4 4" />
      </svg>
    ),
    done: (
      <svg className={iconSizes[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    ),
  }

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${buttonSizes[size]} rounded-full border-2 flex items-center justify-center
        ${styles.bg} ${styles.border} ${styles.icon} ${styles.hover} ${styles.shadow}
        transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed
      `}
      whileHover={{ scale: disabled ? 1 : 1.08 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
    >
      {icons[variant]}
    </motion.button>
  )
}
