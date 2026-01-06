# SwipeTodo Expo Migration Plan

> **Rollback:** If migration fails, run `git checkout v1.0.0-web` to restore web version

## Overview

Migrate React/Vite web app to Expo (React Native) for native iOS/Android experience.

## Tech Stack Mapping

| Web | Expo/React Native |
|-----|-------------------|
| Vite | Expo (Metro) |
| React Router | Expo Router |
| Framer Motion | Moti + Reanimated |
| Tailwind CSS | NativeWind |
| HTML elements | RN components |
| PocketBase SDK | PocketBase SDK (same) |

## Project Structure

```
/app                    # Expo Router pages
  /(tabs)/              # Tab navigator
    _layout.tsx         # Tab layout with bottom nav
    index.tsx           # Pool screen
    mine.tsx            # Mine screen
  /login.tsx            # Login screen
  /verify.tsx           # OTP verification
  /setup.tsx            # Household setup
  /join/[code].tsx      # Join household
  _layout.tsx           # Root layout
/components
  SwipeCard.tsx         # Gesture Handler + Reanimated
  TodoItem.tsx          # List item with swipe actions
  QuickAdd.tsx          # Bottom sheet modal
  BottomNav.tsx         # Custom tab bar
/contexts
  AuthContext.tsx       # Same logic, minor adjustments
  TodosContext.tsx      # Same logic
/lib
  pocketbase.ts         # Same
/types
  index.ts              # Same
```

---

## Phase 1: Project Setup

### Task 1.1: Create Expo project
```bash
cd /Users/patrick.haug/check
npx create-expo-app@latest mobile --template tabs
cd mobile
```

### Task 1.2: Install dependencies
```bash
npx expo install react-native-reanimated react-native-gesture-handler
npx expo install moti
npm install nativewind tailwindcss
npm install pocketbase
npm install expo-haptics expo-secure-store
```

### Task 1.3: Configure NativeWind
- Create `tailwind.config.js`
- Update `babel.config.js` for NativeWind
- Add preset to `metro.config.js`

### Task 1.4: Configure Reanimated
- Add plugin to `babel.config.js`

---

## Phase 2: Core Infrastructure

### Task 2.1: PocketBase client
- Copy `/lib/pocketbase.ts`
- Replace localStorage with expo-secure-store for auth persistence

### Task 2.2: Types
- Copy `/types/index.ts` (no changes needed)

### Task 2.3: Auth Context
- Copy `/contexts/AuthContext.tsx`
- Replace `localStorage` with `SecureStore`
- Update imports for RN

### Task 2.4: Todos Context
- Copy `/contexts/TodosContext.tsx`
- No major changes needed

---

## Phase 3: Navigation & Layout

### Task 3.1: Root layout (`app/_layout.tsx`)
- Setup providers (Auth, Todos)
- Configure Gesture Handler root
- Setup navigation theme

### Task 3.2: Auth flow
- Redirect to login if not authenticated
- Redirect to setup if no household

### Task 3.3: Tab layout (`app/(tabs)/_layout.tsx`)
- Custom tab bar matching web design
- Floating + button in center

---

## Phase 4: Screens

### Task 4.1: Login screen
- Convert HTML to View/Text/TextInput
- Style with NativeWind
- OTP input handling

### Task 4.2: Verify screen
- OTP code input
- Auto-submit on complete

### Task 4.3: Setup screen
- Create/Join household options

### Task 4.4: Join screen
- Deep link handling for invite codes

---

## Phase 5: Swipe Card (Critical)

### Task 5.1: Create SwipeCard component
```tsx
// Use react-native-gesture-handler for pan gestures
// Use react-native-reanimated for animations
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS
} from 'react-native-reanimated'
```

### Task 5.2: Implement gestures
- Pan gesture for drag
- Rotation based on x offset
- Swipe thresholds (left/right/up/down)
- Exit animations
- Haptic feedback on swipe

### Task 5.3: SwipeStack component
- Render stacked cards
- Handle card removal on swipe
- Direction labels (Ich/Partner or Erledigt/Zurück)

---

## Phase 6: Pool Screen

### Task 6.1: Pool screen (`app/(tabs)/index.tsx`)
- Empty state (just icon)
- SwipeStack for cards
- Swipe left = assign to me
- Swipe right = assign to partner

---

## Phase 7: Mine Screen

### Task 7.1: TodoItem component
- Swipeable list item using Gesture Handler
- Swipe right = done (green)
- Swipe left = return to pool (red)
- Reorderable with drag

### Task 7.2: Mine screen (`app/(tabs)/mine.tsx`)
- Reorderable list using `react-native-reanimated`
- Or use `react-native-draggable-flatlist`
- Empty state (celebration icon)

---

## Phase 8: QuickAdd Modal

### Task 8.1: Bottom sheet modal
- Use `@gorhom/bottom-sheet` or custom
- Text input + date picker button + submit
- Auto-assign when on Mine tab

---

## Phase 9: Polish

### Task 9.1: Haptics
- Add haptic feedback on swipes
- Vibrate on card assignment

### Task 9.2: Animations
- Page transitions
- List item animations
- Loading states

### Task 9.3: Error handling
- Network error states
- Retry mechanisms

---

## Phase 10: Testing & Build

### Task 10.1: Test on iOS simulator
```bash
npx expo run:ios
```

### Task 10.2: Test on Android emulator
```bash
npx expo run:android
```

### Task 10.3: Create development build
```bash
npx expo prebuild
```

---

## Risk Mitigation

1. **Gesture conflicts**: Test swipe card vs page swipe early
2. **Performance**: Use `useMemo` and `useCallback` for list items
3. **PocketBase realtime**: Test WebSocket works in RN
4. **Deep links**: Test join invite flow

## Rollback

If migration fails:
```bash
git checkout v1.0.0-web
cd frontend
npm install
npm run dev
```

Web app will be fully functional at the tagged version.
