# GreenLens Kids — Frontend

Educational nature app for kids (React + TypeScript + Vite). UI originated from [Figma Make](https://www.figma.com/design/1sYDbNjAjMKxVlRv7MQpEv/Flutter-Frontend-Architecture-Design).

The frontend connects to the **GreenLens backend** (`../backend/`). Scanner, quiz, game, and TTS fall back to in-browser mocks when those `/api/*` endpoints are not available yet.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # optional — defaults to localhost:5001
npm run dev
```

Open **http://localhost:5173/**.

### With local backend (BE team)

From the repo root, start the API via Docker (see `../backend/README.md`):

```bash
cd ../backend
docker compose up --build -d api
```

API listens at **http://localhost:5001**. Vite proxies `/child-profiles` and `/api/*` to that URL.

| Frontend path     | Proxied to (dev default)   |
|-------------------|----------------------------|
| `/child-profiles` | `http://localhost:5001`    |
| `/api/*`          | `http://localhost:5001`    |

Override the proxy target in `.env.local`:

```env
VITE_API_PROXY_TARGET=http://localhost:5001
```

For staging/production builds, set the full API URL:

```env
VITE_API_URL=https://api.greenlens.com
```

Force in-browser mocks only (skip network):

```env
VITE_USE_MOCK=true
```

---

## How the app boots

```
index.html
    └── src/main.tsx
            └── src/App.tsx          # phase-based navigation + screens
                    └── useGreenLens()
                            ├── src/services/greenLensApi.ts
                            └── src/services/childProfileApi.ts
```

The active app does **not** use React Router. Legacy router modules under `src/features/` and `src/pages/routes.tsx` remain but are not wired into `main.tsx`.

---

## API layers

**Child profile** — `src/services/childProfileApi.ts`

- `POST /child-profiles` → GreenLens backend (`../backend/`)
- Saves `childId` via `childProfileStorage.ts`

**App features** — `src/services/greenLensApi.ts`

- Endpoints: auth, scanner, quiz, game, TTS, user profile
- Falls back to in-browser mocks when the backend is unreachable or endpoint not implemented

---

## Folder structure

```
src/
├── App.tsx, main.tsx, index.css
├── assets/          # images, avatar layers
├── components/      # shared UI
├── features/        # feature modules (pages, components, hooks)
├── hooks/           # useGreenLens
├── layout/          # Layout, ProtectedRoute
├── pages/           # router configs (legacy)
├── redux/           # stores (legacy router path)
├── services/        # API clients
└── utils/           # constants, types, mappers
```

Backend lives in **`../backend/`** — not inside this frontend repo folder.

---

## Scripts

| Command         | Description                                        |
|-----------------|----------------------------------------------------|
| `npm run dev`   | Vite dev server (port 5173) — serves from `src/`   |
| `npm run build` | Production build → `dist/` (gitignored, regenerated) |

Static assets live in `src/assets/` — not in `dist/`. The `dist/` folder is build output only; do not commit it.

---

## Tech stack

- React 18, TypeScript, Vite 6
- Tailwind CSS 4
- Motion (animations)
