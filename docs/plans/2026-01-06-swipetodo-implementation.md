# SwipeTodo Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a swipe-based todo app for couples with realtime sync using PocketBase and React.

**Architecture:** React SPA connects to PocketBase for auth, data, and realtime subscriptions. Two Coolify services on Hetzner. Magic Link auth via Resend.

**Tech Stack:** React 18, React Router 6, Vite, Tailwind, shadcn/ui, @use-gesture/react, react-spring, PocketBase, Vitest, React Testing Library

**Approach:** TDD (Test-Driven Development) – Write failing tests first, then implement.

**Local Dev:** Frontend via `npm run dev`, PocketBase via Docker or local binary.

---

## Phase 0: Local Dev Environment

### Task 0.1: Download PocketBase for Local Development

**Step 1: Create project directory**

```bash
mkdir -p swipetodo/pocketbase
cd swipetodo
```

**Step 2: Download PocketBase binary**

```bash
# macOS ARM
curl -L https://github.com/pocketbase/pocketbase/releases/download/v0.25.1/pocketbase_0.25.1_darwin_arm64.zip -o pocketbase.zip
unzip pocketbase.zip -d pocketbase/
rm pocketbase.zip
```

**Step 3: Create start script**

Create `pocketbase/start.sh`:
```bash
#!/bin/bash
./pocketbase serve --http=127.0.0.1:8090
```

```bash
chmod +x pocketbase/start.sh
```

**Step 4: Add to .gitignore**

```bash
echo "pocketbase/pocketbase" >> .gitignore
echo "pocketbase/pb_data" >> .gitignore
```

**Step 5: Start PocketBase**

```bash
cd pocketbase && ./start.sh
```

Expected: PocketBase running at http://localhost:8090/_/

**Step 6: Commit**

```bash
git init
git add .
git commit -m "chore: add PocketBase local dev setup"
```

---

## Phase 1: Project Setup with Testing

### Task 1.1: Initialize Frontend with Vite + Testing

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/vitest.config.ts`
- Create: `frontend/src/test/setup.ts`

**Step 1: Create frontend directory and initialize**

```bash
mkdir frontend
cd frontend
npm create vite@latest . -- --template react-ts
```

**Step 2: Install core dependencies**

```bash
npm install react-router-dom pocketbase @use-gesture/react @react-spring/web
```

**Step 3: Install testing dependencies**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @types/node
```

**Step 4: Install styling dependencies**

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Step 5: Create vitest.config.ts**

In `frontend/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Step 6: Create test setup**

In `frontend/src/test/setup.ts`:
```typescript
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
```

**Step 7: Update package.json scripts**

Add to `frontend/package.json` scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui"
  }
}
```

**Step 8: Configure Tailwind**

In `frontend/tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

In `frontend/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 9: Update vite.config.ts**

In `frontend/vite.config.ts`:
```typescript
import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

**Step 10: Create .env for local dev**

In `frontend/.env`:
```
VITE_PB_URL=http://localhost:8090
```

**Step 11: Run first test to verify setup**

Create `frontend/src/App.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(document.body).toBeInTheDocument()
  })
})
```

Run: `npm test`
Expected: Test passes

**Step 12: Commit**

```bash
git add .
git commit -m "chore: initial frontend setup with Vite, Tailwind, Vitest"
```

---

### Task 1.2: Setup shadcn/ui

**Step 1: Install shadcn dependencies**

```bash
cd frontend
npm install class-variance-authority clsx tailwind-merge lucide-react
```

**Step 2: Update tsconfig.json paths**

In `frontend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Step 3: Create utils.ts**

In `frontend/src/lib/utils.ts`:
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Step 4: Initialize shadcn**

```bash
npx shadcn@latest init
```

Select: Default style, Slate color, CSS variables: yes

**Step 5: Add components**

```bash
npx shadcn@latest add button input card dialog
npx shadcn@latest add sonner
```

**Step 6: Write test for Button component**

