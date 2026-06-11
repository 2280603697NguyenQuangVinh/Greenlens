# GreenLens Backend

Backend cua GreenLens Kids duoc xay bang .NET 8, chay duoc theo 2 che do:

- Local development bang Docker, dung in-memory storage de test nhanh API.
- AWS deployment, dung Cognito va DynamoDB that.

## Yeu cau cai dat

Can co:

- Docker Desktop
- Git
- Postman hoac curl

Khong bat buoc cai `.NET SDK` tren may neu chay bang Docker.

## Cau truc chinh

```text
backend/
├── src/
│   ├── GreenLens.Api/
│   ├── GreenLens.Application/
│   ├── GreenLens.Domain/
│   ├── GreenLens.Infrastructure/
│   └── GreenLens.Shared/
├── infrastructure/
├── tests/
├── Dockerfile
├── docker-compose.yml
├── serverless.yml
└── README.md
```

## Chay backend local

Di vao thu muc backend:

```bash
cd backend
```

Tao file `.env` tu file mau neu chua co:

```bash
cp .env.example .env
```

Build va chay API:

```bash
docker compose up --build -d api
```

Kiem tra container:

```bash
docker compose ps
```

Neu chay thanh cong, API se lang nghe tai:

```text
http://localhost:5001
```

Xem log:

```bash
docker compose logs -f api
```

Dung API:

```bash
docker compose down
```

## Luu y ve port

Backend local dang map:

```text
localhost:5001 -> container:80
```

Port `5000` khong dung vi tren macOS co the bi service he thong chiem.

## Test API tao ho so tre

Endpoint:

```http
POST http://localhost:5001/child-profiles
```

Header:

```http
Content-Type: application/json
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

Response thanh cong:

```http
201 Created
```

Response mau:

```json
{
  "childId": "child_8f3a2c918d4b4f7db2f09a2c2d11f123",
  "cognitoSub": "local-cognito-sub-child_8f3a2c918d4b4f7db2f09a2c2d11f123",
  "characterName": "Gau Xanh",
  "gender": "male",
  "hair": "hair_01",
  "eyes": "eyes_01",
  "outfit": "outfit_01",
  "avatarPreview": "character_preview_01",
  "xp": 0,
  "level": 1,
  "streak": 0,
  "badges": [],
  "rewards": [],
  "createdAt": "2026-05-30T10:00:00Z",
  "updatedAt": "2026-05-30T10:00:00Z"
}
```

## Che do local hien tai

Trong `docker-compose.yml`, backend dang bat:

```yaml
USE_IN_MEMORY_CHILD_PROFILES=true
```

Voi che do nay:

- Khong can AWS credentials.
- Khong goi Cognito AWS.
- Khong ghi DynamoDB AWS.
- Profile chi duoc luu tam trong RAM cua container.
- Restart container se mat du lieu.

Xoa du lieu local in-memory:

```bash
docker compose restart api
```

Hoac xoa container va tao lai:

```bash
docker compose down
docker compose up -d api
```

## Test loi validate

Thieu field se tra ve:

```http
400 Bad Request
```

Vi du body sai:

```json
{
  "characterName": "",
  "gender": "male"
}
```

## Chuyen sang dung AWS that

Khi muon tao child account that trong Cognito va luu DynamoDB AWS:

1. Sua `docker-compose.yml`:

```yaml
USE_IN_MEMORY_CHILD_PROFILES=false
```

2. Cap nhat `.env`:

```env
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_REGION=ap-southeast-1
COGNITO_USER_POOL_ID=your_user_pool_id_here
CHILD_PROFILES_TABLE_NAME=GreenLens-ChildProfiles
```

3. Dam bao AWS IAM co quyen:

```text
dynamodb:PutItem
cognito-idp:AdminCreateUser
```

4. Dam bao DynamoDB table da ton tai:

```text
Table name: GreenLens-ChildProfiles
Primary key: childId (String)
```

5. Chay lai backend:

```bash
docker compose up --build -d api
```

## DynamoDB schema

Table:

```text
GreenLens-ChildProfiles
```

Primary key:

```text
childId: String
```

Attributes:

```text
childId: String
cognitoSub: String
characterName: String
gender: String
hair: String
eyes: String
outfit: String
avatarPreview: String
xp: Number
level: Number
streak: Number
badges: List
rewards: List
createdAt: String
updatedAt: String
```

Recommended GSI:

```text
Index name: GSI-cognitoSub
Partition key: cognitoSub
```

## Build kiem tra trong Docker

Lenh nay se build/publish project .NET ben trong Docker:

```bash
docker compose build api
```

Neu build thanh cong, image `greenlens-api:latest` se duoc tao.

## Cac lenh hay dung

```bash
docker compose up --build -d api
docker compose ps
docker compose logs -f api
docker compose restart api
docker compose down
```
