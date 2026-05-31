# GreenLens Kids — Frontend Architecture

Educational nature app for kids (React + TypeScript + Vite). UI originated from [Figma Make](https://www.figma.com/design/1sYDbNjAjMKxVlRv7MQpEv/Flutter-Frontend-Architecture-Design); this repo implements a **layered frontend architecture** with mock APIs (no real backend required).

## Run (Web)

```bash
npm install
npm run dev
```

## Run (React Native / Expo)

Main children's home screen UI lives in `mobile/`:

```bash
cd mobile
npm install
npx expo start
```

See [mobile/README.md](./mobile/README.md) for component breakdown.

---

## Implemented

| # | Requirement | Status | Location |
|---|-------------|--------|----------|
| 1 | Authentication (Login, Register, flow) | Done | `src/features/auth/` |
| 2 | Secure token storage | Done | `src/services/tokenStorage.ts` |
| 3 | API layer (mock) | Done | `src/services/*Api.ts` |
| 4 | State management (React Context) | Done | `src/state/*Store.ts` |
| 5 | Daily Activity module | Done | `src/features/daily/DailyActivity.tsx` |
| 6 | Communication flow diagram | Done | Below + this README |
| 7 | Architecture explanation | Done | Below |
| 8 | Standard folder structure | Done | `src/features`, `services`, `state`, `shared`, `routes`, `app` |
| 9 | Mini Game module (placeholder) | Done | `src/features/mini-games/MiniGameModule.tsx` |

### Authentication flow

1. `/splash` → redirects to `/login` or `/app` if token exists  
2. **Login / Register** → `authService` → `authApi` (mock) → `tokenStorage` → `authStore`  
3. Navigate to `/app` (protected routes)

Login/register accept any email/password; no validation against a real server.

---

## Current architecture

### Folder structure

```
src/
├── app/                 # App root + providers wiring
│   └── App.tsx
├── routes/              # React Router definitions
│   └── index.tsx
├── features/            # Feature modules (UI + feature logic)
│   ├── auth/
│   ├── splash/
│   ├── dashboard/
│   ├── daily/
│   ├── camera/
│   ├── quiz/
│   ├── rewards/
│   └── mini-games/
├── services/            # API clients + token storage
│   ├── tokenStorage.ts
│   ├── authApi.ts
│   ├── cameraApi.ts
│   ├── quizApi.ts
│   └── rewardApi.ts
├── state/               # React Context stores
│   ├── authStore.ts
│   ├── rewardStore.ts
│   ├── quizStore.ts
│   └── index.ts
├── shared/              # Layout, guards, reusable UI
│   ├── Layout.tsx
│   ├── ProtectedRoute.tsx
│   └── components/ui/   # shadcn/Radix primitives
├── styles/
└── main.tsx
```

### Communication flow (Frontend → API → AWS)

```
┌─────────────────────────────────────────────────────────────┐
│                         UI Layer                             │
│  features/*  (Login, Dashboard, Camera, Quiz, Rewards…)     │
└───────────────────────────┬─────────────────────────────────┘
                            │ user events
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   State Management                           │
│  authStore │ rewardStore │ quizStore  (React Context)       │
└───────────────────────────┬─────────────────────────────────┘
                            │ read / write state
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Services (API + tokenStorage)                   │
│  authApi │ cameraApi │ quizApi │ rewardApi │ tokenStorage   │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP (mock today / real later)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    AWS Backend (future)                      │
│  API Gateway → Lambda → DynamoDB / S3 / Cognito             │
└─────────────────────────────────────────────────────────────┘
```

**Today:** service files return mock data after a short delay. **Later:** replace implementations in `src/services/*Api.ts` with `fetch()` to your AWS API Gateway endpoints without changing feature UI.

### Data flow

1. User action in a **feature screen** (e.g. capture photo).  
2. Feature calls a **service** (`uploadImage`).  
3. Service resolves mock/real JSON.  
4. Feature updates **context** (`addXp`, `setAuth`).  
5. **Token** persisted via `localStorage` when logging in.  
6. UI re-renders from context hooks (`useAuth`, `useReward`, `useQuiz`).

### State flow

| Store | Responsibility |
|-------|----------------|
| `authStore` | User session, `isAuthenticated`, login/logout |
| `rewardStore` | XP, level, streak, badges |
| `quizStore` | Questions list, score, quiz progress |

Providers are composed in `src/state/index.ts` → `AppProviders` wraps the router in `App.tsx`.

### API flow (mock)

```ts
// Example: camera scan
CameraModule → uploadImage() → cameraApi.ts → mock result → rewardStore.addXp()
```

### Reusable component strategy

- **`shared/components/ui/`** — low-level primitives (Button, Card, Dialog…) from shadcn/Radix; use for new screens.  
- **`shared/Layout.tsx`** — app shell (header, bottom nav).  
- **`features/*`** — page-level modules; keep business logic thin; delegate to `services/` and `state/`.  
- **Do not** import feature modules from other features; share via `state` or `shared/`.

---

## Routes

| Path | Screen |
|------|--------|
| `/splash` | Splash |
| `/login` | Login |
| `/register` | Register |
| `/app` | Dashboard (protected) |
| `/app/daily` | Daily Activity |
| `/app/camera` | AI Camera |
| `/app/quiz` | Quiz |
| `/app/game` | Mini Games (placeholder) |
| `/app/rewards` | Rewards |

---

## Tech stack

- React 18, TypeScript, Vite 6  
- React Router 7  
- Tailwind CSS 4  
- Lucide icons  
- React Context API (no Redux/Zustand required for this assignment)

---

## Notes

- Legacy files under `src/app/features/` and `src/app/components/` may remain from the Figma export; **active code** uses `src/features/` and `src/shared/`.  
- Supabase edge functions in `/supabase` are optional scaffolding, not used by the mock frontend flow.