Create `frontend/src/components/ui/button.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('applies variant classes', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-destructive')
  })

  it('can be disabled', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

Run: `npm test`
Expected: All tests pass

**Step 7: Verify dev server works**

```bash
npm run dev
```

Expected: App runs at http://localhost:5173

**Step 8: Commit**

```bash
git add .
git commit -m "chore: add shadcn/ui with button, input, card, dialog"
```

---

## Phase 2: PocketBase Schema

### Task 2.1: Configure PocketBase Collections

**Step 1: Start PocketBase**

```bash
cd pocketbase && ./start.sh
```

**Step 2: Create admin account**

Open http://localhost:8090/_/ and create admin account.

**Step 3: Create households collection**

In PocketBase Admin UI:
- New Collection: `households`
- Type: Base
- Fields:
  - `name` (text, required, min: 1)
  - `invite_code` (text, required, unique, min: 6, max: 6)
  - `created_by` (relation → users, required)

**Step 4: Extend users collection**

In PocketBase Admin UI, edit `users`:
- Add field: `household` (relation → households, optional)
- Add field: `display_name` (text, optional)

**Step 5: Create todos collection**

In PocketBase Admin UI:
- New Collection: `todos`
- Type: Base
- Fields:
  - `text` (text, required, min: 1)
  - `due_date` (date, optional)
  - `status` (select: pool, assigned, done; default: pool)
  - `household` (relation → households, required)
  - `assigned_to` (relation → users, optional)
  - `created_by` (relation → users, required)

**Step 6: Set API Rules for todos**

List/View Rule:
```
@request.auth.id != "" && @request.auth.household = household
```

Create Rule:
```
@request.auth.id != "" && @request.auth.household = @request.data.household
```

Update Rule:
```
@request.auth.id != "" && @request.auth.household = household
```

Delete Rule:
```
@request.auth.id != "" && @request.auth.household = household
```

**Step 7: Set API Rules for households**

List/View Rule:
```
@request.auth.id != "" && (@request.auth.household = id || created_by = @request.auth.id || invite_code = @request.query.invite_code)
```

Create Rule:
```
@request.auth.id != ""
```

**Step 8: Export schema**

In PocketBase Admin → Settings → Export collections

Save to `pocketbase/pb_schema.json`

**Step 9: Commit**

```bash
git add .
git commit -m "feat: add PocketBase schema for households, todos"
```

---

## Phase 3: Types and PocketBase Client

### Task 3.1: Create Types

**Files:**
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/types/index.test.ts`

**Step 1: Write type tests**

In `frontend/src/types/index.test.ts`:
```typescript
import { describe, it, expectTypeOf } from 'vitest'
import type { Todo, Household, User } from './index'

describe('Types', () => {
  it('Todo has correct shape', () => {
    expectTypeOf<Todo>().toMatchTypeOf<{
      id: string
      text: string
      status: 'pool' | 'assigned' | 'done'
      household: string
    }>()
  })

  it('Todo status is union type', () => {
    const status: Todo['status'] = 'pool'
    expectTypeOf(status).toEqualTypeOf<'pool' | 'assigned' | 'done'>()
  })
})
```

Run: `npm test`
Expected: FAIL (types don't exist)

**Step 2: Create types**

In `frontend/src/types/index.ts`:
```typescript
export interface Todo {
  id: string
  text: string
  due_date: string | null
  status: 'pool' | 'assigned' | 'done'
  household: string
  assigned_to: string | null
  created_by: string
  created: string
  updated: string
}

export interface Household {
  id: string
  name: string
  invite_code: string
  created_by: string
  created: string
  updated: string
}

export interface User {
  id: string
  email: string
  display_name: string | null
  household: string | null
  created: string
  updated: string
}
```

Run: `npm test`
Expected: PASS

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add TypeScript types for Todo, Household, User"
```

---

### Task 3.2: PocketBase Client

**Files:**
- Create: `frontend/src/lib/pocketbase.ts`
- Create: `frontend/src/lib/pocketbase.test.ts`

**Step 1: Write test for PocketBase client**

In `frontend/src/lib/pocketbase.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock environment variable
vi.stubEnv('VITE_PB_URL', 'http://test:8090')

describe('PocketBase Client', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('creates client with env URL', async () => {
    const { pb } = await import('./pocketbase')
    expect(pb.baseUrl).toBe('http://test:8090')
  })

  it('exports pb instance', async () => {
    const { pb } = await import('./pocketbase')
    expect(pb).toBeDefined()
    expect(pb.collection).toBeDefined()
  })
})
```

Run: `npm test`
Expected: FAIL

**Step 2: Create PocketBase client**

In `frontend/src/lib/pocketbase.ts`:
```typescript
import PocketBase from 'pocketbase'

export const pb = new PocketBase(import.meta.env.VITE_PB_URL || 'http://localhost:8090')
```

Run: `npm test`
Expected: PASS

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add PocketBase client"
```

---

## Phase 4: Auth Context (TDD)

### Task 4.1: AuthContext

**Files:**
- Create: `frontend/src/contexts/AuthContext.tsx`
- Create: `frontend/src/contexts/AuthContext.test.tsx`

