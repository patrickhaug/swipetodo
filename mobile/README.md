# SwipeTodo

A collaborative task management app for couples and households. Assign tasks with a swipe, stay in sync with real-time updates.

## Features

- **Swipe to Assign**: Tinder-style card interface for quick task assignment
- **Real-time Sync**: Instant updates across all devices via PocketBase
- **Focus Mode**: Toggle between card stack and list views
- **Drag to Reorder**: Prioritize tasks with drag-and-drop
- **Household Sharing**: Create or join households to collaborate
- **OTP Authentication**: Passwordless email login

## Screenshots

| Pool (Swipe) | My Tasks (Focus) | My Tasks (List) |
|--------------|------------------|-----------------|
| Swipe left/right to assign | Card stack view | Reorderable list |

## Tech Stack

- **Framework**: React Native + Expo SDK 54
- **Navigation**: Expo Router (file-based)
- **Styling**: NativeWind (Tailwind CSS)
- **Animations**: React Native Reanimated
- **Gestures**: React Native Gesture Handler
- **Backend**: PocketBase (self-hosted)
- **State**: React Context API

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- PocketBase server running

### Installation

```bash
# Clone the repository
git clone https://github.com/patrickhaug/swipetodo.git
cd swipetodo

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your PocketBase URL

# Start the development server
npx expo start
```

### Environment Variables

```env
# Required
EXPO_PUBLIC_POCKETBASE_URL=http://localhost:8090

# Optional (for dev quick login)
EXPO_PUBLIC_DEV_USER1_EMAIL=
EXPO_PUBLIC_DEV_USER1_PASSWORD=
EXPO_PUBLIC_DEV_USER2_EMAIL=
EXPO_PUBLIC_DEV_USER2_PASSWORD=
```

### PocketBase Setup

1. Download [PocketBase](https://pocketbase.io/)
2. Run `./pocketbase serve`
3. Create collections:
   - `users` (with OTP auth enabled)
   - `households` (name, invite_code)
   - `todos` (text, due_date, status, assigned_to, household, created_by, sort_order)

## Project Structure

```
app/
├── _layout.tsx          # Root layout with providers
├── login.tsx            # Email login screen
├── verify.tsx           # OTP verification
├── setup.tsx            # Household setup
└── (tabs)/
    ├── _layout.tsx      # Tab navigation
    ├── index.tsx        # Pool (swipe cards)
    ├── create.tsx       # Create todo
    └── mine.tsx         # My tasks (morphing UI)

components/
├── FadeIn.tsx           # Fade animation wrapper
├── SwipeCard.tsx        # Card stack component
├── QuickAdd.tsx         # Quick add modal
└── ReorderableList.tsx  # Drag-to-reorder list

contexts/
├── AuthContext.tsx      # Authentication state
├── TodosContext.tsx     # Todos state & sync
└── FocusModeContext.tsx # View mode toggle

lib/
└── pocketbase.ts        # PocketBase client setup
```

## Development

```bash
# Start Expo dev server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android

# Type check
npx tsc --noEmit
```

## License

MIT
