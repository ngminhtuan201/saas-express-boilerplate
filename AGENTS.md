# AI Coding Agent Guidelines & Architecture Rules

This document defines the architectural standards, code style, conventions, and engineering rules for this repository. Any AI agent (or human engineer) modifying or adding code to this project **MUST** follow these rules strictly.

---

## 🏛️ 1. Project Architecture & Layered Design

This project follows a strict **Layered Modular Architecture** with clear separation of concerns:

$$\text{Route} \longrightarrow \text{Controller} \longrightarrow \text{Service} \longrightarrow \text{Helper / Adapter} \longrightarrow \text{Model / Database}$$

### 📁 Directory Layout

```text
src/
├── dbs/              # Database connections (MongoDB, Redis with Lazy Init)
├── enums/            # Global TypeScript enums (user, payment, storage, etc.)
├── libs/             # Core shared libraries (logger, env, errors, jwt, response, upload, id)
├── middlewares/      # Express middlewares (auth, role, rate-limit, security, validation, error)
├── models/           # Mongoose schemas & interfaces (User, Session, Transaction, Base)
├── modules/          # Domain feature modules
│   └── <feature>/    # Feature-specific package
│       ├── <feature>.route.ts       # Route endpoints & middleware attachments
│       ├── <feature>.controller.ts  # Request handling & response formatting
│       ├── <feature>.service.ts     # Business logic & database operations
│       ├── <feature>.helper.ts      # (Optional) Feature helpers & pure transformers
│       ├── <feature>.type.ts        # (Optional) Domain types / interfaces
│       ├── dto/                     # Request validation schemas & DTO types
│       │   ├── <action-1>.dto.ts
│       │   └── <action-2>.dto.ts
│       └── adapters/                # (Optional) Multi-provider adapter implementations
│           ├── interface.ts         # Adapter contract
│           └── <provider>.adapter.ts
├── types/            # Custom global type declarations (e.g. express.d.ts)
├── worker/           # Background job processors (BullMQ worker & queues)
├── app.ts            # Express application setup, security, and router registration
└── server.ts         # Server bootstrap & process startup
```

---

## 📐 2. Module Development Rules

When creating a new feature module or editing an existing one, strictly follow these standards:

### 2.1. Route Layer (`<feature>.route.ts`)
- Use `express.Router()`.
- Attach required middlewares in the exact sequence:
  1. Rate limiter (e.g., `authLimiter`, `uploadLimiter`, or inherit `apiLimiter`).
  2. Authentication middleware (`requireAuth()`) if protected.
  3. Authorization middleware (`requireRoles([UserRole.ADMIN])`) if role-restricted.
  4. Payload validation (`validateRequest({ body: ..., query: ..., params: ... })`).
  5. Controller handler.
- **Example**:
  ```typescript
  import { Router } from "express";
  import { requireAuth } from "../../middlewares/require-auth";
  import { validateRequest } from "../../middlewares/validate-request";
  import { createItem, getItems } from "./item.controller";
  import { createItemSchema } from "./dto/create-item.dto";

  export const itemRouter = Router();

  itemRouter.get("/", requireAuth(), getItems);
  itemRouter.post("/", requireAuth(), validateRequest({ body: createItemSchema }), createItem);
  ```

### 2.2. Controller Layer (`<feature>.controller.ts`)
- **NEVER** write business logic or database queries inside controllers.
- **ALWAYS** wrap async controller methods with `catchAsync(...)` from `src/libs/request`.
- Retrieve current authenticated user via `getCurrentUser(req)`.
- **ALWAYS** return HTTP responses using `handleSuccessResponse(res, data, statusCode, message)` from `src/libs/response`.
- **ALWAYS** sanitize user data before returning using `sanitizeUser(user)` from `src/modules/users/user.helper`.
- **Example**:
  ```typescript
  import { Request, Response } from "express";
  import { catchAsync, getCurrentUser } from "../../libs/request";
  import { handleSuccessResponse } from "../../libs/response";
  import { errors } from "../../libs/errors";
  import * as itemService from "./item.service";
  import { CreateItemDto } from "./dto/create-item.dto";

  export const createItem = catchAsync(async (req: Request, res: Response) => {
    const user = getCurrentUser(req);
    if (!user) {
      throw errors.Unauthorized;
    }

    const item = await itemService.createItem(user.id, req.body as CreateItemDto);
    return handleSuccessResponse(res, { item }, 201, "Item created successfully");
  });
  ```

