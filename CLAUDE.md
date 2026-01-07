# CLAUDE.md - AI Assistant Guidelines for SwipeTodo

This document provides context for AI assistants working on this codebase.

## Project Overview

SwipeTodo is a collaborative task management app for couples/households. Users swipe cards to assign tasks, with real-time sync via PocketBase. The project has three main components: a React Native mobile app, a React web frontend, and a PocketBase backend.

## Architecture

```
┌─────────────┐     ┌─────────────┐
│  Mobile App │     │   Web App   │
│ (Expo/RN)   │     │ (React/Vite)│
└──────┬──────┘     └──────┬──────┘
       │                   │
       └─────────┬─────────┘
                 │
         ┌───────▼───────┐
         │  PocketBase   │
         │  (Backend)    │
         └───────────────┘
```

## Directory Structure

| Path | Purpose |
|------|---------|
| `mobile/` | React Native Expo app |
| `mobile/app/` | Screens (Expo Router file-based) |
| `mobile/components/` | Reusable UI components |
| `mobile/contexts/` | React Context providers |
| `frontend/` | React web app (Vite) |
| `frontend/src/` | Web app source |
| `pocketbase/` | PocketBase backend |
| `pocketbase/pb_migrations/` | Database migrations |

## Tech Stack

### Mobile (`mobile/`)

| Technology | Version | Purpose |
|------------|---------|---------|
| Expo | 54 | App framework |
| React Native | 0.81 | Mobile runtime |
| Expo Router | 6 | File-based navigation |
| Reanimated | 4 | 60fps animations |
| Gesture Handler | 2.28 | Touch gestures |
| NativeWind | 4 | Tailwind styling |

### Frontend (`frontend/`)

| Technology | Purpose |
|------------|---------|
| React | UI framework |
| Vite | Build tool |
| TypeScript | Type safety |
| Tailwind CSS | Styling |

### Backend (`pocketbase/`)

| Technology | Purpose |
|------------|---------|
| PocketBase | Database, auth, real-time |
| SQLite | Data storage |

## Key Patterns

### Animation Pattern (Mobile - Reanimated)

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

### Gesture Pattern (Mobile)

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
const { user, logout } = useAuth()
```

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

### Adding a New Screen (Mobile)

1. Create file in `mobile/app/` directory
2. Export default React component
3. Navigation handled automatically by Expo Router

### Adding a New Component (Mobile)

1. Create in `mobile/components/`
2. Use TypeScript interfaces for props
3. Use Reanimated for animations

### Modifying Todo Logic

- State lives in `mobile/contexts/TodosContext.tsx`
- Optimistic updates for instant UI
- Background sync to PocketBase

## Important Considerations

### Performance (Mobile)

- Use `useMemo` for derived state
- Use `useCallback` for callbacks passed to children
- Animations run on UI thread via Reanimated worklets

### Gestures (Mobile)

- Multiple gestures use `Gesture.Race()` or `Gesture.Simultaneous()`
- Set `activeOffsetX/Y` to prevent gesture conflicts
- Always reset shared values after gesture ends

### Real-time Updates

- PocketBase subscriptions in TodosContext
- `isReorderingRef` prevents flicker during drag
- Cleanup subscriptions in useEffect return

## Common Commands

```bash
# Mobile
cd mobile
npx expo start          # Start dev server
npx tsc --noEmit        # Type check

# Frontend
cd frontend
npm run dev             # Start dev server
npm run build           # Production build

# PocketBase
cd pocketbase
./pocketbase serve      # Start server
./setup_schema.sh       # Setup collections
```

## Common Gotchas

1. **Animation + State**: Don't update React state during Reanimated animations - defer with callback
2. **Gesture Conflicts**: Use `activeOffsetX/Y` and `failOffsetX/Y` to disambiguate
3. **Shared Values**: Read `.value` property, not the SharedValue object
4. **runOnJS**: Required to call JS functions from worklets
5. **Keys**: Always use stable keys (like `todo.id`) for lists
6. **PocketBase Auth**: Token stored in SecureStore (mobile) or localStorage (web)

## Styling

### Mobile (NativeWind/Tailwind)

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
