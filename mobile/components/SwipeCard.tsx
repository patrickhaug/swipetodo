import { ReactNode, useCallback } from 'react'
import { View, Dimensions, StyleSheet, Platform } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 48, 300)
const CARD_HEIGHT = Math.min(SCREEN_HEIGHT * 0.42, 360)
const STACK_OFFSET_Y = 18 // Generous vertical peek for obvious stacking
const STACK_SCALE_STEP = 0.06 // Visible scale reduction per card
const SWIPE_THRESHOLD = 120
const ROTATION_ANGLE = 12

// Bold shadow configs - dramatic coral-tinted depth
// Each card gets progressively softer, more diffuse shadows
const SHADOW_CONFIGS = [
  {
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffsetY: 12,
    elevation: 16,
  },
  {
    shadowOpacity: 0.28,
    shadowRadius: 22,
    shadowOffsetY: 10,
    elevation: 12,
  },
  {
    shadowOpacity: 0.20,
    shadowRadius: 16,
    shadowOffsetY: 8,
    elevation: 8,
  },
]

interface SwipeCardProps<T> {
  item: T
  renderItem: (item: T) => ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  isFirst?: boolean
  index?: number
}

function SwipeCardItem<T>({
  item,
  renderItem,
  onSwipeLeft,
  onSwipeRight,
  isFirst = true,
  index = 0,
}: SwipeCardProps<T>) {
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }
  }, [])

  const panGesture = Gesture.Pan()
    .enabled(isFirst)
    .onUpdate((e) => {
      translateX.value = e.translationX
      translateY.value = e.translationY * 0.5
    })
    .onEnd((e) => {
      const triggeredByVelocity = Math.abs(e.velocityX) > 500
      const triggeredByDistance = Math.abs(e.translationX) > SWIPE_THRESHOLD

      if (!triggeredByVelocity && !triggeredByDistance) {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 })
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 })
        return
      }

      const exitX = e.translationX > 0 ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5
      translateX.value = withTiming(exitX, { duration: 300 })

      runOnJS(triggerHaptic)()
      if (e.translationX > 0 && onSwipeRight) {
        runOnJS(onSwipeRight)()
      } else if (e.translationX < 0 && onSwipeLeft) {
        runOnJS(onSwipeLeft)()
      }
    })

  // Get shadow config for this card's depth
  const shadowConfig = SHADOW_CONFIGS[Math.min(index, SHADOW_CONFIGS.length - 1)]

  const cardStyle = useAnimatedStyle(() => {
    const swipeRotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-ROTATION_ANGLE, 0, ROTATION_ANGLE],
      Extrapolation.CLAMP
    )

    // Dramatic stack effect - visible scale and offset for obvious depth
    const scale = 1 - index * STACK_SCALE_STEP
    const stackOffsetY = index * STACK_OFFSET_Y
    // Organic rotation on back cards
    const stackRotate = index * 2

    return {
      transform: [
        { scale },
        { translateX: translateX.value },
        { translateY: translateY.value + stackOffsetY },
        { rotate: `${swipeRotate + stackRotate}deg` },
      ],
      // Back cards slightly faded for depth
      opacity: 1 - index * 0.06,
    }
  })

  const leftOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD * 1.5, -SWIPE_THRESHOLD / 2, 0],
      [1, 0.5, 0],
      Extrapolation.CLAMP
    ),
  }))

  const rightOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD / 2, SWIPE_THRESHOLD * 1.5],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    ),
  }))

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.cardWrapper,
          cardStyle,
          {
            zIndex: 10 - index,
            // Bold coral-tinted shadow - key to stack visibility
            shadowColor: '#FF6B6B',
            shadowOffset: { width: 0, height: shadowConfig.shadowOffsetY },
            shadowOpacity: shadowConfig.shadowOpacity,
            shadowRadius: shadowConfig.shadowRadius,
            elevation: shadowConfig.elevation,
          },
        ]}
      >
        {/* Card container with subtle edge definition */}
        <View style={[styles.cardGlow, index === 0 && styles.cardGlowFront]}>
          <LinearGradient
            colors={index === 0 ? ['#FFFFFF', '#FFF8F8'] : ['#FEFAFA', '#F9F4F4']}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.card}
          >
            {/* Coral accent bar */}
            <LinearGradient
              colors={['#FF6B6B', '#FF8585', '#FFADAD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.topAccent}
            />

            {/* Content */}
            <View style={styles.content}>
              {renderItem(item)}
            </View>

            {/* Left overlay - assign to me */}
            <Animated.View style={[styles.overlay, styles.overlayLeft, leftOverlayStyle]} />

            {/* Right overlay - assign to partner */}
            <Animated.View style={[styles.overlay, styles.overlayRight, rightOverlayStyle]} />
          </LinearGradient>
        </View>
      </Animated.View>
    </GestureDetector>
  )
}

interface SwipeStackProps<T> {
  items: T[]
  keyExtractor: (item: T) => string
  renderItem: (item: T) => ReactNode
  onSwipeLeft?: (item: T) => void
  onSwipeRight?: (item: T) => void
}

export function SwipeStack<T>({
  items,
  keyExtractor,
  renderItem,
  onSwipeLeft,
  onSwipeRight,
}: SwipeStackProps<T>) {
  const visibleItems = items.slice(0, 3)

  if (visibleItems.length === 0) {
    return null
  }

  return (
    <View style={styles.stackContainer}>
      <View style={styles.cardContainer}>
        {visibleItems.map((item, index) => (
          <SwipeCardItem
            key={keyExtractor(item)}
            item={item}
            renderItem={renderItem}
            isFirst={index === 0}
            index={index}
            onSwipeLeft={onSwipeLeft ? () => onSwipeLeft(item) : undefined}
            onSwipeRight={onSwipeRight ? () => onSwipeRight(item) : undefined}
          />
        )).reverse()}
      </View>
    </View>
  )
}

export { SwipeCardItem as SwipeCard }

const styles = StyleSheet.create({
  stackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT + (STACK_OFFSET_Y * 3) + 20, // Extra space for dramatic shadows
    position: 'relative',
  },
  cardWrapper: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    top: 0,
    left: 0,
    backgroundColor: 'transparent',
  },
  cardGlow: {
    flex: 1,
    borderRadius: 24,
    // Subtle edge definition
    borderWidth: 1.5,
    borderColor: 'rgba(255, 107, 107, 0.15)',
    backgroundColor: '#FFF',
  },
  cardGlowFront: {
    // Front card gets extra pop
    borderColor: 'rgba(255, 107, 107, 0.22)',
  },
  card: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
  },
  topAccent: {
    height: 6,
  },
  content: {
    flex: 1,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
  },
  overlayLeft: {
    backgroundColor: 'rgba(78, 205, 196, 0.9)',
  },
  overlayRight: {
    backgroundColor: 'rgba(255, 107, 107, 0.9)',
  },
})
