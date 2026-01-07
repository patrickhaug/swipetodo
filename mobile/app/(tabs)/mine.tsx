import { useCallback } from 'react'
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { FadeIn as CustomFadeIn } from '@/components/FadeIn'
import { useTodos } from '@/contexts/TodosContext'
import { useFocusMode } from '@/contexts/FocusModeContext'
import { Svg, Path } from 'react-native-svg'
import type { Todo } from '@/types'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

// Card dimensions (focus mode)
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 48, 300)
const CARD_HEIGHT = 200

// List item dimensions (list mode)
const LIST_ITEM_WIDTH = Math.min(SCREEN_WIDTH - 32, 320)
const LIST_ITEM_HEIGHT = 52
const LIST_ITEM_GAP = 10
const LIST_START_Y = 20

const SWIPE_THRESHOLD = 80
const STACK_OFFSET = 18
const STACK_SCALE_STEP = 0.06

export default function MineScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { myTodos, reorder, markDone } = useTodos()
  const { isFocusMode, setFocusMode } = useFocusMode()

  // Morph progress: 0 = card stack, 1 = list
  const morphProgress = useSharedValue(isFocusMode ? 0 : 1)

  // Track which item is being dragged (-1 = none)
  const draggingIndex = useSharedValue(-1)
  const dragY = useSharedValue(0)

  const handleMarkDone = useCallback((todo: Todo) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    markDone(todo.id)
  }, [markDone])

  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) {
      // Reset drag state without reordering
      draggingIndex.value = -1
      dragY.value = 0
      return
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const newOrder = [...myTodos]
    const [item] = newOrder.splice(fromIndex, 1)
    newOrder.splice(toIndex, 0, item)
    // Reset drag state before reorder to prevent flash
    draggingIndex.value = -1
    dragY.value = 0
    reorder(newOrder)
  }, [myTodos, reorder, draggingIndex, dragY])

  const morphToList = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    // Animate first, update React state after animation settles
    // This prevents re-renders during animation from causing visual glitches
    morphProgress.value = withSpring(1, {
      damping: 15,
      stiffness: 80,
      mass: 0.9,
    }, (finished) => {
      if (finished) {
        runOnJS(setFocusMode)(false)
      }
    })
  }, [setFocusMode, morphProgress])

  const morphToFocus = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    // Animate first, update React state after animation settles
    morphProgress.value = withSpring(0, {
      damping: 14,
      stiffness: 90,
      mass: 0.8,
    }, (finished) => {
      if (finished) {
        runOnJS(setFocusMode)(true)
      }
    })
  }, [setFocusMode, morphProgress])

  // Empty state
  if (myTodos.length === 0) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <CustomFadeIn>
          <View style={styles.emptyContainer}>
            <Svg width={64} height={64} fill="none" stroke="#4ECDC4" viewBox="0 0 24 24">
              <Path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </Svg>
            <Text style={styles.emptyText}>All done!</Text>
          </View>
        </CustomFadeIn>
      </View>
    )
  }

  const visibleItems = myTodos.slice(0, 8)
  const screenHeight = SCREEN_HEIGHT - insets.top - insets.bottom

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Toggle header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerSpacer} />
          <FocusToggle
            morphProgress={morphProgress}
            onToggle={isFocusMode ? morphToList : morphToFocus}
          />
          <Pressable
            onPress={() => router.push('/settings')}
            style={styles.settingsButton}
          >
            <Svg width={22} height={22} fill="none" stroke="#8E8A94" viewBox="0 0 24 24">
              <Path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <Path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </Svg>
          </Pressable>
        </View>
      </View>

      {/* Morphing items - render back cards first so front card (index 0) is on top */}
      <View style={styles.morphContainer}>
        {visibleItems.map((todo, index) => (
          <MorphingItem
            key={todo.id}
            todo={todo}
            index={index}
            totalItems={visibleItems.length}
            morphProgress={morphProgress}
            draggingIndex={draggingIndex}
            dragY={dragY}
            screenHeight={screenHeight}
            onSwipeLeft={() => handleMarkDone(todo)}
            onSwipeRight={undefined}
            onPullDown={index === 0 ? morphToList : undefined}
            onReorder={handleReorder}
          />
        ))}
      </View>

      {/* More items indicator */}
      {myTodos.length > 8 && (
        <MoreIndicator morphProgress={morphProgress} count={myTodos.length - 8} />
      )}
    </View>
  )
}

