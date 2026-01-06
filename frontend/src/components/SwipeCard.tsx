import { useDrag } from '@use-gesture/react'
import { animated, useSpring } from '@react-spring/web'
import { Card, CardContent } from '@/components/ui/card'
import { Todo } from '@/types'
import { cn } from '@/lib/utils'

interface SwipeCardProps {
  todo: Todo
  onSwipeLeft: () => void
  onSwipeRight: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  leftLabel?: string
  rightLabel?: string
}

const SWIPE_THRESHOLD = 100
const VELOCITY_THRESHOLD = 0.5

export function SwipeCard({
  todo,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  leftLabel = '←',
  rightLabel = '→',
}: SwipeCardProps) {
  const [{ x, y, rotate, scale }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
  }))

  const bind = useDrag(
    ({ active, movement: [mx, my], velocity: [vx, vy] }) => {
      const isHorizontal = Math.abs(mx) > Math.abs(my)

      if (!active) {
        const triggeredX = Math.abs(mx) > SWIPE_THRESHOLD || Math.abs(vx) > VELOCITY_THRESHOLD
        const triggeredY = Math.abs(my) > SWIPE_THRESHOLD || Math.abs(vy) > VELOCITY_THRESHOLD

        if (triggeredX && isHorizontal) {
          const flyOut = mx > 0 ? 500 : -500
          api.start({
            x: flyOut,
            rotate: flyOut / 10,
            config: { friction: 50, tension: 200 },
            onRest: () => {
              mx > 0 ? onSwipeRight() : onSwipeLeft()
            },
          })
          return
        }

        if (triggeredY && !isHorizontal && (onSwipeUp || onSwipeDown)) {
          const flyOut = my > 0 ? 500 : -500
          api.start({
            y: flyOut,
            config: { friction: 50, tension: 200 },
            onRest: () => {
              my < 0 ? onSwipeUp?.() : onSwipeDown?.()
            },
          })
          return
        }

        api.start({ x: 0, y: 0, rotate: 0, scale: 1 })
        return
      }

      api.start({
        x: mx,
        y: isHorizontal ? 0 : my,
        rotate: isHorizontal ? mx / 20 : 0,
        scale: active ? 1.05 : 1,
        immediate: (key) => key === 'x' || key === 'y',
      })
    },
    { filterTaps: true }
  )

  return (
    <div className="relative w-full max-w-sm touch-none">
      <animated.div
        className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none"
        style={{
          opacity: x.to((val) => Math.min(Math.abs(val) / 100, 1)),
        }}
      >
        <span className="text-2xl font-bold text-blue-500">{leftLabel}</span>
        <span className="text-2xl font-bold text-pink-500">{rightLabel}</span>
      </animated.div>

      {(onSwipeUp || onSwipeDown) && (
        <animated.div
          className="absolute inset-0 flex flex-col items-center justify-between py-4 pointer-events-none"
          style={{
            opacity: y.to((val) => Math.min(Math.abs(val) / 100, 1)),
          }}
        >
          <span className="text-2xl font-bold text-green-500">✓ Erledigt</span>
          <span className="text-2xl font-bold text-yellow-500">↩ Zurück</span>
        </animated.div>
      )}

      <animated.div
        {...bind()}
        style={{ x, y, rotate, scale }}
        className="cursor-grab active:cursor-grabbing"
      >
        <Card className={cn("transition-shadow", "hover:shadow-lg")}>
          <CardContent className="p-6">
            <p className="text-lg font-medium">{todo.text}</p>
            {todo.due_date && (
              <p className="text-sm text-muted-foreground mt-2">
                bis {new Date(todo.due_date).toLocaleDateString('de-DE')}
              </p>
            )}
          </CardContent>
        </Card>
      </animated.div>
    </div>
  )
}