### 2.3. Service Layer (`<feature>.service.ts`)
- Contains all domain logic, database operations, external integrations, and queue dispatching.
- **NEVER** import or interact with Express `req` or `res` objects in the service layer.
- Throw structured `AppError` via `errors.<Name>` or `errors.Custom(...)` from `src/libs/errors` when errors occur.
- **Example**:
  ```typescript
  import { errors } from "../../libs/errors";
  import { documentId } from "../../libs/id";
  import { ItemModel } from "../../models/Item";
  import { CreateItemDto } from "./dto/create-item.dto";

  export const createItem = async (userId: string, dto: CreateItemDto) => {
    const existing = await ItemModel.findOne({ name: dto.name }).lean().exec();
    if (existing) {
      throw errors.Custom(409, "ITEM_ALREADY_EXISTS", "An item with this name already exists");
    }

    const newItem = await ItemModel.create({
      id: documentId(),
      userId,
      name: dto.name,
      price: dto.price,
    });

    return newItem;
  };
  ```

### 2.4. DTO & Validation Layer (`dto/<action>.dto.ts`)
- Use **Joi** for runtime schema validation.
- Export both the Joi schema and the TypeScript type representation.
- **Example**:
  ```typescript
  import Joi from "joi";

  export type CreateItemDto = {
    name: string;
    price: number;
    description?: string;
  };

  export const createItemSchema = Joi.object<CreateItemDto>({
    name: Joi.string().trim().min(2).max(100).required(),
    price: Joi.number().positive().required(),
    description: Joi.string().trim().max(500).optional(),
  });
  ```

---

## 🔒 3. Security & Coding Standards

1. **Type Safety (Strict Mode)**:
   - TypeScript is configured with `"strict": true`.
   - **DO NOT** use `any`. Use `unknown`, generics, or proper type interfaces.
   - Do not use non-null assertions (`!`) unless guaranteed by preceding guards.
2. **Password & Secret Sanitization**:
   - Never return raw MongoDB user documents. Always use `sanitizeUser(user)` to strip `hashedPassword`, `verificationToken`, `verificationTokenExpiry`, and `__v`.
3. **Error Handling**:
   - Centralized error response format:
     ```json
     {
       "success": false,
       "error": {
         "code": "ERROR_CODE",
         "message": "Human readable description",
         "statusCode": 400,
         "requestId": "uuid",
         "details": [...]
       }
     }
     ```
   - Throw errors using `errors.<Name>` getters (e.g. `throw errors.NotFound`, `throw errors.Unauthorized`).
4. **Database Models & IDs**:
   - Mongoose schemas must extend `BaseModel` (`id`, `createdAt`, `updatedAt`).
   - Use `documentId()` from `src/libs/id` (nanoid) for primary key `id`.
   - Always register Mongoose indexes (`schema.index(...)`) **before** compiling the model (`mongoose.model(...)`).
5. **Rate Limiting**:
   - Apply `authLimiter` to sensitive auth endpoints (login, register, forgot-password).
   - Apply `uploadLimiter` to file upload routes.
   - Do not rate limit `/api/health`, Swagger docs, or public assets.
6. **File Uploads**:
   - File uploads must pass through `uploader` from `src/libs/upload.ts` (validates MIME types and extensions).
   - Always sanitize stored filenames with `sanitizeFileName(...)` to prevent directory traversal.

---

## 🛠️ 4. Common Commands & Verification

Whenever you make changes, verify the codebase with:

- **Typecheck & Build**: `npm run build` (must pass with exit code 0).
- **Linting & Formatting**: `npm run lint` & `npm run format` (must have 0 errors and 0 warnings).
- **Dev Server**: `npm run dev` (starts nodemon with ts-node).
- **Background Worker**: `npm run start:worker`.