**Step 1: Write AuthContext tests**

In `frontend/src/contexts/AuthContext.test.tsx`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './AuthContext'

// Mock PocketBase
vi.mock('@/lib/pocketbase', () => ({
  pb: {
    authStore: {
      model: null,
      onChange: vi.fn((callback) => {
        return () => {} // unsubscribe
      }),
      clear: vi.fn(),
    },
    collection: vi.fn(() => ({
      requestOTP: vi.fn().mockResolvedValue({ otpId: 'test-otp-id' }),
      authWithOTP: vi.fn().mockResolvedValue({ record: { id: 'user-1' } }),
    })),
  },
}))

function TestComponent() {
  const { user, isLoading } = useAuth()
  return (
    <div>
      <span data-testid="loading">{isLoading ? 'loading' : 'ready'}</span>
      <span data-testid="user">{user ? user.id : 'no-user'}</span>
    </div>
  )
}

describe('AuthContext', () => {
  it('provides initial loading state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
  })

  it('throws when useAuth is used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestComponent />)).toThrow('useAuth must be used within AuthProvider')
    consoleSpy.mockRestore()
  })
})
```

Run: `npm test`
Expected: FAIL

**Step 2: Implement AuthContext**

In `frontend/src/contexts/AuthContext.tsx`:
```typescript
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { pb } from '@/lib/pocketbase'
import { AuthModel } from 'pocketbase'

interface AuthContextType {
  user: AuthModel | null
  isLoading: boolean
  requestOTP: (email: string) => Promise<{ otpId: string }>
  verifyOTP: (otpId: string, code: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthModel | null>(pb.authStore.model)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(false)

    const unsubscribe = pb.authStore.onChange((_, model) => {
      setUser(model)
    })

    return () => unsubscribe()
  }, [])

  const requestOTP = async (email: string) => {
    return await pb.collection('users').requestOTP(email)
  }

  const verifyOTP = async (otpId: string, code: string) => {
    await pb.collection('users').authWithOTP(otpId, code)
  }

  const logout = () => {
    pb.authStore.clear()
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, requestOTP, verifyOTP, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

Run: `npm test`
Expected: PASS

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add AuthContext with OTP auth"
```

---

### Task 4.2: Login Page (TDD)

**Files:**
- Create: `frontend/src/pages/Login.tsx`
- Create: `frontend/src/pages/Login.test.tsx`

**Step 1: Write Login tests**

In `frontend/src/pages/Login.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { Login } from './Login'

const mockRequestOTP = vi.fn()
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/lib/pocketbase', () => ({
  pb: {
    collection: () => ({
      requestOTP: mockRequestOTP,
    }),
  },
}))

describe('Login', () => {
  it('renders email input and submit button', () => {
    render(<Login />, { wrapper: BrowserRouter })

    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /code senden/i })).toBeInTheDocument()
  })

  it('submits email and navigates to verify', async () => {
    mockRequestOTP.mockResolvedValueOnce({ otpId: 'test-otp' })
    const user = userEvent.setup()

    render(<Login />, { wrapper: BrowserRouter })

    await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com')
    await user.click(screen.getByRole('button', { name: /code senden/i }))

    expect(mockRequestOTP).toHaveBeenCalledWith('test@example.com')
  })

  it('shows error on failed request', async () => {
    mockRequestOTP.mockRejectedValueOnce(new Error('Failed'))
    const user = userEvent.setup()

    render(<Login />, { wrapper: BrowserRouter })

    await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com')
    await user.click(screen.getByRole('button', { name: /code senden/i }))

    expect(await screen.findByText(/fehler/i)).toBeInTheDocument()
  })
})
```

Run: `npm test`
Expected: FAIL

**Step 2: Implement Login page**

In `frontend/src/pages/Login.tsx`:
```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { pb } from '@/lib/pocketbase'

