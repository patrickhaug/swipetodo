# SwipeTodo

A collaborative task management app for couples and households. Assign tasks with a swipe, stay in sync with real-time updates.

## Features

- **Swipe to Assign**: Tinder-style card interface for quick task assignment
- **Real-time Sync**: Instant updates across all devices via PocketBase
- **Focus Mode**: Toggle between card stack and list views
- **Drag to Reorder**: Prioritize tasks with drag-and-drop
- **Household Sharing**: Create or join households to collaborate
- **OTP Authentication**: Passwordless email login

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Expo | 54 | App framework |
| React Native | 0.81 | Mobile runtime |
| Expo Router | 6 | File-based navigation |
| Reanimated | 4 | 60fps animations |
| Gesture Handler | 2.28 | Touch gestures |
| NativeWind | 4 | Tailwind styling |
| PocketBase | 0.26 | Backend/real-time |

## Project Structure

```
swipetodo/
├── mobile/           # React Native Expo app
│   ├── app/          # Screens (Expo Router)
│   ├── components/   # Reusable UI components
│   ├── contexts/     # React Context providers
│   └── lib/          # Utilities
├── pocketbase/       # Backend
└── docs/             # Documentation
```

## Quick Start

### Prerequisites

- Node.js 18+
- iOS Simulator / Android Emulator or Expo Go app

### 1. Start PocketBase

```bash
cd pocketbase
./pocketbase serve
```

First run: Create admin account at http://localhost:8090/_/

### 2. Setup Schema

```bash
cd pocketbase
./setup_schema.sh admin@swipetodo.local yourpassword
```

### 3. Run Mobile App

```bash
cd mobile
npm install
cp .env.example .env  # Edit with your PocketBase URL
npx expo start
```

## Environment Variables

### Mobile (`mobile/.env`)

```env
EXPO_PUBLIC_POCKETBASE_URL=http://localhost:8090

# Dev quick login (optional)
EXPO_PUBLIC_DEV_USER1_EMAIL=
EXPO_PUBLIC_DEV_USER1_PASSWORD=
EXPO_PUBLIC_DEV_USER2_EMAIL=
EXPO_PUBLIC_DEV_USER2_PASSWORD=
```

## Development

```bash
# Start Expo dev server
cd mobile && npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android

# Type check
npx tsc --noEmit

# Run tests
npm test
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment instructions.

## License

MIT
