# GreenLens Kids — Frontend

Educational nature app for kids (React + TypeScript + Vite). UI originated from [Figma Make](https://www.figma.com/design/1sYDbNjAjMKxVlRv7MQpEv/Flutter-Frontend-Architecture-Design).

The frontend connects to the **GreenLens backend** (`../backend/`). Quiz, game, and AI Camera fall back to in-browser mocks when those endpoints are not available yet.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # optional — defaults to localhost:5001
npm run dev
```

### Local (PC / laptop)

Open **https://localhost:5173/** in your browser.

The dev server uses **HTTPS** (self-signed certificate via `@vitejs/plugin-basic-ssl`) and **`--host`** so other devices on the same Wi‑Fi can connect. Your browser may show a security warning on first visit — choose **Advanced → Proceed** to continue.

### Phone / tablet (same Wi‑Fi)

After `npm run dev`, the terminal prints a **Network** URL, for example:

```
➜  Network: https://192.168.1.150:5173/
```

On your phone, open that **https://** URL (not `http://`). Accept the certificate warning if prompted.

**AI Camera on mobile requires HTTPS.** Opening `http://192.168.x.x:5173` will block the camera; use upload from gallery instead, or switch to the HTTPS URL above.

---

## With local backend (BE team)

From the repo root, start the API via Docker (see `../backend/README.md`):

```bash
cd ../backend
docker compose up --build -d api
```

API listens at **http://localhost:5001**. Vite proxies these paths to that URL:

| Frontend path     | Proxied to (dev default)   |
|-------------------|----------------------------|
| `/child-profiles` | `http://localhost:5001`    |
| `/api/*`          | `http://localhost:5001`    |
| `/ai-camera/*`    | `http://localhost:5001`    |

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
                            ├── src/services/greenLens.ts
                            ├── src/services/childProfile.ts
                            └── src/services/aiCamera.ts
```

The active app does **not** use React Router. Legacy router modules under `src/features/` and `src/pages/routes.tsx` remain but are not wired into `main.tsx`.

Main screens (via bottom nav in `App.tsx`):

| Screen | Feature |
|--------|---------|
| 1 | Dashboard |
| 2 | AI Camera (`CameraModule`) — capture/upload, mascot + Web Speech TTS |
| 3 | Eco Quiz |
| 4 | Sort Game |
| 5 | Profile |

---

## API / service layers

**Child profile** — `src/services/childProfile.ts`

- `POST /child-profiles` → GreenLens backend (`../backend/`)
- Saves `childId` via `childProfileStorage.ts`

**App features** — `src/services/greenLens.ts`

- Endpoints: auth, scanner, quiz, game, user profile
- Falls back to in-browser mocks when the backend is unreachable or endpoint not implemented

**AI Camera** — `src/services/aiCamera.ts`

- `POST /ai-camera/analyze` — waste classification result
- Mock fallback in dev when backend is not ready
- Result UI: mascot guidance + browser Text-to-Speech (`src/utils/browserSpeech.ts`)

---

## Folder structure

```
src/
├── App.tsx, main.tsx, index.css
├── assets/          # images, avatar layers
├── components/      # shared UI
├── features/        # feature modules (pages, components, hooks)
│   └── camera/      # AI Camera (CameraModule, MascotGuidance, …)
├── hooks/           # useGreenLens, useSpeechSynthesis
├── layout/          # Layout, ProtectedRoute
├── pages/           # router configs (legacy)
├── redux/           # stores (legacy router path)
├── services/        # API clients (auth, greenLens, aiCamera, …)
└── utils/           # constants, types, browserSpeech, mappers
```

Backend lives in **`../backend/`** — not inside this frontend repo folder.

---

## Scripts

| Command         | Description |
|-----------------|-------------|
| `npm run dev`   | HTTPS Vite dev server on port **5173**, exposed on LAN (`--host`) |
| `npm run build` | Production build → `dist/` (gitignored, regenerated) |

Static assets live in `src/assets/` — not in `dist/`. The `dist/` folder is build output only; do not commit it.

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| Camera blocked on phone | Use **https://** Network URL from terminal, not http |
| Certificate warning | Expected in dev — proceed / trust for localhost or your LAN IP |
| Camera still fails | Use **gallery upload** (image button on camera screen) |
| 404 on `/api/*` in console | Backend route not implemented yet; app uses mock fallback |
| No TTS voice | Uses browser Web Speech API; try Chrome, or read text on screen |

---

## Tech stack

- React 18, TypeScript, Vite 6
- Tailwind CSS 4
- Motion (animations)
- Web Speech API (mascot voice guidance)