export function Login() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await pb.collection('users').requestOTP(email)
      navigate('/verify', { state: { otpId: result.otpId, email } })
    } catch (err) {
      setError('Fehler beim Senden des Codes')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>SwipeTodo</CardTitle>
          <CardDescription>Melde dich mit deiner E-Mail an</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="deine@email.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sende...' : 'Code senden'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

Run: `npm test`
Expected: PASS

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add Login page with OTP request"
```

---

### Task 4.3: Verify Page (TDD)

**Files:**
- Create: `frontend/src/pages/Verify.tsx`
- Create: `frontend/src/pages/Verify.test.tsx`

**Step 1: Write Verify tests**

In `frontend/src/pages/Verify.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { Verify } from './Verify'

const mockAuthWithOTP = vi.fn()

vi.mock('@/lib/pocketbase', () => ({
  pb: {
    collection: () => ({
      authWithOTP: mockAuthWithOTP,
    }),
    authStore: {
      model: { household: null },
    },
  },
}))

describe('Verify', () => {
  it('renders code input', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/verify', state: { otpId: 'test', email: 'test@test.com' } }]}>
        <Routes>
          <Route path="/verify" element={<Verify />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByPlaceholderText(/123456/i)).toBeInTheDocument()
  })

  it('redirects to login if no otpId', () => {
    render(
      <MemoryRouter initialEntries={['/verify']}>
        <Routes>
          <Route path="/verify" element={<Verify />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })
})
```

Run: `npm test`
Expected: FAIL

**Step 2: Implement Verify page**

In `frontend/src/pages/Verify.tsx`:
```typescript
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { pb } from '@/lib/pocketbase'

export function Verify() {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const { otpId, email } = (location.state as { otpId?: string; email?: string }) || {}

  if (!otpId) {
    navigate('/login')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await pb.collection('users').authWithOTP(otpId, code)

      const pendingInvite = localStorage.getItem('pendingInviteCode')
      if (pendingInvite) {
        navigate('/join/' + pendingInvite)
      } else if (!pb.authStore.model?.household) {
        navigate('/setup')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError('Ungültiger Code')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Code eingeben</CardTitle>
          <CardDescription>
            Wir haben einen Code an {email} gesendet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              required
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Prüfe...' : 'Bestätigen'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

Run: `npm test`
Expected: PASS

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add Verify page with OTP validation"
```

---

### Task 4.4: Setup & Join Pages (TDD)

**Files:**
- Create: `frontend/src/pages/Setup.tsx`
- Create: `frontend/src/pages/Setup.test.tsx`
- Create: `frontend/src/pages/Join.tsx`
- Create: `frontend/src/pages/Join.test.tsx`

**Step 1: Write Setup tests**

In `frontend/src/pages/Setup.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { Setup } from './Setup'

vi.mock('@/lib/pocketbase', () => ({
  pb: {
    collection: () => ({
      create: vi.fn().mockResolvedValue({ id: 'household-1' }),
      update: vi.fn().mockResolvedValue({}),
      authRefresh: vi.fn().mockResolvedValue({}),
    }),
    authStore: {
      model: { id: 'user-1' },
    },
  },
}))

describe('Setup', () => {
  it('renders household name input', () => {
    render(<Setup />, { wrapper: BrowserRouter })
    expect(screen.getByPlaceholderText(/haushaltsname/i)).toBeInTheDocument()
  })

  it('renders create button', () => {
    render(<Setup />, { wrapper: BrowserRouter })
    expect(screen.getByRole('button', { name: /haushalt erstellen/i })).toBeInTheDocument()
  })
})
```

Run: `npm test`
Expected: FAIL

**Step 2: Implement Setup page**

In `frontend/src/pages/Setup.tsx`:
```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { pb } from '@/lib/pocketbase'

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function Setup() {
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const household = await pb.collection('households').create({
        name,
        invite_code: generateInviteCode(),
        created_by: pb.authStore.model?.id,
      })

      await pb.collection('users').update(pb.authStore.model!.id, {
        household: household.id,
      })

      await pb.collection('users').authRefresh()
      navigate('/')
    } catch (err) {
      setError('Fehler beim Erstellen')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Willkommen bei SwipeTodo</CardTitle>
          <CardDescription>Erstelle deinen Haushalt</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              type="text"
              placeholder="Haushaltsname (z.B. Zuhause)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Erstelle...' : 'Haushalt erstellen'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

Run: `npm test`
Expected: PASS

**Step 3: Write Join tests**

In `frontend/src/pages/Join.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { Join } from './Join'

vi.mock('@/lib/pocketbase', () => ({
  pb: {
    collection: () => ({
      getList: vi.fn().mockResolvedValue({ items: [{ id: 'household-1' }] }),
      update: vi.fn().mockResolvedValue({}),
      authRefresh: vi.fn().mockResolvedValue({}),
    }),
    authStore: {
      model: { id: 'user-1', household: null },
      onChange: vi.fn(() => () => {}),
    },
  },
}))

describe('Join', () => {
  it('shows loading state', () => {
    render(
      <MemoryRouter initialEntries={['/join/ABC123']}>
        <AuthProvider>
          <Routes>
            <Route path="/join/:code" element={<Join />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    )
    expect(screen.getByText(/trete bei/i)).toBeInTheDocument()
  })
})
```

Run: `npm test`
Expected: FAIL

**Step 4: Implement Join page**

In `frontend/src/pages/Join.tsx`:
```typescript
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { pb } from '@/lib/pocketbase'
import { useAuth } from '@/contexts/AuthContext'

export function Join() {
  const { code } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      localStorage.setItem('pendingInviteCode', code || '')
      navigate('/login')
      return
    }

    joinHousehold()
  }, [user, code])

  const joinHousehold = async () => {
    try {
      const households = await pb.collection('households').getList(1, 1, {
        filter: `invite_code = "${code}"`,
      })

      if (households.items.length === 0) {
        setError('Ungültiger Einladungscode')
        setStatus('error')
        return
      }

      const household = households.items[0]

      await pb.collection('users').update(pb.authStore.model!.id, {
        household: household.id,
      })

      localStorage.removeItem('pendingInviteCode')
      await pb.collection('users').authRefresh()

      setStatus('success')
      setTimeout(() => navigate('/'), 1500)
    } catch (err) {
      setError('Fehler beim Beitreten')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {status === 'loading' && 'Trete bei...'}
            {status === 'success' && 'Willkommen!'}
            {status === 'error' && 'Fehler'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Einen Moment...'}
            {status === 'success' && 'Du bist jetzt Mitglied des Haushalts'}
            {status === 'error' && error}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
```

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add Setup and Join pages for household management"
```

---

## Phase 5: TodosContext (TDD)

### Task 5.1: TodosContext

**Files:**
- Create: `frontend/src/contexts/TodosContext.tsx`
- Create: `frontend/src/contexts/TodosContext.test.tsx`

**Step 1: Write TodosContext tests**

In `frontend/src/contexts/TodosContext.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { TodosProvider, useTodos } from './TodosContext'
import { AuthProvider } from './AuthContext'

vi.mock('@/lib/pocketbase', () => ({
  pb: {
    collection: () => ({
      getFullList: vi.fn().mockResolvedValue([
        { id: '1', text: 'Test Todo', status: 'pool', household: 'h1' },
      ]),
      subscribe: vi.fn().mockResolvedValue(() => {}),
      create: vi.fn().mockResolvedValue({ id: '2' }),
      update: vi.fn().mockResolvedValue({}),
    }),
    authStore: {
      model: { id: 'user-1', household: 'h1' },
      onChange: vi.fn(() => () => {}),
    },
  },
}))

function TestComponent() {
  const { poolTodos, isLoading } = useTodos()
  return (
    <div>
      <span data-testid="loading">{isLoading ? 'loading' : 'ready'}</span>
      <span data-testid="count">{poolTodos.length}</span>
    </div>
  )
}

describe('TodosContext', () => {
  it('provides todos state', async () => {
    render(
      <AuthProvider>
        <TodosProvider>
          <TestComponent />
        </TodosProvider>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('1')
    })
  })

  it('throws when useTodos is used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestComponent />)).toThrow('useTodos must be used within TodosProvider')
    consoleSpy.mockRestore()
  })
})
```

Run: `npm test`
Expected: FAIL

**Step 2: Implement TodosContext**

In `frontend/src/contexts/TodosContext.tsx`:
```typescript
import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react'
import { pb } from '@/lib/pocketbase'
import { useAuth } from './AuthContext'
import { Todo } from '@/types'

interface TodosContextType {
  todos: Todo[]
  poolTodos: Todo[]
  myTodos: Todo[]
  isLoading: boolean
  isConnected: boolean
  createTodo: (text: string, dueDate?: string) => Promise<void>
  assignTo: (todoId: string, userId: string) => Promise<void>
  markDone: (todoId: string) => Promise<void>
  returnToPool: (todoId: string) => Promise<void>
}

const TodosContext = createContext<TodosContextType | null>(null)

export function TodosProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [todos, setTodos] = useState<Todo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)

  const poolTodos = useMemo(
    () => todos.filter(t => t.status === 'pool'),
    [todos]
  )

  const myTodos = useMemo(
    () => todos.filter(t => t.status === 'assigned' && t.assigned_to === user?.id),
    [todos, user]
  )

  useEffect(() => {
    if (!user?.household) {
      setIsLoading(false)
      return
    }

    loadTodos()
    const unsubscribePromise = subscribeToTodos()

    return () => {
      unsubscribePromise.then(unsub => unsub?.())
    }
  }, [user?.household])

  const loadTodos = async () => {
    try {
      const records = await pb.collection('todos').getFullList<Todo>({
        filter: `household = "${user!.household}"`,
        sort: '-created',
      })
      setTodos(records)
      setIsConnected(true)
    } catch (err) {
      console.error('Failed to load todos:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const subscribeToTodos = async () => {
    try {
      return await pb.collection('todos').subscribe<Todo>('*', (e) => {
        if (e.record.household !== user?.household) return

        setTodos(current => {
          switch (e.action) {
            case 'create':
              return [e.record, ...current]
            case 'update':
              return current.map(t => t.id === e.record.id ? e.record : t)
            case 'delete':
              return current.filter(t => t.id !== e.record.id)
            default:
              return current
          }
        })
      })
    } catch (err) {
      console.error('Failed to subscribe:', err)
      setIsConnected(false)
    }
  }

  const createTodo = async (text: string, dueDate?: string) => {
    await pb.collection('todos').create({
      text,
      due_date: dueDate || null,
      status: 'pool',
      household: user!.household,
      created_by: user!.id,
    })
  }

  const assignTo = async (todoId: string, userId: string) => {
    setTodos(current =>
      current.map(t =>
        t.id === todoId ? { ...t, status: 'assigned' as const, assigned_to: userId } : t
      )
    )

    try {
      await pb.collection('todos').update(todoId, {
        status: 'assigned',
        assigned_to: userId,
      })
    } catch (err) {
      loadTodos()
    }
  }

  const markDone = async (todoId: string) => {
    setTodos(current =>
      current.map(t =>
        t.id === todoId ? { ...t, status: 'done' as const } : t
      )
    )

    try {
      await pb.collection('todos').update(todoId, { status: 'done' })
    } catch (err) {
      loadTodos()
    }
  }

  const returnToPool = async (todoId: string) => {
    setTodos(current =>
      current.map(t =>
        t.id === todoId ? { ...t, status: 'pool' as const, assigned_to: null } : t
      )
    )

    try {
      await pb.collection('todos').update(todoId, {
        status: 'pool',
        assigned_to: null,
      })
    } catch (err) {
      loadTodos()
    }
  }

  return (
    <TodosContext.Provider value={{
      todos,
      poolTodos,
      myTodos,
      isLoading,
      isConnected,
      createTodo,
      assignTo,
      markDone,
      returnToPool,
    }}>
      {children}
    </TodosContext.Provider>
  )
}

export function useTodos() {
  const context = useContext(TodosContext)
  if (!context) {
    throw new Error('useTodos must be used within TodosProvider')
  }
  return context
}
```

Run: `npm test`
Expected: PASS

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add TodosContext with realtime subscriptions"
```

---

## Phase 6: Swipe Components (TDD)

### Task 6.1: SwipeCard Component

**Files:**
- Create: `frontend/src/components/SwipeCard.tsx`
- Create: `frontend/src/components/SwipeCard.test.tsx`

**Step 1: Write SwipeCard tests**

In `frontend/src/components/SwipeCard.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SwipeCard } from './SwipeCard'
import { Todo } from '@/types'

const mockTodo: Todo = {
  id: '1',
  text: 'Test Todo',
  due_date: '2026-01-15',
  status: 'pool',
  household: 'h1',
  assigned_to: null,
  created_by: 'u1',
  created: '2026-01-06',
  updated: '2026-01-06',
}

describe('SwipeCard', () => {
  it('renders todo text', () => {
    render(
      <SwipeCard
        todo={mockTodo}
        onSwipeLeft={vi.fn()}
        onSwipeRight={vi.fn()}
      />
    )
    expect(screen.getByText('Test Todo')).toBeInTheDocument()
  })

  it('renders due date when present', () => {
    render(
      <SwipeCard
        todo={mockTodo}
        onSwipeLeft={vi.fn()}
        onSwipeRight={vi.fn()}
      />
    )
    expect(screen.getByText(/15.1.2026/)).toBeInTheDocument()
  })

  it('renders swipe labels', () => {
    render(
      <SwipeCard
        todo={mockTodo}
        onSwipeLeft={vi.fn()}
        onSwipeRight={vi.fn()}
        leftLabel="Patrick"
        rightLabel="Lisa"
      />
    )
    expect(screen.getByText('Patrick')).toBeInTheDocument()
    expect(screen.getByText('Lisa')).toBeInTheDocument()
  })
})
```

Run: `npm test`
Expected: FAIL

**Step 2: Implement SwipeCard**

In `frontend/src/components/SwipeCard.tsx`:
```typescript
import { useDrag } from '@use-gesture/react'
import { animated, useSpring } from '@react-spring/web'
import { Card, CardContent } from '@/components/ui/card'
import { Todo } from '@/types'
import { cn } from '@/lib/utils'

interface SwipeCardProps {
  todo: Todo
  onSwipeLeft: () => void
  onSwipeRight: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  leftLabel?: string
  rightLabel?: string
}

const SWIPE_THRESHOLD = 100
const VELOCITY_THRESHOLD = 0.5

export function SwipeCard({
  todo,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  leftLabel = '←',
  rightLabel = '→',
}: SwipeCardProps) {
  const [{ x, y, rotate, scale }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
  }))

  const bind = useDrag(
    ({ active, movement: [mx, my], velocity: [vx, vy] }) => {
      const isHorizontal = Math.abs(mx) > Math.abs(my)

      if (!active) {
        const triggeredX = Math.abs(mx) > SWIPE_THRESHOLD || Math.abs(vx) > VELOCITY_THRESHOLD
        const triggeredY = Math.abs(my) > SWIPE_THRESHOLD || Math.abs(vy) > VELOCITY_THRESHOLD

        if (triggeredX && isHorizontal) {
          const flyOut = mx > 0 ? 500 : -500
          api.start({
            x: flyOut,
            rotate: flyOut / 10,
            config: { friction: 50, tension: 200 },
            onRest: () => {
              mx > 0 ? onSwipeRight() : onSwipeLeft()
            },
          })
          return
        }

        if (triggeredY && !isHorizontal && (onSwipeUp || onSwipeDown)) {
          const flyOut = my > 0 ? 500 : -500
          api.start({
            y: flyOut,
            config: { friction: 50, tension: 200 },
            onRest: () => {
              my < 0 ? onSwipeUp?.() : onSwipeDown?.()
            },
          })
          return
        }

        api.start({ x: 0, y: 0, rotate: 0, scale: 1 })
        return
      }

      api.start({
        x: mx,
        y: isHorizontal ? 0 : my,
        rotate: isHorizontal ? mx / 20 : 0,
        scale: active ? 1.05 : 1,
        immediate: (key) => key === 'x' || key === 'y',
      })
    },
    { filterTaps: true }
  )

  return (
    <div className="relative w-full max-w-sm touch-none">
      <animated.div
        className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none"
        style={{
          opacity: x.to((val) => Math.min(Math.abs(val) / 100, 1)),
        }}
      >
        <span className="text-2xl font-bold text-blue-500">{leftLabel}</span>
        <span className="text-2xl font-bold text-pink-500">{rightLabel}</span>
      </animated.div>

      {(onSwipeUp || onSwipeDown) && (
        <animated.div
          className="absolute inset-0 flex flex-col items-center justify-between py-4 pointer-events-none"
          style={{
            opacity: y.to((val) => Math.min(Math.abs(val) / 100, 1)),
          }}
        >
          <span className="text-2xl font-bold text-green-500">✓ Erledigt</span>
          <span className="text-2xl font-bold text-yellow-500">↩ Zurück</span>
        </animated.div>
      )}

      <animated.div
        {...bind()}
        style={{ x, y, rotate, scale }}
        className="cursor-grab active:cursor-grabbing"
      >
        <Card className={cn("transition-shadow", "hover:shadow-lg")}>
          <CardContent className="p-6">
            <p className="text-lg font-medium">{todo.text}</p>
            {todo.due_date && (
              <p className="text-sm text-muted-foreground mt-2">
                bis {new Date(todo.due_date).toLocaleDateString('de-DE')}
              </p>
            )}
          </CardContent>
        </Card>
      </animated.div>
    </div>
  )
}
```

Run: `npm test`
Expected: PASS

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add SwipeCard component with gesture handling"
```

---

### Task 6.2: QuickAdd Component (TDD)

**Files:**
- Create: `frontend/src/components/QuickAdd.tsx`
- Create: `frontend/src/components/QuickAdd.test.tsx`

**Step 1: Write QuickAdd tests**

In `frontend/src/components/QuickAdd.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuickAdd } from './QuickAdd'

const mockCreateTodo = vi.fn()

vi.mock('@/contexts/TodosContext', () => ({
  useTodos: () => ({
    createTodo: mockCreateTodo,
  }),
}))

describe('QuickAdd', () => {
  it('renders floating add button', () => {
    render(<QuickAdd />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('opens dialog on click', async () => {
    const user = userEvent.setup()
    render(<QuickAdd />)

    await user.click(screen.getByRole('button'))
    expect(screen.getByText(/neues to-do/i)).toBeInTheDocument()
  })
})
```

Run: `npm test`
Expected: FAIL

**Step 2: Implement QuickAdd**

In `frontend/src/components/QuickAdd.tsx`:
```typescript
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useTodos } from '@/contexts/TodosContext'
import { Plus } from 'lucide-react'

export function QuickAdd() {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { createTodo } = useTodos()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return

    setIsLoading(true)
    try {
      await createTodo(text, dueDate || undefined)
      setText('')
      setDueDate('')
      setOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neues To-Do</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Was muss erledigt werden?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Erstelle...' : 'Hinzufügen'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

Run: `npm test`
Expected: PASS

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add QuickAdd component for todo creation"
```

---

## Phase 7: Main Pages (TDD)

### Task 7.1: Pool Page

**Files:**
- Create: `frontend/src/pages/Pool.tsx`
- Create: `frontend/src/pages/Pool.test.tsx`
- Create: `frontend/src/components/Header.tsx`

**Step 1: Write tests, implement, commit** (Same TDD pattern as above)

### Task 7.2: Mine Page

**Files:**
- Create: `frontend/src/pages/Mine.tsx`
- Create: `frontend/src/pages/Mine.test.tsx`

**Step 1: Write tests, implement, commit** (Same TDD pattern)

---

## Phase 8: App Router & Integration

### Task 8.1: App.tsx with Full Routing

**Files:**
- Modify: `frontend/src/App.tsx`
- Create: `frontend/src/App.test.tsx`

**Step 1: Write App integration tests**

In `frontend/src/App.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

vi.mock('@/lib/pocketbase', () => ({
  pb: {
    authStore: {
      model: null,
      onChange: vi.fn(() => () => {}),
    },
  },
}))

describe('App', () => {
  it('redirects to login when not authenticated', () => {
    render(<App />)
    expect(screen.getByText(/swipetodo/i)).toBeInTheDocument()
  })
})
```

**Step 2: Implement full App.tsx**

In `frontend/src/App.tsx`:
```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { TodosProvider } from '@/contexts/TodosContext'
import { Login } from '@/pages/Login'
import { Verify } from '@/pages/Verify'
import { Setup } from '@/pages/Setup'
import { Join } from '@/pages/Join'
import { Pool } from '@/pages/Pool'
import { Mine } from '@/pages/Mine'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Laden...</div>
  }
  if (!user) return <Navigate to="/login" />
  if (!user.household) return <Navigate to="/setup" />

  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/join/:code" element={<Join />} />
          <Route path="/setup" element={
            <ProtectedRoute>
              <Setup />
            </ProtectedRoute>
          } />
          <Route path="/" element={
            <ProtectedRoute>
              <TodosProvider>
                <Pool />
              </TodosProvider>
            </ProtectedRoute>
          } />
          <Route path="/mine" element={
            <ProtectedRoute>
              <TodosProvider>
                <Mine />
              </TodosProvider>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
```

Run: `npm test`
Expected: All tests pass

**Step 3: Manual E2E test**

```bash
# Terminal 1: Start PocketBase
cd pocketbase && ./start.sh

# Terminal 2: Start Frontend
cd frontend && npm run dev
```

Open http://localhost:5173 and test full flow manually.

**Step 4: Commit**

```bash
git add .
git commit -m "feat: complete app with routing and all pages"
```

---

## Phase 9: Deployment

### Task 9.1: Docker Setup for Production

(Same as before - Dockerfiles for frontend and docker-compose)

### Task 9.2: Coolify Configuration

(Same as before - Coolify setup instructions)

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 0 | 0.1 | Local PocketBase setup |
| 1 | 1.1-1.2 | Vite + Vitest + Tailwind + shadcn |
| 2 | 2.1 | PocketBase schema |
| 3 | 3.1-3.2 | Types + PocketBase client |
| 4 | 4.1-4.4 | Auth: Context, Login, Verify, Setup, Join |
| 5 | 5.1 | TodosContext with realtime |
| 6 | 6.1-6.2 | SwipeCard, QuickAdd |
| 7 | 7.1-7.2 | Pool page, Mine page |
| 8 | 8.1 | App routing + integration |
| 9 | 9.1-9.2 | Docker + Coolify deployment |

**Approach:** TDD throughout - write failing test, implement, verify, commit.

**Local Dev:**
- PocketBase: `cd pocketbase && ./start.sh` → http://localhost:8090
- Frontend: `cd frontend && npm run dev` → http://localhost:5173
- Tests: `cd frontend && npm test`
