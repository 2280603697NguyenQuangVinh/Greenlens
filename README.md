# GreenLens Kids

GreenLens Kids is an environmental education app for children. Kids create their own character, scan waste with an AI Camera, learn how to classify trash, complete quizzes, play mini games, and earn rewards for building green habits.

The goal of the project is to make environmental learning playful and continuous. A child character follows the player throughout the app, progress is tracked through `childId`, and the backend can link the profile silently with AWS Cognito and DynamoDB.

## Key Features

- Create a child profile and first character.
- Customize character gender, hair, eyes, outfit, and name.
- AI Camera flow for waste recognition and classification.
- Environmental education quizzes.
- Mini games for children.
- XP, level, streak, badges, and rewards.
- React web frontend and Expo/React Native mobile app.
- .NET 8 backend using a Clean Architecture/module-based structure.
- Planned AWS infrastructure: API Gateway, Lambda, DynamoDB, Cognito, S3, Rekognition, and Bedrock.

## Child Profile Creation Flow

```text
Child opens the app
-> Creates a character
-> Selects gender/hair/eyes/outfit
-> Enters character name
-> Confirms the character
-> Backend generates childId
-> Backend silently creates a child identity in Cognito
-> Backend saves the profile to DynamoDB
-> App stores childId for progress tracking
```

In the current local development mode, the backend uses in-memory storage for fast API testing. When real AWS configuration is enabled, the backend will call Cognito and DynamoDB.

## Project Structure

```text
Greenlens/
├── backend/
│   ├── datasets/
│   │   ├── raw/
│   │   ├── filtered/
│   │   ├── rejected_blurry/
│   │   ├── class-map.json
│   │   ├── labeling-guideline.md
│   │   ├── download_garbage_classification.py
│   │   ├── filter_clear_images.py
│   │   └── upload_to_s3.sh
│   ├── src/
│   │   ├── GreenLens.Api/
│   │   ├── GreenLens.Application/
│   │   ├── GreenLens.Domain/
│   │   ├── GreenLens.Infrastructure/
│   │   └── GreenLens.Shared/
│   ├── infrastructure/
│   │   ├── dynamodb/
│   │   ├── iam/
│   │   ├── s3/
│   │   └── serverless/
│   ├── docker/
│   ├── tests/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── serverless.yml
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── assets/
│   │   ├── features/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── shared/
│   │   ├── state/
│   │   └── styles/
│   ├── mobile/
│   ├── public/
│   ├── _ui-sample/
│   ├── guidelines/
│   ├── supabase/
│   ├── utils/
│   ├── dist/
│   ├── package.json
│   └── README.md
└── README.md
```

Notes:

- `frontend/node_modules/`, `frontend/mobile/node_modules/`, and `backend/datasets/.venv/` are dependency/local environment folders.
- `frontend/dist/` is the frontend build output.
- `backend/datasets/raw/`, `backend/datasets/filtered/`, and `backend/datasets/rejected_blurry/` contain data used by the AI/dataset pipeline.

## Tech Stack

Frontend web:

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Radix UI / shadcn-style components
- Lucide icons

Mobile:

- React Native
- Expo

Backend:

- .NET 8
- AWS Lambda-style API layer
- ASP.NET Core local host for Docker testing
- DynamoDB
- Cognito
- Serverless Framework
- Docker

Planned AWS services:

- API Gateway
- Lambda
- DynamoDB
- Cognito
- S3
- Rekognition
- Bedrock
- IAM

## Run Backend Locally

The backend has its own detailed guide:

```text
backend/README.md
```

Quick start:

```bash
cd backend
cp .env.example .env
docker compose up --build -d api
```

Local API URL:

```text
http://localhost:5001
```

Test child profile creation:

```http
POST http://localhost:5001/child-profiles
```

Request body:

```json
{
  "characterName": "Gau Xanh",
  "gender": "male",
  "hair": "hair_01",
  "eyes": "eyes_01",
  "outfit": "outfit_01",
  "avatarPreview": "character_preview_01"
}
```

Stop the backend:

```bash
docker compose down
```

## Run Full Stack With Docker

From the repo root:

```bash
cp backend/.env.example backend/.env
docker compose up --build -d
```

Open the web app:

```text
http://localhost:3000
```

Local API and Swagger are still exposed separately:

```text
http://localhost:5001
http://localhost:5001/swagger/index.html
```

In the full-stack Docker setup, the frontend is served by Nginx and proxies these paths to the backend container:

```text
/auth
/child-profiles
/ai-camera
/quiz
/mini-games
/users
/api
```

Stop the full stack:

```bash
docker compose down
```

## AI Camera Dataset

The dataset folder is located at:

```text
backend/datasets/
```

Purpose:

- Store waste classification datasets.
- Download garbage classification datasets.
- Filter clear images and reject blurry/low-quality images.
- Generate manifests for Rekognition Custom Labels.
- Upload processed datasets to S3.

Important files:

```text
backend/datasets/README.md
backend/datasets/class-map.json
backend/datasets/labeling-guideline.md
backend/datasets/download_garbage_classification.py
backend/datasets/download_garbage_classification.sh
backend/datasets/filter_clear_images.py
backend/datasets/sample-manifest.json
backend/datasets/upload_to_s3.sh
backend/datasets/requirements.txt
```

Data folders:

```text
backend/datasets/raw/
backend/datasets/filtered/
backend/datasets/rejected_blurry/
```

Folder meanings:

- `raw/`: original downloaded dataset.
- `filtered/`: filtered images and generated manifests.
- `rejected_blurry/`: images rejected because of blur or poor quality.

For more details, see:

```text
backend/datasets/README.md
```

## Run Web Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite will print the local development URL in the terminal, usually:

```text
http://localhost:5173
```

## Run Mobile App

```bash
cd frontend/mobile
npm install
npx expo start
```

## Current Project Status

- Web frontend includes UI and mock APIs for the main modules.
- Mobile app has an Expo/React Native scaffold.
- Backend has a module-based structure.
- Backend includes a dataset pipeline in `backend/datasets/` for AI Camera/Rekognition work.
- `POST /child-profiles` can run locally with Docker.
- Local backend currently uses in-memory storage unless `USE_IN_MEMORY_CHILD_PROFILES` is disabled.
- Backend README includes detailed instructions for running and testing the API.

## Development Notes

- Use `backend/README.md` for backend setup and API testing.
- Use `frontend/README.md` for web/mobile frontend setup.
- Do not commit `.env` files.
- The local backend uses port `5001` because port `5000` can be occupied by macOS system services.
- To use real AWS services, configure AWS credentials, Cognito User Pool, DynamoDB table, and IAM permissions.

## Next Steps

- Connect the frontend create-character screen to `POST /child-profiles`.
- Switch backend local persistence from in-memory storage to DynamoDB Local or real DynamoDB depending on the environment.
- Add an API to fetch a child profile by `childId`.
- Add APIs to update XP, level, streak, and rewards.
- Complete the AI Camera flow with S3 and Rekognition.
- Add backend unit and integration tests.
