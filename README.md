# 🚀 Ultimate Express.js SaaS Boilerplate

A production-ready, feature-rich Express.js backend boilerplate built with TypeScript in **Strict Mode**. Designed specifically for modern SaaS applications, it provides a highly scalable layered architecture, background job processing, payment integration, multi-cloud storage, and hardened security configurations out of the box.

---

## ✨ Key Features

### 🏗️ Architecture & Core
- **TypeScript Strict Mode**: 100% strict type safety (`strict: true`, `noImplicitAny: true`, `strictNullChecks: true`).
- **Layered Architecture**: Clean separation of concerns: `Route ➔ Controller ➔ Service ➔ Helper / Adapter ➔ Model`.
- **Standardized API Responses & Error Handling**: Centralized error middleware with structured error codes (`VALIDATION_FAILED`, `UNAUTHORIZED`, `DUPLICATE_KEY`, etc.), handling Mongoose errors, JWT errors, Multer errors, and syntax errors uniformly.
- **Request Tracing**: `AsyncLocalStorage`-backed `requestId` automatically attached to all incoming requests, Winston logs, and Morgan HTTP access logs.
- **Graceful Shutdown**: Zero-downtime deployments with proper signal handling (`SIGTERM`, `SIGINT`) to safely drain HTTP requests, close BullMQ queues, disconnect MongoDB, and quit Redis.
- **Health Checks**: `/api/health` endpoint strictly verifying MongoDB and Redis connectivity (exempt from rate limits).

### 🔐 Security & Authentication
- **Multi-Strategy Auth**: Local login/register, Google OAuth 2.0, and JWT-based authentication via `Passport.js`.
- **Accurate Token Expiration**: Correctly configured token lifespans (15-minute Access Tokens, 30-day Refresh Tokens).
- **Session Revocation & Tracking**: Database-backed refresh token sessions in MongoDB to guarantee revocation on logout.
- **Data Sanitization**: Automatic stripping of `hashedPassword`, `verificationToken`, and internal metadata before responding to clients.
- **Multi-Tier Rate Limiting**: Distributed Redis-backed rate limiting with lazy initialization:
  - `authLimiter`: 10 requests / 15 mins for login, register, token refresh.
  - `uploadLimiter`: 30 uploads / 15 mins for file upload endpoints.
  - `apiLimiter`: 300 requests / 15 mins for standard business APIs.
- **Hardened Security Middlewares**:
  - `Helmet` HTTP security headers.
  - Custom **NoSQL Injection Sanitizer** stripping Mongo operators (`$`, `.`).
  - Custom **XSS Sanitizer** stripping dangerous script and HTML tags.
  - CORS and Cookie-parser with secure flags.
- **Request Validation**: Schema-based payload validation via `Joi`.

### 💳 Payments & Billing
- **Payment Adapter & Factory Pattern**: Extensible architecture with built-in **Stripe** integration.
- **Cryptographic Webhook Verification**: Signature-verified webhook handler using `rawBody` buffer capture.

### ⚙️ Background Jobs & Storage
- **Queues (BullMQ)**: Asynchronous task processing (email verification, password reset) backed by Redis.
- **Bull Board UI**: Built-in, password-protected dashboard to monitor and retry background jobs (`/admin/queues`).
- **Multi-Provider Storage**: Seamlessly switch between **Local**, **Cloudflare R2**, and **Cloudinary** via `StorageFactory`.
- **Upload Protection**: Multer memory storage with MIME type whitelist (JPEG, PNG, WebP, GIF, SVG, PDF, etc.) and filename sanitization against path traversal (`../`).
- **Emails**: `Nodemailer` integration with Resend / SMTP support.

### 🐳 DevOps & Observability
- **Docker Ready**: Includes `Dockerfile.dev` for local development and a multi-stage `Dockerfile.prod` with non-root user execution (`USER node`).
- **Docker Compose**: Preconfigured `compose.dev.yml` and `compose.prod.yaml`.
- **Centralized Logging**: Structured JSON logging (production) / colorized console logging (development) via `Winston` and `Morgan`.
- **Interactive API Documentation**: Swagger/OpenAPI docs served at `/api-docs` with automatic route detection for both development and compiled production images.

---

## 📦 Prerequisites

Ensure you have the following installed:
- **Node.js** (v18.x or v20.x+ recommended)
- **MongoDB** (Local or MongoDB Atlas)
- **Redis** (Local, Docker, or Upstash)
- **Docker & Docker Compose** (Optional, for containerized deployments)

---

## 🛠️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ngminhtuan201/express-boilerplate.git
   cd express-boilerplate
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Copy the example config and fill in your secrets (MongoDB URI, Redis, Stripe, etc.):
   ```bash
   cp .env.example .env
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   ```

---

## 📂 Project Structure

```text
.
├── src/
│   ├── dbs/              # Database connections (MongoDB, Redis with Lazy Init)
│   ├── enums/            # Global TypeScript enums (User, Payment, Storage)
│   ├── libs/             # Core integrations (Passport, JWT, Winston, Logger, Upload)
│   ├── middlewares/      # Middlewares (Auth, Role, Rate Limit, Security, Error)
│   ├── models/           # Mongoose schemas (User, Session, Transaction)
│   ├── modules/          # Feature modules (Auth, Health, Payments, Storages, Upload, Users)
│   │   ├── auth/         # Authentication (OAuth, Login, Register, Tokens)
│   │   ├── health/       # Health checks (MongoDB & Redis ping)
│   │   ├── payments/     # Payment adapters (Stripe, Webhooks)
│   │   ├── storages/     # Storage adapters (Local, Cloudflare R2, Cloudinary)
│   │   ├── upload/       # File upload controller & route
│   │   └── users/        # User management & sanitization
│   ├── types/            # Custom TypeScript type augmentations (Express.Request)
│   ├── worker/           # BullMQ job worker & email queue processors
│   ├── app.ts            # Express application bootstrap & middleware setup
│   └── server.ts         # HTTP Server entry point
├── views/                # EJS templates (Bull Board login)
├── Dockerfile.dev        # Docker config for local dev
├── Dockerfile.prod       # Multi-stage Docker config for production
├── compose.dev.yml       # Development Docker Compose
├── compose.prod.yaml     # Production Docker Compose
├── nodemon.json          # Nodemon configuration for development
├── tsconfig.json         # TypeScript compiler options (Strict Mode)
└── package.json
```

---

## ⚙️ Available Scripts

- `npm run dev`: Start the development server with hot-reload via Nodemon + ts-node.
- `npm run build`: Compile TypeScript to optimized JavaScript in `dist/` with full type checking.
- `npm start`: Run the compiled production application (`node dist/src/server.js`).
- `npm run start:worker`: Run the standalone BullMQ background worker (`node dist/src/worker/worker.js`).
- `npm run lint`: Run ESLint to check and auto-fix code quality issues.
- `npm run format`: Format code with Prettier.
- `npm run seed:admin`: Seed or update the initial Admin account (`scripts/create-admin.ts`).

---

## 📊 Bull Board (Queue Dashboard)

Monitor your BullMQ background jobs via a web UI:
- **URL**: `http://localhost:<PORT>/admin/queues`
- **Auth**: Protected by session-based authentication. Use `BULL_BOARD_USERNAME` and `BULL_BOARD_PASSWORD` from your `.env` file to log in.

---

## 🚀 Production Deployment

To deploy via Docker in production:
```bash
docker compose -f compose.prod.yaml up --build -d
```

The production image utilizes a lightweight multi-stage build, automatically stripping out `devDependencies` and running under a non-privileged `node` user.

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
