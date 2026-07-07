# GreenLens Kids

GreenLens Kids is an environmental education project for children. The product combines a playful character-driven experience with AI-assisted waste classification, quizzes, mini-games, streaks, rewards, and an internal admin panel for operations.

The project currently includes:

- a web app for children
- a separate admin web
- a .NET 8 backend API
- Docker-based local development
- AWS-oriented infrastructure for deployment and operations

## What The Project Does

GreenLens helps children learn green habits through interactive activities:

- Create and customize a child character
- Track progress with `childId`
- Scan trash with AI Camera
- Learn waste categories with guided feedback
- Answer environmental quizzes
- Play mini-games
- Earn XP, levels, streaks, badges, and rewards

For operators and maintainers, the project also includes an admin web for:

- viewing overall system usage
- managing child profiles
- reviewing quiz fallback content
- monitoring quiz pool and mini-game content

## Main Modules

### Child App

- Authentication and session handling
- Avatar creation and profile setup
- Dashboard and leaderboard
- AI Camera
- Quiz
- Mini-games
- Streak / rewards

### Admin Web

- Overview dashboard
- Child profile management
- Quiz fallback management
- Quiz pool monitoring
- Mini-game item management

### Backend API

- Auth endpoints
- Child profile APIs
- AI Camera APIs
- Quiz generation and completion APIs
- Mini-game APIs
- Admin APIs

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Radix UI / shadcn-style components
- Lucide icons

### Mobile

- React Native
- Expo

### Backend

- .NET 8
- ASP.NET Core minimal APIs for local runtime
- AWS Lambda-style handlers for deployment
- DynamoDB
- Cognito
- S3
- Rekognition
- Bedrock

### DevOps / Infra

- Docker / Docker Compose
- Serverless Framework
- CloudWatch
- SNS

## Repository Structure

```text
Greenlens/
├── backend/                    # .NET 8 API, Lambda handlers, serverless config
├── frontend/                   # React web app + separate admin web build
├── docs/                       # Project and architecture documents
├── docker-compose.yml          # Full local stack
└── README.md
```

Useful subfolders:

```text
backend/src/GreenLens.Api/      # API entrypoints, auth, admin APIs
backend/src/GreenLens.Application/
backend/src/GreenLens.Domain/
backend/src/GreenLens.Infrastructure/
backend/serverless.yml          # AWS deployment + alarms/dashboard
frontend/src/                   # Main web app source
frontend/src/admin/             # Admin web source
frontend/Dockerfile             # Child web image
frontend/Dockerfile.admin       # Admin web image
```

## Local URLs

When the project is running locally with Docker:

- Child web: `http://localhost:3000`
- Admin web: `http://localhost:3001`
- Backend API: `http://localhost:5001`
- Swagger: `http://localhost:5001/swagger/index.html`

## Prerequisites

Make sure you have:

- Docker Desktop
- Git

Optional for non-Docker workflows:

- Node.js 20+
- npm
- .NET 8 SDK

## Quick Start

### 1. Prepare environment

The root Docker stack reads backend environment variables from:

`backend/.env`

If you already have that file, you can keep using it. If not, create it based on your backend setup.

### 2. Run the full stack

From the repository root:

```bash
docker compose up --build -d
```

### 3. Verify containers

```bash
docker compose ps
```

You should see these services running:

- `api`
- `frontend`
- `admin-web`

### 4. Open the applications

- Child web: `http://localhost:3000`
- Admin web: `http://localhost:3001`
- Swagger: `http://localhost:5001/swagger/index.html`

## Stop The Project

```bash
docker compose down
```

## Rebuild After Source Changes

If you changed UI or backend code and want fresh images:

```bash
docker compose down --rmi local
docker compose up --build -d
```

## Admin Login In Local Docker

The local Docker setup currently uses in-memory auth for development and seeds a default admin account.

Default admin credentials:

- username: `admin`
- password: `Admin@123`

Admin login page:

- `http://localhost:3001`

Notes:

- This is for local development only
- In production, admin access should come from Cognito group-based authorization

## Running Individual Services

### Run only backend

```bash
docker compose up --build -d api
```

### Run only admin web and backend

```bash
docker compose up --build -d api admin-web
```

### Run only child web and backend

```bash
docker compose up --build -d api frontend
```

## How Local Routing Works

In Docker local mode:

- `frontend` serves the child-facing web on port `3000`
- `admin-web` serves the admin UI on port `3001`
- `api` serves the backend on port `5001`

The frontend containers use Nginx and proxy API requests to the backend container.

Important proxied paths include:

- `/auth`
- `/child-profiles`
- `/ai-camera`
- `/quiz`
- `/mini-games`
- `/users`
- `/api`
- `/admin` for admin API routes

## Key Backend Capabilities

### Authentication

- Local development can use in-memory auth
- AWS deployment uses Cognito
- Admin APIs require admin authorization

### AI Camera

- Upload and analyze waste images
- Uses Rekognition and Bedrock-oriented backend services
- Includes quota and guardrails for usage

### Quiz

- Generate quiz sessions
- Store quiz sessions
- Support fallback quiz content
- Support quiz pool / refill flow

### Mini-games

- Trash sort gameplay support
- Score submission
- High-score tracking

### Admin

- Overview metrics
- Child profile actions
- Quiz fallback CRUD
- Quiz pool monitoring
- Mini-game item management

## AWS / Deployment Notes

The backend is prepared for AWS deployment through:

- `backend/serverless.yml`

Operational features already described in the backend include:

- CloudWatch Logs
- CloudWatch Metrics
- CloudWatch Dashboard
- CloudWatch Alarms
- SNS email alerts

The admin web and child web are currently easy to run locally with Docker, and are suitable to deploy separately as static frontends.

For the next deployment step, use Amplify Hosting with two separate frontend apps:

- child web
- admin web

Deployment docs:

- [docs/deployment/amplify-deployment-guide.md](/Users/nguyenquangvinh/Documents/Greenlens/docs/deployment/amplify-deployment-guide.md)
- [docs/deployment/github-pages-note.md](/Users/nguyenquangvinh/Documents/Greenlens/docs/deployment/github-pages-note.md)

## Useful Commands

### View logs

```bash
docker compose logs -f
```

### View backend logs only

```bash
docker compose logs -f api
```

### View admin web logs only

```bash
docker compose logs -f admin-web
```

### View child web logs only

```bash
docker compose logs -f frontend
```

## Related Documents

- [backend/README.md](/Users/nguyenquangvinh/Documents/Greenlens/backend/README.md)
- [frontend/README.md](/Users/nguyenquangvinh/Documents/Greenlens/frontend/README.md)
- [docs/greenlens-project-overview.md](/Users/nguyenquangvinh/Documents/Greenlens/docs/greenlens-project-overview.md)
- [docs/architecture/greenlens-aws-architecture.md](/Users/nguyenquangvinh/Documents/Greenlens/docs/architecture/greenlens-aws-architecture.md)

## Notes For Contributors

- The project has both child-facing and admin-facing web flows
- Local Docker is the fastest way to run the full system
- Some AWS-backed features depend on the values inside `backend/.env`
- For admin UI local testing, use the seeded dev admin account unless you switch back to Cognito auth

## Current Recommended Local Workflow

1. Pull latest code
2. Run:

```bash
docker compose up --build -d
```

3. Open:
   - `http://localhost:3000`
   - `http://localhost:3001`
4. If images feel stale after major UI/backend updates:

```bash
docker compose down --rmi local
docker compose up --build -d
```

That is the quickest path for a new user or teammate to bring the project up locally.