// Playful toggle switch between focus (cards) and list modes
function FocusToggle({
  morphProgress,
  onToggle,
}: {
  morphProgress: SharedValue<number>
  onToggle: () => void
}) {
  // Sliding indicator
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(morphProgress.value, [0, 1], [0, 42]) },
    ],
  }))

  // Card icon opacity (visible in focus mode)
  const cardIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(morphProgress.value, [0, 0.5, 1], [1, 0.3, 0.4]),
    transform: [
      { scale: interpolate(morphProgress.value, [0, 1], [1.1, 0.9]) },
    ],
  }))

  // List icon opacity (visible in list mode)
  const listIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(morphProgress.value, [0, 0.5, 1], [0.4, 0.3, 1]),
    transform: [
      { scale: interpolate(morphProgress.value, [0, 1], [0.9, 1.1]) },
    ],
  }))

  return (
    <Pressable onPress={onToggle} style={styles.toggleContainer}>
      {/* Sliding indicator */}
      <Animated.View style={[styles.toggleIndicator, indicatorStyle]} />

      {/* Card stack icon */}
      <Animated.View style={[styles.toggleIcon, cardIconStyle]}>
        <Svg width={20} height={20} fill="none" stroke="#FF6B6B" viewBox="0 0 24 24">
          <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </Svg>
      </Animated.View>

      {/* List icon */}
      <Animated.View style={[styles.toggleIcon, listIconStyle]}>
        <Svg width={20} height={20} fill="none" stroke="#FF6B6B" viewBox="0 0 24 24">
          <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16" />
        </Svg>
      </Animated.View>
    </Pressable>
  )
}

