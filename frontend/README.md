# GreenLens Kids — Frontend

Educational nature app for kids built with **React**, **TypeScript**, and **Vite**. UI originated from [Figma Make](https://www.figma.com/design/1sYDbNjAjMKxVlRv7MQpEv/Flutter-Frontend-Architecture-Design).

This folder contains:

| Path      | Description                                                     |
|-----------|-----------------------------------------------------------------|
| `src/`    | Main **web app** (Vite + React) — primary development target    |
| `api/`    | Local **mock .NET API** for development and integration testing |
| `mobile/` | **React Native / Expo** app (separate install & run)            |

---

## Prerequisites

### Web app (required)

- **Node.js** 18+ (20 LTS recommended)
- **npm** (comes with Node.js)

### Mock API (recommended for full app features)

- **.NET SDK 10** (the mock API targets `net10.0`)

Check your versions:

```bash
node -v
npm -v
dotnet --version
```

---

## Quick start (web app + mock API)

This is the recommended setup. Most features (character creation, scanner, quiz, game, profile) call the local mock API.

### 1. Install frontend dependencies

From the `frontend/` directory:

```bash
cd frontend
npm install
```

### 2. Start the mock API (terminal 1)

```bash
npm run api
```

The mock API listens at:

```text
http://localhost:5186
```

You should see output indicating the server is running. Leave this terminal open.

### 3. Start the Vite dev server (terminal 2)

```bash
npm run dev
```

The web app opens at:

```text
http://localhost:5173
```

### 4. Open the app

1. Go to `http://localhost:5173` in your browser.
2. Wait for the splash screen.
3. Create a character (gender, hair, eyes, outfit, name) and click **Start Adventure**.
4. You should land on the **Dashboard** (home screen).

---

## How the dev proxy works

During development, Vite proxies API requests to the mock server:

| Frontend request  | Proxied to                             |
|-------------------|----------------------------------------|
| `/api/*`          | `http://localhost:5186/api/*`          |
| `/child-profiles` | `http://localhost:5186/child-profiles` |

Proxy configuration lives in `vite.config.ts`. No extra env setup is needed for local development.

---

## Environment variables

File: `.env.development`

```env
# Empty = use relative URLs and the Vite dev proxy (default for local dev)
VITE_API_URL=
```

| Value                          | Behavior                                                                                                   |
|--------------------------------|------------------------------------------------------------------------------------------------------------|
| *(empty)*                      | Requests go to `/child-profiles` and `/api/...` on the same origin; Vite proxies them to `localhost:5186`. |
| `http://localhost:5001`        | Call the **real backend** directly (see [Connect to the real backend](#connect-to-the-real-backend)).      |
| `https://your-api.example.com` | Call a deployed API (production/staging).                                                                  |

After changing `.env.development`, restart the Vite dev server.

---

## Available npm scripts

Run these from the `frontend/` directory:

| Script       | Command              | Description                                    |
|--------------|----------------------|------------------------------------------------|
| `dev`        | `npm run dev`        | Start Vite dev server on port **5173**         |
| `api`        | `npm run api`        | Start the local mock .NET API on port **5186** |
| `build`      | `npm run build`      | Production build → output in `dist/`           |
| `test`       | `npm run test`       | Run Vitest unit tests once                     |
| `test:watch` | `npm run test:watch` | Run Vitest in watch mode                       |

### Production build & preview

```bash
npm run build
npx vite preview
```

Preview serves the built app (default port **4173**). For production builds that call APIs, set `VITE_API_URL` to your deployed backend before running `npm run build`.

---

## Mock API (local development backend)

The mock API in `frontend/api/` provides endpoints used by the web app during development. It does **not** use DynamoDB — it returns in-memory/mock responses.

### Start manually

```bash
cd frontend
dotnet run --project api
```

Or use the npm shortcut:

```bash
npm run api
```

### Mock endpoints

| Method | Path                   | Purpose              |
|--------|------------------------|----------------------|
| `POST` | `/child-profiles`      | Create child profile |
| `POST` | `/api/auth/register`   | Register             |
| `POST` | `/api/auth/login`      | Login                |
| `POST` | `/api/scanner/analyze` | AI camera scan       |
| `GET`  | `/api/quiz/...`        | Quiz questions       |
| `POST` | `/api/quiz/complete`   | Complete quiz        |
| `POST` | `/api/game/result`     | Submit game score    |
| `POST` | `/api/tts/speak`       | Text-to-speech       |
| `GET`  | `/api/user/profile`    | User profile         |

### Test the API directly

Use `api/Api.http` with the REST Client extension (VS Code / Cursor), or curl:

```bash
curl -X POST http://localhost:5186/child-profiles \
  -H "Content-Type: application/json" \
  -d "{\"characterName\":\"Gấu Xanh\",\"gender\":\"male\",\"hair\":\"hair_01\",\"eyes\":\"eyes_01\",\"outfit\":\"outfit_01\",\"avatarPreview\":\"character_preview_01\"}"
```

Expected: HTTP 200 with a JSON body containing `childId`.

---

## Connect to the real backend

The production backend lives in `../backend/` and runs on port **5001** when started via Docker.

### Option A — point env at the real API

1. Start the backend (see `backend/README.md`):

   ```bash
   cd backend
   docker compose up --build -d api
   ```

2. Set in `frontend/.env.development`:

   ```env
   VITE_API_URL=http://localhost:5001
   ```

3. Restart `npm run dev`.

> **Note:** When `VITE_API_URL` is set, requests bypass the Vite proxy and go directly to that host. You do not need `npm run api` in this mode.

### Option B — change the Vite proxy target

Edit `vite.config.ts` and change the proxy `target` from `http://localhost:5186` to `http://localhost:5001`, then keep `VITE_API_URL` empty.

---

## Web app entry point & flow

The active web app bootstraps from:

```text
index.html → src/main.tsx → src/app/App.tsx
```

**User flow (web):**

1. Splash screen
2. Character creation (`AvatarScreen`) — first-time users
3. Main app screens (internal navigation, no URL router):
   - **1** Dashboard (home)
   - **2** AI Scanner
   - **3** Eco Quiz
   - **4** Sort Game
   - **5** Profile

**Local storage used by the web app:**

| Key          | Storage          | Purpose                                    |
|--------------|------------------|--------------------------------------------|
| `childId`    | `localStorage`   | Child profile ID for future API calls      |
| `gl_profile` | `sessionStorage` | Current session profile (XP, avatar, etc.) |
| `gl_token`   | `sessionStorage` | Session token                              |

---

## Mobile app (React Native / Expo)

The Expo app is a **separate** project under `mobile/`. It is not started by `npm run dev` in the frontend root.

```bash
cd mobile
npm install
npm start
```

Then press `a` (Android), `i` (iOS), or `w` (web) in the Expo CLI, or scan the QR code with Expo Go.

Additional scripts:

```bash
npm run android   # Open on Android emulator/device
npm run ios       # Open on iOS simulator (macOS only)
npm run web       # Run mobile UI in the browser via Expo
```

---

## Troubleshooting

### `POST /child-profiles` fails or network error

- Ensure the mock API is running: `npm run api`
- Confirm it is reachable: `http://localhost:5186/child-profiles`
- Restart `npm run dev` after changing `.env.development`

### Port already in use

| Port | Service         |
|------|-----------------|
| 5173 | Vite dev server |
| 5186 | Mock API        |

Stop the conflicting process or change the port in `vite.config.ts` / `api/Properties/launchSettings.json`.

### `dotnet run` fails

Install [.NET SDK 10](https://dotnet.microsoft.com/download) or run the real backend via Docker from `backend/` instead.

### App skips character creation

If `childId` exists in `localStorage` and a profile exists in `sessionStorage`, the app opens directly on the Dashboard. Clear site data in DevTools → Application → Storage to test the first-run flow again.

### CORS errors when using `VITE_API_URL`

The real backend must allow `http://localhost:5173` in its CORS configuration. The mock API already allows the Vite origin.

---

## Project structure

```
frontend/
├── api/                    # Mock .NET API (local dev)
├── mobile/                 # Expo / React Native app
├── public/                 # Static assets
├── src/
│   ├── app/                # Active web app (screens, components, App.tsx)
│   ├── hooks/              # Shared hooks (e.g. useGreenLens)
│   ├── lib/                # API client, avatar mapping, utilities
│   ├── services/           # childProfileApi, tokenStorage, etc.
│   ├── features/           # Legacy/alternate router-based modules
│   ├── routes/             # Legacy React Router setup (not used by main entry)
│   ├── shared/             # Shared UI and layout
│   ├── styles/
│   └── main.tsx            # Web entry point
├── .env.development
├── index.html
├── package.json
└── vite.config.ts
```

---

## Tech stack

- React 18, TypeScript, Vite 6
- Tailwind CSS 4
- Motion (animations), Lucide icons
- Vitest (unit tests)
- Mock API: ASP.NET Core (`frontend/api/`)

---

## Architecture (reference)

### Communication flow

```
┌─────────────────────────────────────────────────────────────┐
│                         UI Layer                            │
│  src/app/screens/*  (Avatar, Dashboard, Scanner, Quiz…)     │
└───────────────────────────┬─────────────────────────────────┘
                            │ user events
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   State / Hooks                             │
│  useGreenLens, session storage, localStorage (childId)      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Services (childProfileApi, lib/api.ts)         │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP
                            ▼
┌─────────────────────────────────────────────────────────────┐
│     Mock API (frontend/api)  or  Real backend (backend/)    │
└─────────────────────────────────────────────────────────────┘
```

### Legacy code

- `src/features/` and `src/routes/` contain an alternate router-based auth flow (`/login`, `/register`, `/app/...`). The **active** web entry uses `src/app/App.tsx` instead.
- Files under `src/app/features/` may remain from the Figma export.
- Supabase scaffolding in `/supabase` is optional and not used by the main web flow.

---

## Implemented modules (web)

| Module             | Location                              |
|--------------------|---------------------------------------|
| Character creation | `src/app/screens/AvatarScreen.tsx`    |
| Dashboard (home)   | `src/app/screens/DashboardScreen.tsx` |
| AI Scanner         | `src/app/screens/ScannerScreen.tsx`   |
| Eco Quiz           | `src/app/screens/QuizScreen.tsx`      |
| Sort Game          | `src/app/screens/GameScreen.tsx`      |
| Profile            | `src/app/screens/ProfileScreen.tsx`   |
| Child profile API  | `src/services/childProfileApi.ts`     |
| Child ID storage   | `src/services/childProfileStorage.ts` |
