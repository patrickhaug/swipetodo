import { ReactNode, useCallback } from 'react'
import { Dimensions } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const SWIPE_THRESHOLD = 50

interface SwipeNavigatorProps {
  children: ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
}

export function SwipeNavigator({ children, onSwipeLeft, onSwipeRight }: SwipeNavigatorProps) {
  const translateX = useSharedValue(0)

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }, [])

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-10, 10])
    .onUpdate((e) => {
      translateX.value = e.translationX * 0.3
    })
    .onEnd((e) => {
      const triggered = Math.abs(e.translationX) > SWIPE_THRESHOLD || Math.abs(e.velocityX) > 500

      if (triggered) {
        runOnJS(triggerHaptic)()
        if (e.translationX > 0 && onSwipeRight) {
          runOnJS(onSwipeRight)()
        } else if (e.translationX < 0 && onSwipeLeft) {
          runOnJS(onSwipeLeft)()
        }
      }

      translateX.value = withSpring(0, { damping: 20, stiffness: 300 })
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  )
}
