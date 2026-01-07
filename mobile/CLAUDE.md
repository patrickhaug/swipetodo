# CLAUDE.md - AI Assistant Guidelines for SwipeTodo

This document provides context for AI assistants working on this codebase.

## Project Overview

SwipeTodo is a React Native Expo app for collaborative task management. Users swipe to assign tasks, with real-time sync via PocketBase.

## Tech Stack Quick Reference

| Technology | Version | Purpose |
|------------|---------|---------|
| Expo | 54 | App framework |
| React Native | 0.81 | Mobile runtime |
| Expo Router | 6 | File-based navigation |
| Reanimated | 4 | Animations |
| Gesture Handler | 2.28 | Touch gestures |
| NativeWind | 4 | Tailwind styling |
| PocketBase | 0.26 | Backend/realtime |

## Key Patterns

### Animation Pattern (Reanimated)
```typescript
// Use shared values for animations
const progress = useSharedValue(0)

// Animated styles read shared values
const style = useAnimatedStyle(() => ({
  opacity: interpolate(progress.value, [0, 1], [0, 1])
}))

// Animate with spring/timing
progress.value = withSpring(1)
```

### Gesture Pattern
```typescript
const gesture = Gesture.Pan()
  .onUpdate((e) => { /* runs on UI thread */ })
  .onEnd((e) => {
    // Call JS functions with runOnJS
    runOnJS(handleComplete)()
  })
```

### State Updates During Animations
When toggling modes or performing actions that trigger both animation AND state updates:
```typescript
// Animate first, update state AFTER animation
morphProgress.value = withSpring(1, config, (finished) => {
  if (finished) {
    runOnJS(setStateValue)(newValue)
  }
})
```
This prevents re-renders during animation from causing visual glitches.

### Context Pattern
```typescript
// Contexts provide global state
const { myTodos, markDone } = useTodos()
const { isFocusMode, setFocusMode } = useFocusMode()
```

## File Conventions

- **Screens**: `app/*.tsx`, `app/(tabs)/*.tsx`
- **Components**: `components/*.tsx`
- **Contexts**: `contexts/*Context.tsx`
- **Types**: `types/index.ts`
- **Utilities**: `lib/*.ts`

## Styling

Uses NativeWind (Tailwind CSS for React Native):
```tsx
<View className="flex-1 bg-cream items-center">
  <Text className="text-coral font-bold">Hello</Text>
</View>
```

Custom colors in `tailwind.config.js`:
- `coral` (#FF6B6B) - Primary/user actions
- `mint` (#4ECDC4) - Secondary/completion
- `cream` (#FFF9F5) - Background
- `charcoal` (#2D2A32) - Text

## Common Tasks

### Adding a New Screen
1. Create file in `app/` directory
2. Export default React component
3. Navigation handled automatically by Expo Router

### Adding a New Component
1. Create in `components/`
2. Use TypeScript interfaces for props
3. Use Reanimated for animations

### Modifying Todo Logic
- State lives in `contexts/TodosContext.tsx`
- Optimistic updates for instant UI
- Background sync to PocketBase

## Important Considerations

### Performance
- Use `useMemo` for derived state (see `myTodos` in TodosContext)
- Use `useCallback` for callbacks passed to children
- Animations run on UI thread via Reanimated worklets

### Gestures
- Multiple gestures use `Gesture.Race()` or `Gesture.Simultaneous()`
- Set `activeOffsetX/Y` to prevent gesture conflicts
- Always reset shared values after gesture ends

### Real-time Updates
- PocketBase subscriptions in TodosContext
- `isReorderingRef` prevents flicker during drag operations
- Subscription cleanup in useEffect return

## Testing Locally

```bash
# Start dev server
npx expo start

# Type check
npx tsc --noEmit

# For dev login, set credentials in .env (not committed)
```

## Common Gotchas

1. **Animation + State**: Don't update React state during Reanimated animations - defer with callback
2. **Gesture Conflicts**: Use `activeOffsetX/Y` and `failOffsetX/Y` to disambiguate
3. **Shared Values**: Read `.value` property, not the SharedValue object
4. **runOnJS**: Required to call JS functions from worklets
5. **Keys**: Always use stable keys (like `todo.id`) for lists

## Architecture Decisions

- **No Redux**: Context API sufficient for this app size
- **File-based routing**: Expo Router for simplicity
- **PocketBase**: Self-hosted, real-time, simple auth
- **Tailwind/NativeWind**: Rapid styling, consistent design
- **Reanimated**: 60fps animations, gesture integration
