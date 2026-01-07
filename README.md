# SwipeTodo

A collaborative task management app for couples and households. Assign tasks with a swipe, stay in sync with real-time updates.

## Features

- **Swipe to Assign**: Tinder-style card interface for quick task assignment
- **Real-time Sync**: Instant updates across all devices via PocketBase
- **Focus Mode**: Toggle between card stack and list views
- **Drag to Reorder**: Prioritize tasks with drag-and-drop
- **Household Sharing**: Create or join households to collaborate
- **OTP Authentication**: Passwordless email login

## Project Structure

```
swipetodo/
├── mobile/           # React Native Expo app (iOS/Android)
├── frontend/         # Web app (React + Vite)
├── pocketbase/       # Backend (PocketBase)
└── docs/             # Documentation
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Mobile | React Native, Expo SDK 54, Reanimated, Gesture Handler |
| Web | React, Vite, TypeScript, Tailwind CSS |
| Backend | PocketBase (SQLite, real-time subscriptions) |
| Auth | OTP/Magic Links via email |

## Quick Start

### Prerequisites

- Node.js 18+
- PocketBase (included in `pocketbase/`)

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

### 4. Run Web App

```bash
cd frontend
npm install
cp .env.example .env  # Edit with your PocketBase URL
npm run dev
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

### Frontend (`frontend/.env`)

```env
VITE_PB_URL=http://localhost:8090
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for Coolify/Hetzner deployment instructions.

## Development

```bash
# Mobile - start Expo dev server
cd mobile && npx expo start

# Mobile - type check
cd mobile && npx tsc --noEmit

# Frontend - start Vite dev server
cd frontend && npm run dev

# Frontend - build for production
cd frontend && npm run build
```

## License

MIT
