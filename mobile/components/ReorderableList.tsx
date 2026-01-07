import { ReactNode, useCallback, useRef, useMemo } from 'react'
import { View, Text, StyleSheet, Platform, Pressable, TouchableOpacity, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist'
import SwipeableItem, { OpenDirection, useSwipeableItemParams, SwipeableItemImperativeRef } from 'react-native-swipeable-item'
import * as Haptics from 'expo-haptics'

const ITEM_HEIGHT = 44
const OVERSWIPE_DIST = 20

interface ReorderableListProps<T> {
  items: T[]
  keyExtractor: (item: T) => string
  renderItem: (item: T) => ReactNode
  onReorder?: (data: T[]) => void
  onSwipeLeft?: (item: T) => void
}

// Underlay component that appears when swiping left
function RightUnderlay({ onPress }: { onPress: () => void }) {
  const { percentOpen, close } = useSwipeableItemParams<any>()

  const handlePress = useCallback(() => {
    close()
    onPress()
  }, [close, onPress])

  return (
    <View style={styles.rightUnderlay}>
      <TouchableOpacity onPress={handlePress} style={styles.underlayButton}>
        <Text style={styles.underlayText}>✓</Text>
      </TouchableOpacity>
    </View>
  )
}

interface RowItemProps<T> {
  item: T
  renderContent: (item: T) => ReactNode
  onSwipeLeft?: (item: T) => void
  drag: () => void
  isActive: boolean
  itemKey: string
}

function RowItem<T>({
  item,
  renderContent,
  onSwipeLeft,
  drag,
  isActive,
  itemKey,
}: RowItemProps<T>) {
  const swipeableRef = useRef<SwipeableItemImperativeRef>(null)

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }
  }, [])

  const handleSwipeComplete = useCallback(() => {
    triggerHaptic()
    onSwipeLeft?.(item)
  }, [onSwipeLeft, item, triggerHaptic])

  const handleLongPress = useCallback(() => {
    triggerHaptic()
    drag()
  }, [drag, triggerHaptic])

  const handleSwipeChange = useCallback((params: { openDirection: OpenDirection }) => {
    // Auto-complete when fully swiped (overswipe)
    if (params.openDirection === 'right') {
      // Small delay to let animation complete
      setTimeout(() => {
        swipeableRef.current?.close()
        handleSwipeComplete()
      }, 100)
    }
  }, [handleSwipeComplete])

  return (
    <ScaleDecorator>
      <SwipeableItem
        ref={swipeableRef}
        item={item}
        overSwipe={OVERSWIPE_DIST}
        snapPointsRight={[80]}
        renderUnderlayRight={() => (
          <RightUnderlay onPress={handleSwipeComplete} />
        )}
        onChange={handleSwipeChange}
      >
        <Pressable
          onLongPress={handleLongPress}
          delayLongPress={200}
          disabled={isActive}
        >
          <View style={[styles.itemContainer, isActive && styles.itemActive]}>
            {renderContent(item)}
          </View>
        </Pressable>
      </SwipeableItem>
    </ScaleDecorator>
  )
}

const ITEM_TOTAL_HEIGHT = ITEM_HEIGHT + 8
const TAB_BAR_HEIGHT = 90

export function ReorderableList<T>({
  items,
  keyExtractor,
  renderItem,
  onReorder,
  onSwipeLeft,
}: ReorderableListProps<T>) {
  const { height: windowHeight } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const contentStyle = useMemo(() => {
    const contentHeight = items.length * ITEM_TOTAL_HEIGHT
    const availableHeight = windowHeight - insets.top - TAB_BAR_HEIGHT
    const verticalPadding = Math.max(24, (availableHeight - contentHeight) / 2)

    return {
      paddingTop: verticalPadding,
      paddingBottom: verticalPadding,
      paddingHorizontal: 16,
    }
  }, [items.length, windowHeight, insets.top])

  const handleDragEnd = useCallback(({ data }: { data: T[] }) => {
    onReorder?.(data)
  }, [onReorder])

  const renderDraggableItem = useCallback(({ item, drag, isActive }: RenderItemParams<T>) => (
    <RowItem
      item={item}
      renderContent={renderItem}
      onSwipeLeft={onSwipeLeft}
      drag={drag}
      isActive={isActive}
      itemKey={keyExtractor(item)}
    />
  ), [renderItem, onSwipeLeft, keyExtractor])

  return (
    <View style={styles.container}>
      <DraggableFlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderDraggableItem}
        onDragEnd={handleDragEnd}
        contentContainerStyle={contentStyle}
        showsVerticalScrollIndicator={false}
        activationDistance={10}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemContainer: {
    height: ITEM_HEIGHT,
    marginBottom: 8,
    marginHorizontal: 'auto',
    width: 288,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  itemActive: {
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  rightUnderlay: {
    backgroundColor: '#4ECDC4',
    height: ITEM_HEIGHT,
    width: 80,
    marginBottom: 8,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  underlayButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  underlayText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 20,
  },
})
