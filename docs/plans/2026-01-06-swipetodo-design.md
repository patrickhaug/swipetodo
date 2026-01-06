# SwipeTodo – Design Document

> Minimalistische To-Do-App für Paare mit Swipe-basierter Aufgabenverteilung und Echtzeit-Sync.

## Überblick

### Problem
Gemeinsame To-Dos im Haushalt landen oft in Chat-Verläufen oder werden vergessen. Wer macht was ist unklar.

### Lösung
Eine App mit gemeinsamem "Topf" für To-Dos. Per Tinder-artigem Swipen werden Aufgaben verteilt. Echtzeit-Sync hält beide Partner auf dem gleichen Stand.

---

## Kernfeatures

| Feature | Beschreibung |
|---------|--------------|
| **Gemeinsamer Pool** | To-Dos landen unzugewiesen im Topf |
| **Swipe-Zuweisung** | Links/Rechts = Zuweisung an Partner |
| **Swipe-Aktionen** | Oben = Erledigt, Unten = Zurück in Pool |
| **Quick-Add** | Floating Button → Text + optionales Datum |
| **Echtzeit-Sync** | Änderungen sofort auf allen Geräten |
| **Magic Link Auth** | Kein Passwort, Code per E-Mail |
| **Einladungs-Link** | `/join/CODE` für Partner-Onboarding |

---

## Architektur

```
┌─────────────────┐         ┌─────────────────┐
│   React SPA     │ ←────── │   PocketBase    │
│   (Frontend)    │  REST + │   (Backend)     │
│                 │  Realtime│                 │
│  - React Router │  SSE    │  - Auth         │
│  - Tailwind     │         │  - SQLite DB    │
│  - shadcn/ui    │         │  - Realtime     │
│  - Swipe UI     │         │                 │
└─────────────────┘         └─────────────────┘
        │                           │
        └───────── Coolify ─────────┘
                 (Hetzner)
```

### Services (Coolify)

1. **Frontend** – `app.domain.de`
   - Vite Build → Nginx Container
   - Env: `VITE_PB_URL`

2. **PocketBase** – `api.domain.de`
   - Single Container
   - Persistentes Volume für SQLite
   - SMTP via Resend für Magic Links

---

## Tech Stack

| Layer | Technologie |
|-------|-------------|
| **Frontend** | React 18 + React Router 6 + Vite |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Swipe** | @use-gesture/react + react-spring |
| **Backend** | PocketBase (Auth, DB, Realtime) |
| **Mail** | Resend (Magic Links) |
| **Hosting** | Hetzner via Coolify |

### Dependencies

```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "react-router-dom": "^6",
    "pocketbase": "^0.21",
    "@use-gesture/react": "^10",
    "react-spring": "^9"
  },
  "devDependencies": {
    "vite": "^5",
    "tailwindcss": "^3",
    "typescript": "^5",
    "class-variance-authority": "^0.7",
    "clsx": "^2",
    "tailwind-merge": "^2"
  }
}
```

---

## Datenmodell

### Collections

```
┌─────────────────────────────────────────────────────────┐
│ users (PocketBase built-in)                             │
├─────────────────────────────────────────────────────────┤
│ id             email                 name     household │
│ string         string                string   relation  │
│                                                → households │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ households                                              │
├─────────────────────────────────────────────────────────┤
│ id             name          invite_code    created_by  │
│ string         string        string (unique) relation   │
│                "Zuhause"     "XKCD42"       → users     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ todos                                                   │
├─────────────────────────────────────────────────────────┤
│ id             household     text           due_date    │
│ string         relation      string         datetime?   │
│                → households  "Müll raus"    null/date   │
├─────────────────────────────────────────────────────────┤
│ assigned_to    status        created_by     created     │
│ relation?      enum          relation       datetime    │
│ → users/null   pool/assigned → users       auto        │
│                /done                                    │
└─────────────────────────────────────────────────────────┘
```

### Status-Flow

```
[pool] ──swipe L/R──→ [assigned] ──swipe up──→ [done]
                           │
                           └──swipe down──→ [pool]
```

### API Rules

- Jeder User sieht nur To-Dos seines `household`
- `assigned_to` ist `null` wenn Status = `pool`
- Filter via PocketBase Collection Rules

---

## Screens & Routing

| Route | Funktion | Auth |
|-------|----------|------|
| `/login` | Magic Link anfordern | Public |
| `/verify` | OTP Code eingeben | Public |
| `/join/:code` | Einladung annehmen → Login | Public |
| `/setup` | Haushalt erstellen | Protected |
| `/` | Pool – Swipe-Zuweisung | Protected |
| `/mine` | Eigene To-Dos | Protected |
| `/all` | Übersicht aller To-Dos | Protected |

### Route Guards