// Item that morphs and supports drag reorder in list mode
function MorphingItem({
  todo,
  index,
  totalItems,
  morphProgress,
  draggingIndex,
  dragY,
  screenHeight,
  onSwipeLeft,
  onSwipeRight,
  onPullDown,
  onReorder,
}: {
  todo: Todo
  index: number
  totalItems: number
  morphProgress: SharedValue<number>
  draggingIndex: SharedValue<number>
  dragY: SharedValue<number>
  screenHeight: number
  onSwipeLeft: () => void
  onSwipeRight?: () => void
  onPullDown?: () => void
  onReorder: (from: number, to: number) => void
}) {
  const translateX = useSharedValue(0)
  const isFirst = index === 0
  const itemHeight = LIST_ITEM_HEIGHT + LIST_ITEM_GAP

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  }, [])

  // Horizontal swipe gesture (for completing items or flipping)
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate((e) => {
      // Only allow swipe on first card in focus mode, or any item in list mode
      const canSwipe = isFirst || morphProgress.value > 0.5
      if (canSwipe && draggingIndex.value === -1) {
        translateX.value = e.translationX
      }
    })
    .onEnd((e) => {
      // Swipe left to complete
      if (e.translationX < -SWIPE_THRESHOLD || e.velocityX < -600) {
        translateX.value = withTiming(-SCREEN_WIDTH, { duration: 200 })
        runOnJS(onSwipeLeft)()
        return
      }

      // Swipe right to flip to back (focus mode only, first card)
      if (onSwipeRight && morphProgress.value < 0.3 && (e.translationX > SWIPE_THRESHOLD || e.velocityX > 600)) {
        // Reset position immediately - the morph animation will take over
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 })
        runOnJS(onSwipeRight)()
        return
      }

      translateX.value = withSpring(0, { damping: 15 })
    })

  // Pull down gesture (for expanding to list in focus mode)
  const pullDownGesture = Gesture.Pan()
    .activeOffsetY(30)
    .failOffsetX([-15, 15])
    .onEnd((e) => {
      if (onPullDown && morphProgress.value < 0.3 && (e.translationY > 50 || e.velocityY > 400)) {
        runOnJS(onPullDown)()
      }
    })

  // Long press + drag gesture (for reordering in list mode)
  const dragGesture = Gesture.Pan()
    .activateAfterLongPress(200)
    .onStart(() => {
      // Only allow drag in list mode
      if (morphProgress.value > 0.7) {
        draggingIndex.value = index
        dragY.value = 0
        runOnJS(triggerHaptic)()
      }
    })
    .onUpdate((e) => {
      if (draggingIndex.value === index) {
        dragY.value = e.translationY
      }
    })
    .onEnd(() => {
      if (draggingIndex.value === index) {
        const moveBy = Math.round(dragY.value / itemHeight)
        const newIndex = Math.max(0, Math.min(totalItems - 1, index + moveBy))

        if (newIndex !== index) {
          runOnJS(onReorder)(index, newIndex)
        }

        draggingIndex.value = -1
        dragY.value = 0
      }
    })

  // Combine gestures - race between swipe, pull-down, and drag
  const gesture = Gesture.Race(swipeGesture, pullDownGesture, dragGesture)

  // Main morphing + drag animation
  const itemStyle = useAnimatedStyle(() => {
    const progress = morphProgress.value
    const isDragging = draggingIndex.value === index
    const somethingDragging = draggingIndex.value !== -1

    // === FOCUS MODE (progress = 0) ===
    const centerY = screenHeight / 2 - CARD_HEIGHT / 2
    const focusY = centerY + index * STACK_OFFSET
    const focusScale = 1 - index * STACK_SCALE_STEP
    const focusRotation = index * 2
    const focusOpacity = isFirst ? 1 : Math.max(0.5, 1 - index * 0.15)

    // === LIST MODE (progress = 1) ===
    let listY = LIST_START_Y + index * itemHeight

    // If something is being dragged, shift other items
    if (somethingDragging && !isDragging) {
      const draggedIndex = draggingIndex.value
      const dragOffset = dragY.value
      const draggedNewPos = draggedIndex + Math.round(dragOffset / itemHeight)

      // Shift items to make room
      if (draggedIndex < index && draggedNewPos >= index) {
        listY -= itemHeight // Move up
      } else if (draggedIndex > index && draggedNewPos <= index) {
        listY += itemHeight // Move down
      }
    }

    // === INTERPOLATE ===
    const baseY = interpolate(progress, [0, 1], [focusY, listY])
    const width = interpolate(progress, [0, 1], [CARD_WIDTH, LIST_ITEM_WIDTH])
    const height = interpolate(progress, [0, 1], [CARD_HEIGHT, LIST_ITEM_HEIGHT])
    const scale = interpolate(progress, [0, 1], [focusScale, isDragging ? 1.02 : 1])
    const rotation = interpolate(progress, [0, 1], [focusRotation, 0])
    const opacity = interpolate(progress, [0, 1], [focusOpacity, 1])
    const borderRadius = interpolate(progress, [0, 1], [24, 14])

    // Shadow - enhanced when dragging
    const baseShadowOpacity = interpolate(progress, [0, 1], [0.35 - index * 0.07, 0.08])
    const shadowOpacity = isDragging ? 0.3 : baseShadowOpacity
    const baseShadowRadius = interpolate(progress, [0, 1], [28 - index * 5, 8])
    const shadowRadius = isDragging ? 20 : baseShadowRadius

    // Position with drag offset
    const y = isDragging ? baseY + dragY.value : baseY

    // Gesture offset (horizontal swipe)
    const gestureX = translateX.value
    const gestureRotation = isFirst && progress < 0.5
      ? interpolate(translateX.value, [-200, 0, 200], [-12, 0, 12], Extrapolation.CLAMP)
      : interpolate(translateX.value, [-150, 0], [-3, 0], Extrapolation.CLAMP)

    return {
      position: 'absolute' as const,
      left: (SCREEN_WIDTH - width) / 2,
      top: y,
      width,
      height,
      borderRadius,
      opacity: isDragging ? 1 : opacity,
      shadowOpacity,
      shadowRadius,
      elevation: isDragging ? 20 : Math.round(interpolate(progress, [0, 1], [16 - index * 3, 3])),
      transform: [
        { translateX: gestureX },
        { scale },
        { rotate: `${rotation + gestureRotation}deg` },
      ],
      zIndex: isDragging ? 2000 : 1000 - index * 100,
    }
  })

  // Content styling
  const contentStyle = useAnimatedStyle(() => ({
    padding: interpolate(morphProgress.value, [0, 1], [24, 14]),
  }))

  const textStyle = useAnimatedStyle(() => {
    const progress = morphProgress.value
    return {
      fontSize: interpolate(progress, [0, 1], [isFirst ? 20 : 16, 14]),
      lineHeight: interpolate(progress, [0, 1], [28, 20]),
    }
  })

  // Complete overlay (swipe left)
  const completeOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-100, -40, 0], [1, 0.5, 0], Extrapolation.CLAMP),
    borderRadius: interpolate(morphProgress.value, [0, 1], [24, 14]),
  }))

  // Flip overlay (swipe right - focus mode only, hide during morph)
  const flipOverlayStyle = useAnimatedStyle(() => {
    // Only show flip overlay in focus mode (morphProgress < 0.3)
    const showOverlay = morphProgress.value < 0.3
    return {
      opacity: showOverlay
        ? interpolate(translateX.value, [0, 40, 100], [0, 0.5, 1], Extrapolation.CLAMP)
        : 0,
      borderRadius: interpolate(morphProgress.value, [0, 1], [24, 14]),
    }
  })

  // Accent bar
  const accentStyle = useAnimatedStyle(() => ({
    height: interpolate(morphProgress.value, [0, 1], [5, 3]),
  }))

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.item, itemStyle]}>
        <View style={styles.itemInner}>
          {/* Accent bar */}
          <Animated.View style={[styles.accentBar, accentStyle]}>
            <LinearGradient
              colors={['#FF6B6B', '#FF8585']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          {/* Content */}
          <Animated.View style={[styles.itemContent, contentStyle]}>
            <Animated.Text
              style={[styles.itemText, textStyle, !isFirst && morphProgress.value < 0.5 && styles.itemTextSecondary]}
              numberOfLines={morphProgress.value > 0.5 ? 1 : 3}
            >
              {todo.text}
            </Animated.Text>
          </Animated.View>

          {/* Complete overlay (swipe left) */}
          <Animated.View style={[styles.completeOverlay, completeOverlayStyle]}>
            <Svg width={28} height={28} fill="none" stroke="#fff" viewBox="0 0 24 24">
              <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </Svg>
          </Animated.View>

          {/* Flip overlay (swipe right - first card only) */}
          {isFirst && (
            <Animated.View style={[styles.flipOverlay, flipOverlayStyle]}>
              <Svg width={28} height={28} fill="none" stroke="#fff" viewBox="0 0 24 24">
                <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </Svg>
            </Animated.View>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  )
}

// More items indicator
function MoreIndicator({
  morphProgress,
  count,
}: {
  morphProgress: SharedValue<number>
  count: number
}) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(morphProgress.value, [0.6, 1], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(morphProgress.value, [0.6, 1], [20, 0], Extrapolation.CLAMP) },
    ],
  }))

  return (
    <Animated.View style={[styles.moreIndicator, style]}>
      <Text style={styles.moreText}>+{count} more</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF8F3',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '500',
  },

  // Header
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 200,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 40,
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Toggle switch
  toggleContainer: {
    width: 92,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleIndicator: {
    position: 'absolute',
    left: 4,
    width: 42,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleIcon: {
    width: 46,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Morph container
  morphContainer: {
    flex: 1,
  },

  // Item
  item: {
    backgroundColor: '#fff',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    overflow: 'hidden',
  },
  itemInner: {
    flex: 1,
    overflow: 'hidden',
  },
  accentBar: {
    width: '100%',
    overflow: 'hidden',
  },
  itemContent: {
    flex: 1,
    justifyContent: 'center',
  },
  itemText: {
    fontWeight: '600',
    color: '#2D3436',
    textAlign: 'center',
  },
  itemTextSecondary: {
    opacity: 0.75,
  },
  completeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#4ECDC4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // More indicator
  moreIndicator: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  moreText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
})
