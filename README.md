# Finance Data Platform

A production-grade backend API built with Node.js, Express, and PostgreSQL, following rigorous FinTech engineering standards.

## Prerequisites

- **Node.js**: v18 or higher
- **PostgreSQL**: v14 or higher
- **npm**: v9 or higher

## Setup

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Configuration**:
    Create a `.env` file from the example:
    ```bash
    cp .env.example .env
    ```
    Update the `DATABASE_URL` and `JWT_SECRET` in `.env`.

3.  **Database Migrations**:
    Run all migrations in order (includes role seeding):
    ```bash
    npm run migrate
    ```

4.  **Start the Server**:
    For development (with hot reload):
    ```bash
    npm run dev
    ```
    For production:
    ```bash
    npm run start
    ```

## Database Management

- **Migrate**: `npm run migrate` executes all SQL files in `db/migrations/`.
- **Rollback**: `npm run rollback` executes all SQL files in `db/migrations/rollback/` in reverse order.

## API Documentation

Interactive Swagger documentation is available at:
`http://localhost:3000/api-docs` (Disabled in production mode).

## API Endpoints

| Method | Path | Auth | Role Required (Permissions) |
| :--- | :--- | :--- | :--- |
| **GET** | `/health` | Public | None |
| **POST** | `/auth/register` | Public | None |
| **POST** | `/auth/login` | Public | None |
| **POST** | `/auth/logout` | JWT | None |
| **GET** | `/users` | JWT | `manage_users` |
| **GET** | `/users/:id` | JWT | Self or `manage_users` |
| **PATCH** | `/users/:id/status` | JWT | `manage_users` |
| **DELETE** | `/users/:id` | JWT | `manage_users` |
| **GET** | `/records` | JWT | `read` |
| **POST** | `/records` | JWT | `write` |
| **GET** | `/records/:id` | JWT | `read` |
| **PATCH** | `/records/:id` | JWT | `write` |
| **DELETE** | `/records/:id` | JWT | `write` |
| **POST** | `/records/:id/restore` | JWT | `manage_users` |
| **GET** | `/analytics/summary` | JWT | `analytics` |
| **GET** | `/analytics/category` | JWT | `analytics` |
| **GET** | `/analytics/monthly` | JWT | `analytics` |
| **GET** | `/analytics/recent` | JWT | `analytics` |
| **GET** | `/roles` | JWT | `manage_users` |
| **PATCH** | `/roles/:id` | JWT | `manage_users` |
| **GET** | `/audit/logs` | JWT | `manage_users` |

## Sample cURL Requests

### 1. Register User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
-H "Content-Type: application/json" \
-d '{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123"
}'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
-H "Content-Type: application/json" \
-d '{
  "email": "jane@example.com",
  "password": "password123"
}'
```

### 3. Create Record
```bash
curl -X POST http://localhost:3000/api/v1/records \
-H "Authorization: Bearer <YOUR_TOKEN>" \
-H "Idempotency-Key: record-001" \
-H "Content-Type: application/json" \
-d '{
  "amount": 150.50,
  "type": "income",
  "category": "freelance",
  "date": "2026-04-04",
  "notes": "Project bonus"
}'
```

### 4. Get Analytics Summary
```bash
curl -X GET "http://localhost:3000/api/v1/analytics/summary?from=2026-04-01&to=2026-04-30" \
-H "Authorization: Bearer <YOUR_TOKEN>"
```

### 5. Logout
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
-H "Authorization: Bearer <YOUR_TOKEN>"
```