```
Nicht eingeloggt         → /login
Eingeloggt, kein Haushalt → /setup
Eingeloggt, hat Haushalt  → /
```

---

## UI Screens

### Pool (`/`)

```
┌─────────────────────────────┐
│  ← Meine (3)    Pool    + │
├─────────────────────────────┤
│                             │
│    ┌───────────────────┐    │
│    │                   │    │
│    │   Müll rausbringen│    │
│    │                   │    │
│    │   bis morgen      │    │
│    │                   │    │
│    └───────────────────┘    │
│                             │
│    ← Patrick    Lisa →      │
│                             │
├─────────────────────────────┤
│      ● ○ ○ ○  (4 im Pool)   │
└─────────────────────────────┘
```

### Meine To-Dos (`/mine`)

```
┌─────────────────────────────┐
│  ←  Meine To-Dos        + │
├─────────────────────────────┤
│  ┌───────────────────────┐  │
│  │ Einkaufen         ↑ ↓ │  │
│  │ bis Fr                │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Steuer abgeben        │  │
│  │ bis 31.01.            │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

---

## Auth Flow

### Magic Link (OTP)

```
1. User gibt E-Mail ein auf /login
2. PocketBase authWithOTP() generiert 6-digit Code
3. Resend sendet E-Mail mit Code
4. User gibt Code ein auf /verify
5. PocketBase validiert → User eingeloggt
```

### Einladungs-Flow

```
1. User A erstellt Haushalt → bekommt invite_code
2. User A teilt Link: app.domain.de/join/XKCD42
3. User B klickt Link → Code in localStorage
4. User B durchläuft Login
5. Nach Login: Auto-Join Haushalt via gespeichertem Code
```

---

## Echtzeit-Sync

### PocketBase Subscriptions

```typescript
pb.collection('todos').subscribe('*', (event) => {
  switch (event.action) {
    case 'create': addTodoToState(event.record)
    case 'update': updateTodoInState(event.record)
    case 'delete': removeTodoFromState(event.record)
  }
})
```

### State Management

```typescript
// React Context: TodosProvider
{
  todos: Todo[]           // Alle Todos des Haushalts
  poolTodos: Todo[]       // Computed: status === 'pool'
  myTodos: Todo[]         // Computed: assigned_to === me
  partnerTodos: Todo[]    // Computed: assigned_to === partner
}
```

### Optimistic Updates

- Swipe updated sofort lokalen State
- API-Call parallel
- Bei Fehler: Rollback + Toast

### Sync-Indikator

- Header: 🟢 verbunden / 🔴 offline
- Reconnect: State neu laden

---

## Swipe-Implementierung

### Libraries

- `@use-gesture/react` – Touch/Mouse Gesture Detection
- `react-spring` – Animationen

### Swipe-Logik

```typescript
const bind = useDrag(({ direction: [dx, dy], velocity }) => {
  if (velocity > threshold) {
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal: Zuweisung
      dx < 0 ? assignTo(partner1) : assignTo(partner2)
    } else {
      // Vertikal: Done/Return (nur auf /mine)
      dy < 0 ? markDone() : returnToPool()
    }
  }
})
```

### Visuelles Feedback

- Karte neigt sich in Swipe-Richtung
- Farbiger Overlay: Links=Blau, Rechts=Pink, Oben=Grün, Unten=Gelb
- Icon erscheint (👤 / ✓ / ↩)

---

## Projekt-Struktur

```
swipe-todo/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              ← shadcn components
│   │   │   ├── SwipeCard.tsx
│   │   │   ├── TodoList.tsx
│   │   │   ├── QuickAdd.tsx
│   │   │   └── Header.tsx
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx
│   │   │   └── TodosContext.tsx
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Verify.tsx
│   │   │   ├── Setup.tsx
│   │   │   ├── Join.tsx
│   │   │   ├── Pool.tsx
│   │   │   └── Mine.tsx
│   │   ├── lib/
│   │   │   └── pocketbase.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── Dockerfile
│   └── vite.config.ts
│
├── pocketbase/
│   ├── pb_migrations/
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

---

## Entscheidungen

| Entscheidung | Gewählt | Alternativen |
|--------------|---------|--------------|
| Backend | PocketBase | Convex, Supabase, Custom |
| Auth | Magic Link (OTP) | Password, OAuth |
| Swipe Library | @use-gesture + react-spring | react-tinder-card |
| UI Components | shadcn/ui | Radix, Headless UI, Custom |
| Hosting | Hetzner + Coolify | Vercel, Railway |
| Mail | Resend | Mailgun, Postmark |

---

## Erweiterungsmöglichkeiten (Später)

- Telegram Bot für Quick-Add
- Push Notifications (PWA)
- Kategorien / Tags
- Wiederkehrende To-Dos
- Statistiken (wer hat wie viel erledigt)
