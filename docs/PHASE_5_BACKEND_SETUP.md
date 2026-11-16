# PHASE 5 - BACKEND PROJECT SETUP

## Muc Tieu

Khoi tao backend Express 5 + TypeScript chay duoc, ket noi san voi Prisma ORM 7, va dat nen tang cho cac module nghiep vu tu Phase 6.

## Source Structure

```text
backend/
  src/
    config/
      cors.ts
      database.ts
      env.ts
      prisma.ts
    generated/prisma/
    middleware/
      error.middleware.ts
      not-found.middleware.ts
      rate-limit.middleware.ts
      request-id.middleware.ts
      request-logger.middleware.ts
      validate.middleware.ts
    modules/
      health/
        health.controller.ts
        health.routes.ts
    routes/
      index.ts
    shared/errors/
      app-error.ts
    types/
      express.d.ts
    utils/
      api-response.ts
      async-handler.ts
    app.test.ts
    app.ts
    server.ts
  prisma/
  .env
  .env.example
  .gitignore
  package.json
  package-lock.json
  prisma.config.ts
  tsconfig.json
```

`src/generated/prisma` va `.env` duoc gitignore. Prisma Client duoc tao lai bang script, khong commit generated code.

## Middleware Order

```text
requestId
-> Helmet
-> CORS allowlist
-> JSON/urlencoded body limit
-> cookie parser
-> request logger
-> API rate limiter
-> API routes
-> 404 handler
-> centralized error handler
```

Response error luon co `success`, `message`, `code`, `errors`, `requestId`. Stack trace chi tra trong development.

## Environment

`.env.example` la template duoc commit. `.env` local da duoc cau hinh voi MySQL Server 8.0.46 va luon bi gitignore; thong tin dang nhap that khong duoc ghi vao tai lieu hoac ban dong goi.

```text
mysql://root:password@localhost:3306/f1_fashion_store
```

Dong tren chi la mau dinh dang ket noi. Initial migration va development seed da duoc chay thanh cong tren database local. Liveness health endpoint khong mo ket noi database, nen co the dung rieng de kiem tra tien trinh HTTP.

## Commands

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:validate
npm run typecheck
npm test
npm run build
npm run dev
```

Production build:

```bash
npm run build
npm start
```

## Health API

```http
GET /api/v1/health
```

Response:

```json
{
  "success": true,
  "message": "F1 Fashion Store API is healthy",
  "data": {
    "service": "f1-fashion-store-api",
    "status": "ok",
    "version": "0.1.0",
    "environment": "development",
    "timestamp": "2026-10-05T06:32:05.352Z",
    "uptimeSeconds": 27
  }
}
```

## Verification Result

- Prisma Client generate: pass.
- Prisma schema validate: pass.
- TypeScript strict typecheck: pass.
- API tests: 3/3 pass.
- Production build: pass.
- Real server health request: HTTP 200.
- Initial MySQL migration and development seed: pass.
- Register, login, refresh rotation, logout and current-user flow against MySQL: pass.
- `npm audit`: 0 vulnerabilities after safe transitive overrides.

## Phase Boundary

Phase 5 la nen tang backend. Phase 6 da bo sung auth module, token utilities, `authenticate` va `authorize` middleware tren nen tang nay.
