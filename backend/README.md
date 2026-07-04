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

Swagger UI:

```text
http://localhost:5001/swagger/index.html
```

Trong Swagger UI, bam nut `Authorize`, dan access token vao o Bearer de test cac API can xac thuc. Chi dan token, khong can tu go chu `Bearer`.

Xem log:

```bash
docker compose logs -f api
```

## Chay full stack BE + FE bang Docker

Tu thu muc root `Greenlens/`:

```bash
docker compose up --build -d
```

Sau khi chay:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:5001
Swagger:  http://localhost:5001/swagger/index.html
```

Frontend Docker dung Nginx va proxy cac route `/auth`, `/child-profiles`, `/ai-camera`, `/quiz`, `/mini-games`, `/users`, `/api` sang container backend `api`.

## S3 lifecycle cho AI Camera

Anh upload cua AI Camera duoc luu duoi prefix:

```text
uploads/yyyy/MM/dd/
```

Bucket S3 nen co lifecycle rule xoa prefix `uploads/` sau 1 ngay de tranh luu anh test qua lau. Chay lenh sau de ap dung rule cho bucket trong `AI_CAMERA_BUCKET_NAME`:

```bash
./scripts/configure-ai-camera-s3-lifecycle.sh
```

Rule nay khong anh huong Rekognition trong request hien tai, vi backend da doc anh vao memory de upload S3 va goi Rekognition truoc khi object het han.

## Backup du lieu

Thiet lap backup dang dung:

- DynamoDB user/app data:
  - Bat Point-in-Time Recovery cho `GreenLens-ChildProfiles`.
  - Bat Point-in-Time Recovery cho `GreenLens-MiniGameResults`.
  - Bat Point-in-Time Recovery cho `GreenLens-MiniGameItems`.
  - Bat Point-in-Time Recovery cho `GreenLens-QuizFallbacks`.
  - Script cung co gang bat PITR cho cac bang that trong `.env`: classifications, quiz history, daily activities neu chung ton tai.
- DynamoDB transient data:
  - `GreenLens-AiUsage` va `GreenLens-QuizSessions` la quota/session co TTL, khong backup dai han.
- S3:
  - Prefix `uploads/` cua AI Camera van xoa sau 1 ngay de tranh luu anh tre em/test image qua lau.
  - Prefix `mini-games/trash-sort/icons/` bat S3 versioning. File icon hien tai duoc giu, version cu se duoc don sau 90 ngay.

Ap dung backup len AWS that:

```bash
./scripts/configure-data-backups.sh
```

Ve dataset Rekognition:

- Hien tai app dang dung Amazon Rekognition `DetectLabels`, khong train custom model.
- Vi vay chua co dataset rieng de backup cho Rekognition.
- Neu sau nay chuyen sang Amazon Rekognition Custom Labels, can backup dataset anh da label rieng trong S3, manifest/train-test split, model version ARN va metadata training.

## Security va cost guard cho AI Camera

AI Camera co 2 lop chong spam:

- AWS WAF trong `serverless.yml` de rate limit API Gateway theo IP.
- DynamoDB quota trong backend de gioi han theo `cognitoSub` + `childId`.

Mac dinh local/dev:

```env
AI_CAMERA_USAGE_LIMITER_ENABLED=true
AI_CAMERA_USAGE_TABLE_NAME=GreenLens-AiUsage
AI_CAMERA_PER_MINUTE_LIMIT=3
AI_CAMERA_DAILY_LIMIT=20
REKOGNITION_TIMEOUT_SECONDS=5
REKOGNITION_CIRCUIT_FAILURE_THRESHOLD=3
REKOGNITION_CIRCUIT_BREAK_SECONDS=60
```

Neu vuot quota, API tra ve:

```http
429 Too Many Requests
```

Bang `GreenLens-AiUsage` dung TTL `expiresAt` de tu don counter cu. Tao bang bang CloudFormation khi deploy `serverless.yml`, hoac tao bang that tren AWS neu test local voi DynamoDB that.

AI Camera guidance goi Bedrock that truoc, fallback chi dung khi Bedrock loi, bi quota/throttle, timeout hoac tra ve JSON khong hop le:

```env
BEDROCK_MODEL_ID=apac.amazon.nova-micro-v1:0
BEDROCK_MAX_TOKENS=180
BEDROCK_TIMEOUT_SECONDS=12
AI_CAMERA_GUIDANCE_FALLBACK_ENABLED=true
AI_CAMERA_SKIP_BEDROCK_WHEN_FALLBACK_ENABLED=false
```

Neu can demo nhanh khong ton Bedrock, moi doi `AI_CAMERA_SKIP_BEDROCK_WHEN_FALLBACK_ENABLED=true`.

Neu Rekognition timeout hoac tam thoi khong kha dung, backend khong upload S3, khong goi Bedrock va khong cong XP. API tra ve:

```http
503 Service Unavailable
Retry-After: 60
```

```json
{
  "message": "Dịch vụ nhận diện ảnh đang bận. Hãy thử lại sau ít phút.",
  "reason": "rekognition_unavailable",
  "retryAfterSeconds": 60
}
```

Anh khong phai rac se bi chan sau buoc Rekognition va truoc khi upload S3/goi Bedrock. API tra ve:

```http
422 Unprocessable Entity
```

```json
{
  "message": "Hình ảnh không phải rác hoặc chưa đủ rõ để phân loại.",
  "reason": "not_waste_image",
  "detectedLabel": "Body Part",
  "confidence": 100
}
```

Fallback guidance khong co gang liet ke tat ca vat the. Backend dung 3 tang:

- Safety fallback: pin, thuoc, kim tiem, hoa chat, thuy tinh, dao/luoi dao, bong den, nhiet ke, do dien tu... luon huong dan nho nguoi lon xu ly.
- Object fallback: giay, chai, tui nhua, lon, rac huu co, ta/giay ban... co goi y cu the hon.
- Category fallback: neu label la vat la, backend van dua huong dan theo `Recyclable`, `Organic`, `Hazardous`, hoac `Non-Recyclable`.

## Infrastructure & Operations

`serverless.yml` thiet lap them cac dich vu van hanh:

- CloudWatch Logs:
  - Lambda log retention mac dinh 14 ngay qua `CLOUDWATCH_LOG_RETENTION_DAYS`.
  - API Gateway access/execution logs bat o muc `INFO`.
- CloudWatch Metrics:
  - Dashboard `GreenLens-{stage}-Operations`.
  - Theo doi Lambda `Errors`, `Duration`, `Invocations`.
  - Theo doi WAF `BlockedRequests`.
- CloudWatch Alarms:
  - AI Camera errors.
  - AI Camera duration > 25 giay.
  - Quiz generate errors.
  - Mini game result errors.
- AWS SNS:
  - Topic `GreenLens-OperationsAlerts-{stage}` nhan alarm action.
  - Neu dat `OPERATIONS_ALERT_EMAIL`, CloudFormation tao email subscription va AWS se gui mail de confirm.

Vi du deploy co email canh bao:

```bash
OPERATIONS_ALERT_EMAIL=your_email@example.com serverless deploy --stage dev
```

Sau deploy, vao email va bam confirm subscription thi moi nhan duoc canh bao SNS.

## Quiz API

Tat ca API Quiz can header:

```http
Authorization: Bearer <access_token>
```

Tao quiz 3 cau hoi, moi cau 4 lua chon:

```http
POST http://localhost:5001/quiz/generate
```

```json
{
  "childId": "child_..."
}
```

Response gom `gameType`, `targetAge`, `sessionId`, `questions` va `usedFallback`. `targetAge` la do tuoi random tu 6-12 de tao noi dung quiz, khong phai tuoi that trong profile. Backend uu tien lay mot bo quiz tu pool global 5 bo trong DynamoDB `GreenLens-QuizPool` de response nhanh; moi child chi luu tien do da lam bo nao. Neu child da lam gan het pool hoac pool chua co, backend tra fallback 4 lua chon ngay va trigger refill ngam de Bedrock tao lo 5 bo global moi cho lan sau.

Response mau:

```json
{
  "sessionId": "quiz_...",
  "childId": "child_...",
  "gameType": "quiz",
  "wasteType": "recyclable",
  "targetAge": 9,
  "questions": [],
  "usedFallback": true
}
```

Lay lai session dang lam do:

```http
GET http://localhost:5001/quiz/sessions/{sessionId}
```

Hoan thanh quiz va cong XP:

```http
POST http://localhost:5001/quiz/complete
```

```json
{
  "sessionId": "quiz_...",
  "childId": "child_...",
  "correctAnswers": 2,
  "totalQuestions": 3
}
```

XP quiz:

- Cau dung: 10 XP.
- Cau sai: 5 XP.
- Dung 3/3 trong mot lan quiz: them badge `Thiên tài quiz`.

Response mau:

```json
{
  "sessionId": "quiz_...",
  "gameType": "quiz",
  "score": 20,
  "correctAnswers": 2,
  "totalQuestions": 3,
  "xpAwarded": 25,
  "status": "Completed"
}
```

## Mini Game API

Tat ca API Mini Game can header:

```http
Authorization: Bearer <access_token>
```

Lay 6 vat rac random va danh sach thung rac cho mot luot game keo tha:

```http
GET http://localhost:5001/mini-games/trash-sort/items
```

Response mau:

```json
{
  "items": [
    {
      "itemId": "banana_peel",
      "name": "Vỏ chuối",
      "category": "Organic",
      "binColor": "Brown",
      "iconUrl": "https://greenlens-storage1.s3.ap-southeast-1.amazonaws.com/mini-games/trash-sort/icons/banana.svg",
      "difficulty": "easy"
    }
  ],
  "bins": [
    {
      "category": "Recyclable",
      "binColor": "Green",
      "label": "Tái chế"
    },
    {
      "category": "Organic",
      "binColor": "Brown",
      "label": "Hữu cơ"
    },
    {
      "category": "Hazardous",
      "binColor": "Red",
      "label": "Nguy hại"
    }
  ]
}
```

Moi lan FE goi lai endpoint nay, backend lay ngau nhien 6 item moi tu DynamoDB. Neu du du lieu, backend uu tien chia deu 3 nhom: 2 tai che, 2 huu co, 2 nguy hai, sau do shuffle thu tu hien thi.

Seed OpenMoji SVG len S3 va metadata vao DynamoDB:

```bash
./scripts/seed-trash-sort-items.sh
```

Script nay doc `.env`, tao table `GreenLens-MiniGameItems` neu chua co, upload SVG vao S3 prefix `mini-games/trash-sort/icons/`, va insert metadata item. Bo seed hien co 36 item: 12 huu co, 12 tai che, 12 nguy hai.

Cho phep FE doc icon SVG tu S3 prefix mini game:

```bash
./scripts/configure-trash-sort-icons-public-read.sh
```

Script nay chi mo public read cho:

```text
s3://<bucket>/mini-games/trash-sort/icons/*
```

Khong mo public read cho prefix upload anh AI Camera.

Gui ket qua mini game keo tha rac:

```http
POST http://localhost:5001/mini-games/trash-sort/results
```

Request:

```json
{
  "childId": "child_...",
  "correctCount": 10,
  "wrongCount": 2,
  "durationSeconds": 60,
  "completedFromDailyActivity": false
}
```

Backend tu tinh diem:

```text
score = max(correctCount * 10 - wrongCount * 5, 0)
```

XP:

- Score tren 80: 20 XP.
- Score tu 80 tro xuong: 10 XP.
- Score tren 80 mo badge `Rác Kỳ Thủ`.

Response mau:

```json
{
  "resultId": "minigame_...",
  "childId": "child_...",
  "gameType": "trash_sort",
  "score": 90,
  "correctCount": 10,
  "wrongCount": 2,
  "durationSeconds": 60,
  "xpAwarded": 20,
  "isPersonalBest": true,
  "unlockedBadges": ["Rác Kỳ Thủ"],
  "dailyActivityUpdated": false,
  "createdAt": "2026-06-20T08:00:00Z"
}
```

Ket qua duoc luu vao DynamoDB table `GreenLens-MiniGameResults`. `dailyActivityUpdated` hien tam thoi la `false`; khi lam Daily Activity API thi se noi tiep flag nay.

## Profile API

Tat ca API profile can header:

```http
Authorization: Bearer <access_token>
```

Lay profile hien tai cua tre:

```http
GET http://localhost:5001/child-profiles/{childId}
```

Response gom XP, level, tien do len level, cac moc XP, streak, `badges` da mo khoa, `badgeCatalog` de hien thi ca badge da mo khoa va chua mo khoa:

```json
{
  "childId": "child_...",
  "cognitoSub": "f99ad55c-f081-70ed-66dc-ed3e8abcf6fd",
  "characterName": "Be Xanh",
  "gender": "male",
  "hair": "hair_01",
  "eyes": "eyes_01",
  "outfit": "outfit_01",
  "avatarPreview": "character_preview_01",
  "xp": 80,
  "level": 2,
  "levelProgress": {
    "currentLevel": 2,
    "currentLevelXp": 50,
    "nextLevel": 3,
    "nextLevelXp": 120,
    "xpIntoCurrentLevel": 30,
    "xpToNextLevel": 40,
    "progressPercent": 43
  },
  "levelMilestones": [
    { "level": 1, "requiredXp": 0 },
    { "level": 2, "requiredXp": 50 },
    { "level": 3, "requiredXp": 120 },
    { "level": 4, "requiredXp": 220 },
    { "level": 5, "requiredXp": 350 },
    { "level": 6, "requiredXp": 520 },
    { "level": 7, "requiredXp": 750 },
    { "level": 8, "requiredXp": 1050 },
    { "level": 9, "requiredXp": 1450 },
    { "level": 10, "requiredXp": 2000 }
  ],
  "streak": 0,
  "badges": ["Thiên tài quiz"],
  "badgeCatalog": [
    {
      "code": "first_scan",
      "name": "First Scan",
      "description": "Chup va phan loai rac thanh cong lan dau tien.",
      "unlockCondition": "Phan loai thanh cong vat dau tien bang AI Camera.",
      "isUnlocked": false,
      "progressCurrent": 0,
      "progressTarget": 1
    },
    {
      "code": "quiz_genius",
      "name": "Thiên tài quiz",
      "description": "Tra loi dung tat ca cau hoi trong mot lan quiz.",
      "unlockCondition": "Tra loi dung 3/3 cau trong mot lan quiz.",
      "isUnlocked": true,
      "progressCurrent": 3,
      "progressTarget": 3
    }
  ],
  "rewards": [],
  "createdAt": "2026-06-13T06:42:08Z",
  "updatedAt": "2026-06-18T07:08:31Z"
}
```

Nguoi dung chi doc duoc profile thuoc dung `cognitoSub` trong access token. Neu token khac chu profile, API tra ve `403 Forbidden`.

Lay rieng streak de FE hien thi streak card:

```http
GET http://localhost:5001/child-profiles/{childId}/streak
```

Response mau:

```json
{
  "childId": "child_...",
  "currentStreak": 12,
  "targetStreakDays": 30,
  "daysToStreak30": 18,
  "progressPercent": 40,
  "isStreak30Unlocked": false,
  "lastStreakDate": "2026-06-23",
  "maxFreezeDays": 2,
  "freezeDaysUsed": 0,
  "freezeDaysRemaining": 2,
  "missedDaysCoveredByFreeze": 0,
  "streakStatus": "ActiveToday",
  "badge": {
    "code": "streak_30_days",
    "name": "Streak 30 ngày",
    "description": "Hoan thanh hoat dong moi ngay trong 30 ngay lien tiep.",
    "unlockCondition": "Hoan thanh daily activity 30 ngay lien tiep.",
    "isUnlocked": false,
    "progressCurrent": 12,
    "progressTarget": 30
  }
}
```

Ghi nhan streak cho ngay hien tai:

```http
POST http://localhost:5001/child-profiles/{childId}/streak/check-in
Authorization: Bearer <access_token>
```

Khong can body. Backend dung ngay Viet Nam (`Asia/Ho_Chi_Minh`) de tinh streak:

- Lan dau check-in: `currentStreak = 1`, `streakStatus = Started`.
- Check-in ngay hom sau: streak tang 1, `streakStatus = Continued`.
- Nghi 1-2 ngay roi quay lai: streak van duoc noi tiep, `streakStatus = FreezeUsed`, `missedDaysCoveredByFreeze` la so ngay da duoc dong bang.
- Nghi qua 2 ngay: streak reset ve 1, `streakStatus = Reset`.
- Goi lai check-in trong cung ngay: khong cong them, `streakStatus = AlreadyCheckedIn`.

## XP va badge hien tai

Da thiet lap trong backend:

- AI Camera phan loai thanh cong: 15 XP moi lan.
- Quiz: cau dung 10 XP, cau sai 5 XP.
- Mini game keo tha rac: score tren 80 duoc 20 XP, score tu 80 tro xuong duoc 10 XP.
- Badge `First Scan`: lan dau tien AI Camera phan loai thanh cong.
- Badge `Streak 30 ngày`: hoan thanh daily activity 30 ngay lien tiep.
- Badge `Thiên tài quiz`: dung 3/3 cau trong mot lan quiz.
- Badge `Rác Kỳ Thủ`: dat tren 80 diem trong mini game keo tha rac.
- Badge `Vô địch mini game`: dat hang nhat tren bang xep hang tong hop quiz va mini game keo tha rac.
- Badge `Anh hùng môi trường`: tong cong AI Camera phan loai thanh cong 100 vat.

Chua lam trong phase nay:

- Daily activity: +5 XP bonus.
- Badge streak 7 ngay va 30 ngay.
- Badge `Vô địch mini game`.

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

## Che do local

`docker-compose.yml` hien tai dang ep backend dung DynamoDB/Cognito that:

```yaml
USE_IN_MEMORY_CHILD_PROFILES=false
```

Voi che do AWS that:

- Can AWS credentials trong `.env`.
- Profile, XP va badges duoc luu vao DynamoDB `GreenLens-ChildProfiles`.
- Restart container khong lam mat du lieu.

Neu muon test nhanh khong can AWS, co the doi thanh:

```yaml
USE_IN_MEMORY_CHILD_PROFILES=true
```

Voi che do in-memory:

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
docker compose up --build -d
docker compose ps
docker compose logs -f api
docker compose restart api
docker compose down
```
