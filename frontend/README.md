# GreenLens Kids — Frontend

Educational nature app for kids (React + TypeScript + Vite). UI originated from [Figma Make](https://www.figma.com/design/1sYDbNjAjMKxVlRv7MQpEv/Flutter-Frontend-Architecture-Design).

The web app runs **standalone with in-browser mocks** by default. An optional local .NET API is included for child-profile creation and future backend integration.

---

## Quick start (web only)

```bash
npm install
npm run dev
```

Open **http://localhost:5173/** — Vite serves the app with hot reload.

No backend is required for most features. Scanner, quiz, game, and TTS use built-in mocks when `VITE_API_URL` is not set.

---

## Full stack (web + local API)

Use two terminals from the `frontend/` directory:

**Terminal 1 — .NET API (port 5186)**

```bash
npm run api
```

**Terminal 2 — Vite dev server (port 5173)**

```bash
npm run dev
```

Vite proxies API traffic to the .NET server:

| Frontend path       | Proxied to              |
|---------------------|-------------------------|
| `/api/*`            | `http://localhost:5186` |
| `/child-profiles`   | `http://localhost:5186` |

To route all API calls through the proxy (instead of in-browser mocks), create a `.env` file:

```env
VITE_API_URL=
```

An empty value uses relative URLs, so requests go through the Vite proxy.

---

## How the app boots

```
index.html
    └── /src/main.tsx          # createRoot, mount <App />
            └── src/app/App.tsx # phase-based navigation + screens
                    └── useGreenLens()  # state + API calls
                            ├── src/lib/api.ts
                            └── src/services/childProfileApi.ts
```

1. **`index.html`** — mounts React into `#root` and loads `main.tsx`.
2. **`src/main.tsx`** — renders `<App />` and imports global styles.
3. **`src/app/App.tsx`** — root component that controls the entire user flow.

> **Note:** The active app does **not** use React Router. Entry point is `src/app/App.tsx`, not `src/routes/index.tsx`. Legacy router-based modules under `src/features/` and `src/routes/` remain from an earlier architecture but are not wired into the current entry.

---

## Navigation model

The app uses a **phase + screen** state machine inside `App.tsx` — URLs do not change as the user moves through the app.

### Phases

| Phase    | Description                 |
|----------|-----------------------------|
| `splash` | Launch screen (~1.3 s)      |
| `avatar` | Create or edit character    |
| `app`    | Main experience (5 screens) |

**Startup logic:**

- If `childId` exists in `localStorage` **and** a profile exists in `sessionStorage` → go to `app` after splash.
- Otherwise → go to `avatar` to create a character.

### Screens (phase = `app`)

| Screen | Component         | Feature           |
|--------|-------------------|-------------------|
| 1      | `DashboardScreen` | Home              |
| 2      | `ScannerScreen`   | AI camera scan    |
| 3      | `QuizScreen`      | Eco quiz          |
| 4      | `GameScreen`      | Sorting mini-game |
| 5      | `ProfileScreen`   | Profile / logout  |

Navigation uses `go(screenNumber)` and `BottomNav` — not URL routes.

---

## State and API

### `useGreenLens` hook

`src/hooks/useGreenLens.ts` is the central business-logic layer:

- Holds `profile`, `busy`, `error`, `quizQuestions`, `lastScan`
- Exposes actions: `createProfile`, `analyzeImage`, `completeQuiz`, `submitGame`, `speak`, `logout`, `updateAvatar`
- Wraps async calls with loading and error handling

### API layers

**1. Child profile creation** — `src/services/childProfileApi.ts`

- `POST /child-profiles` → .NET `ChildProfilesController` (when API is running)
- Saves `childId` to `localStorage` via `childProfileStorage.ts`

**2. App features** — `src/lib/api.ts`

- Endpoints: auth, scanner, quiz, game, TTS, user profile
- If `VITE_API_URL` is unset → uses `mockRequest()` (in-browser, no network)
- If set → `fetch()` to the backend; falls back to mock on failure

### Session storage

| Key          | Storage          | Purpose                    |
|--------------|------------------|----------------------------|
| `childId`    | `localStorage`   | Child profile ID from API  |
| `gl_token`   | `sessionStorage` | Auth token                 |
| `gl_profile` | `sessionStorage` | Current user profile JSON  |

---

## User flow (typical session)

```
Open app
  → splash (1.3 s)
  → avatar (first visit) OR dashboard (returning user)

Create character
  → AvatarScreen → createProfile()
  → POST /child-profiles (real API if running)
  → save childId + profile → dashboard

Use features
  → Scanner: analyzeImage() → mock/real /api/scanner/analyze
  → Quiz: completeQuiz()     → mock/real /api/quiz/complete
  → Game: submitGame()       → mock/real /api/game/result
  → Profile: logout() clears session → back to avatar
```

---

## Active folder structure

```
src/
├── main.tsx                 # Entry point
├── app/
│   ├── App.tsx              # Root: phases, screens, routing logic
│   ├── screens/             # Splash, Avatar, Dashboard, Scanner, Quiz, Game, Profile
│   ├── components/          # Mascot, BottomNav, AvatarPreview, etc.
│   ├── constants.ts
│   └── types.ts
├── hooks/
│   └── useGreenLens.ts      # App state + API orchestration
├── lib/
│   ├── api.ts               # Feature API client (mock + real)
│   └── avatarMapper.ts      # Avatar config → API payload
├── services/
│   ├── childProfileApi.ts   # POST /child-profiles
│   └── childProfileStorage.ts
├── styles/
└── assets/

api/                         # Local .NET mock API (optional)
├── Program.cs
├── Controllers/
└── Services/Mocks/
```

### Legacy (not used by current entry)

These remain from earlier Figma / assignment scaffolding:

- `src/features/` — router-based feature modules
- `src/routes/` — React Router config
- `src/state/` — React Context stores
- `src/services/*Api.ts` — separate mock API clients for the router app

---

## Communication flow

```
┌─────────────────────────────────────────────────────────────┐
│                      UI Layer                               │
│  src/app/screens/*  (Dashboard, Scanner, Quiz, Game…)       │
└───────────────────────────┬─────────────────────────────────┘
                            │ user events
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   useGreenLens hook                         │
│  profile │ busy │ error │ quizQuestions │ lastScan          │
└───────────────────────────┬─────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌──────────────────────────┐  ┌──────────────────────────────┐
│  childProfileApi.ts      │  │  lib/api.ts                  │
│  POST /child-profiles    │  │  /api/auth, scanner, quiz…   │
└────────────┬─────────────┘  └──────────────┬───────────────┘
             │                               │
             └───────────────┬───────────────┘
                             │ HTTP (mock or proxied)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Vite proxy → localhost:5186 (.NET api/)                    │
│  Future: AWS API Gateway → Lambda → DynamoDB / S3 / Cognito │
└─────────────────────────────────────────────────────────────┘
```

---

## Build

```bash
npm run build
```

Outputs a static production bundle via Vite.

---

## React Native / Expo

A separate mobile UI lives in `mobile/`:

```bash
cd mobile
npm install
npx expo start
```

See [mobile/README.md](./mobile/README.md) for details.

---

## Tech stack

- React 18, TypeScript, Vite 6
- Tailwind CSS 4
- Motion (animations)
- Radix UI / shadcn primitives (legacy modules)
- Optional: ASP.NET Core mock API in `api/`

---

## Scripts

| Command        | Description                          |
|----------------|--------------------------------------|
| `npm run dev`  | Start Vite dev server (port 5173)    |
| `npm run build`| Production build                     |
| `npm run api`  | Start .NET mock API (port 5186)      |
