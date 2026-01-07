# CLAUDE.md - AI Assistant Guidelines for SwipeTodo

This document provides context for AI assistants working on this codebase.

## Project Overview

SwipeTodo is a React Native Expo app for collaborative task management. Users swipe cards to assign tasks, with real-time sync via PocketBase.

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Expo | 54 | App framework |
| React Native | 0.81 | Mobile runtime |
| Expo Router | 6 | File-based navigation |
| Reanimated | 4 | Animations |
| Gesture Handler | 2.28 | Touch gestures |
| NativeWind | 4 | Tailwind styling |
| PocketBase | 0.26 | Backend/realtime |

## Directory Structure

| Path | Purpose |
|------|---------|
| `mobile/` | React Native Expo app |
| `mobile/app/` | Screens (Expo Router file-based) |
| `mobile/components/` | Reusable UI components |
| `mobile/contexts/` | React Context providers |
| `mobile/lib/` | Utilities |
| `pocketbase/` | PocketBase backend |
| `pocketbase/pb_migrations/` | Database migrations |

## Key Patterns

### Animation Pattern (Reanimated)

```typescript
// Shared values for animations
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
  .onUpdate((e) => { /* UI thread */ })
  .onEnd((e) => {
    runOnJS(handleComplete)()  // Call JS from worklet
  })
```

### State Updates During Animations

When toggling modes that trigger both animation AND state updates:

```typescript
// Animate first, update state AFTER animation completes
morphProgress.value = withSpring(1, config, (finished) => {
  if (finished) {
    runOnJS(setStateValue)(newValue)
  }
})
```

This prevents re-renders during animation from causing visual glitches.

### Context Pattern

```typescript
const { myTodos, markDone } = useTodos()
const { user, partner, switchUser, logout } = useAuth()
```

### Authentication Flow

The app uses a simplified household-based authentication:

1. **Initial Setup**: Enter household name and both users' email addresses
2. **Auto-Login**: Device remembers the current user via SecureStore
3. **User Switching**: Switch between household members in Settings (no re-auth needed)

```typescript
// AuthContext provides:
const {
  user,           // Current authenticated user
  partner,        // Other user in household
  household,      // Current household
  authState,      // 'loading' | 'no_household' | 'select_user' | 'authenticated'
  setupHousehold, // Create new household with both users
  joinHousehold,  // Join existing household via invite code
  selectUser,     // Select which user to log in as
  switchUser,     // Switch to the other household member
  logout,         // Clear all auth state
} = useAuth()
```

Auth flow states:
- `loading`: Checking stored auth config
- `no_household`: No household configured - show setup screen
- `select_user`: Household exists but user not selected
- `authenticated`: User is logged in with valid household

## PocketBase Collections

### `users` (auth collection)
- `email`, `password` (system)
- `name`, `display_name`
- `household` → relation to households
- `avatar` (file)

### `households`
- `name`
- `invite_code` (6 chars, unique)
- `created_by` → relation to users

### `todos`
- `text`
- `status`: "pool" | "assigned" | "done"
- `household` → relation to households
- `assigned_to` → relation to users
- `created_by` → relation to users
- `sort_order` (number)
- `due_date` (optional)

## Common Tasks

### Adding a New Screen

1. Create file in `mobile/app/` directory
2. Export default React component
3. Navigation handled automatically by Expo Router

### Adding a New Component

1. Create in `mobile/components/`
2. Use TypeScript interfaces for props
3. Use Reanimated for animations

### Modifying Todo Logic

- State lives in `mobile/contexts/TodosContext.tsx`
- Optimistic updates for instant UI
- Background sync to PocketBase

## Important Considerations

### Performance

- Use `useMemo` for derived state
- Use `useCallback` for callbacks passed to children
- Animations run on UI thread via Reanimated worklets

### Gestures

- Multiple gestures use `Gesture.Race()` or `Gesture.Simultaneous()`
- Set `activeOffsetX/Y` to prevent gesture conflicts
- Always reset shared values after gesture ends

### Real-time Updates

- PocketBase subscriptions in TodosContext
- `isReorderingRef` prevents flicker during drag
- Cleanup subscriptions in useEffect return

## Common Commands

```bash
cd mobile

# Start dev server
npx expo start

# Type check
npx tsc --noEmit

# Run tests
npm test

# Lint
npm run lint
```

## Common Gotchas

1. **Animation + State**: Don't update React state during Reanimated animations - defer with callback
2. **Gesture Conflicts**: Use `activeOffsetX/Y` and `failOffsetX/Y` to disambiguate
3. **Shared Values**: Read `.value` property, not the SharedValue object
4. **runOnJS**: Required to call JS functions from worklets
5. **Keys**: Always use stable keys (like `todo.id`) for lists
6. **PocketBase Auth**: Token stored in SecureStore

## Styling

### NativeWind/Tailwind

```tsx
<View className="flex-1 bg-cream items-center">
  <Text className="text-coral font-bold">Hello</Text>
</View>
```

### Custom Colors

- `coral` (#FF6B6B) - Primary/user actions
- `mint` (#4ECDC4) - Secondary/completion
- `cream` (#FFF9F5) - Background
- `charcoal` (#2D2A32) - Text
