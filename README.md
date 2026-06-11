# GreenLens Kids

GreenLens Kids la ung dung giao duc moi truong danh cho tre em. Tre tao nhan vat rieng, quet/rac bang AI Camera, hoc phan loai rac, lam quiz, choi mini game va nhan thuong khi duy tri thoi quen xanh.

Muc tieu cua du an la bien viec hoc ve moi truong thanh mot trai nghiem nhe nhang, vui va co tinh lien tuc: nhan vat di cung tre trong app, tien trinh duoc luu bang `childId`, va he thong backend co the lien ket ngam voi AWS Cognito/DynamoDB.

## Tinh nang chinh

- Tao ho so tre va nhan vat ban dau.
- Tuy bien nhan vat: gioi tinh, toc, mat, trang phuc, ten nhan vat.
- AI Camera cho bai toan nhan dien/phan loai rac.
- Quiz giao duc ve moi truong.
- Mini games cho tre em.
- XP, level, streak, badges va rewards.
- Frontend web React va mobile Expo/React Native.
- Backend .NET 8 theo Clean Architecture/module-based structure.
- Ha tang AWS du kien: API Gateway, Lambda, DynamoDB, Cognito, S3, Rekognition, Bedrock.

## Luong tao ho so tre

```text
Tre mo app
-> Tao nhan vat
-> Chon gender/hair/eyes/outfit
-> Nhap ten nhan vat
-> Bam xac nhan
-> Backend tao childId
-> Backend tao child identity ngam trong Cognito
-> Backend luu profile vao DynamoDB
-> App luu childId de theo doi tien trinh choi/hoc
```

Trong che do local hien tai, backend dung in-memory storage de test nhanh API. Khi cau hinh AWS that, backend se goi Cognito va DynamoDB.

## Cau truc thu muc

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

Ghi chu:

- `frontend/node_modules/`, `frontend/mobile/node_modules/`, `backend/datasets/.venv/` la thu muc dependency/local environment.
- `frontend/dist/` la output build cua frontend.
- `backend/datasets/raw/`, `backend/datasets/filtered/`, `backend/datasets/rejected_blurry/` chua du lieu xu ly cho AI/dataset pipeline.

## Tech stack

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
- AWS Lambda style API layer
- ASP.NET Core local host for Docker testing
- DynamoDB
- Cognito
- Serverless Framework
- Docker

AWS services du kien:

- API Gateway
- Lambda
- DynamoDB
- Cognito
- S3
- Rekognition
- Bedrock
- IAM

## Chay backend local

Backend co README rieng tai:

```text
backend/README.md
```

Chay nhanh:

```bash
cd backend
cp .env.example .env
docker compose up --build -d api
```

API local:

```text
http://localhost:5001
```

Test tao ho so tre:

```http
POST http://localhost:5001/child-profiles
```

Body:

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

Dung backend:

```bash
docker compose down
```

## Dataset cho AI Camera

Thu muc dataset nam tai:

```text
backend/datasets/
```

Muc dich:

- Luu dataset phan loai rac.
- Tai dataset garbage classification.
- Loc anh ro/loai anh mo.
- Tao manifest cho Rekognition Custom Labels.
- Upload dataset da xu ly len S3.

Mot so file quan trong:

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

Thu muc du lieu:

```text
backend/datasets/raw/
backend/datasets/filtered/
backend/datasets/rejected_blurry/
```

Trong do:

- `raw/`: dataset goc tai ve.
- `filtered/`: anh da loc va manifest sinh ra.
- `rejected_blurry/`: anh bi loai do mo/chat luong kem.

Doc them huong dan rieng tai:

```text
backend/datasets/README.md
```

## Chay frontend web

```bash
cd frontend
npm install
npm run dev
```

Mac dinh Vite se in ra URL local trong terminal, thuong la:

```text
http://localhost:5173
```

## Chay mobile app

```bash
cd frontend/mobile
npm install
npx expo start
```

## Trang thai hien tai

- Frontend web da co UI va mock API cho cac module chinh.
- Mobile app co scaffold Expo/React Native.
- Backend da co cau truc module-based.
- Backend co dataset pipeline trong `backend/datasets/` cho AI Camera/Rekognition.
- API `POST /child-profiles` da chay duoc local bang Docker.
- Local backend dang dung in-memory storage, chua ghi AWS neu chua tat `USE_IN_MEMORY_CHILD_PROFILES`.
- README backend da co huong dan chi tiet de chay va test API.

## Ghi chu phat trien

- Dung `backend/README.md` khi can chay/test backend.
- Dung `frontend/README.md` khi can chay web/mobile frontend.
- Khong commit file `.env`.
- Port backend local dang dung `5001` vi `5000` co the bi service he thong tren macOS chiem.
- Khi chuyen sang AWS that, can cau hinh credentials, Cognito User Pool, DynamoDB table va IAM permissions.

## Dinh huong tiep theo

- Ket noi frontend create-character screen voi `POST /child-profiles`.
- Chuyen backend local tu in-memory sang DynamoDB local hoac DynamoDB AWS tuy moi truong.
- Them API lay profile theo `childId`.
- Them API cap nhat XP, level, streak, rewards.
- Hoan thien AI Camera flow voi S3/Rekognition.
- Them unit/integration tests cho backend.
