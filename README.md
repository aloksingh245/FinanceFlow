# FinanceFlow — Full-Stack Fintech Platform

A production-grade personal finance management platform built with Node.js, Express, PostgreSQL, React, and TypeScript. Designed with FinTech-level security, role-based access control, and real-time analytics.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Role-Based Access Control](#role-based-access-control)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Migrations](#database-migrations)
- [Demo Data](#demo-data)
- [API Reference](#api-reference)
- [Security](#security)
- [Testing](#testing)

---

## Overview

FinanceFlow lets users track income and expenses, view analytics dashboards, and manage financial records. Three user roles — Viewer, Analyst, and Admin — each have different levels of access enforced at both the API and UI layers.

**Demo Credentials (after running seed):**

| Role    | Email               | Password          |
|---------|---------------------|-------------------|
| Admin   | admin@demo.com      | Admin@Demo1234    |
| Analyst | analyst@demo.com    | Analyst@Demo1234  |
| Viewer  | viewer@demo.com     | Viewer@Demo1234   |

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| PostgreSQL | Primary database |
| JWT (jsonwebtoken) | Authentication tokens with versioning |
| bcryptjs | Password hashing |
| Joi | Request validation schemas |
| Winston | Structured JSON logging |
| Swagger (swagger-jsdoc) | Interactive API docs |
| express-rate-limit | IP-based rate limiting |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tool and dev server |
| React Router v6 | Client-side routing |
| Axios | HTTP client with interceptors |
| Chart.js + react-chartjs-2 | Line and doughnut charts |
| Lucide React | Icon library |
| React Context API | Auth state management |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  React Frontend                      │
│  Pages: Dashboard, Records, Users, AuditLogs        │
│  Components: Charts, SummaryCards, RecordModal      │
│  Auth: JWT stored in localStorage, axios interceptor│
└──────────────────┬──────────────────────────────────┘
                   │  HTTP (REST API)
┌──────────────────▼──────────────────────────────────┐
│              Express Backend                         │
│                                                      │
│  Routes → Middleware → Controllers                   │
│               │                                      │
│           Services  (business logic)                 │
│               │                                      │
│          Repositories  (SQL queries)                 │
│               │                                      │
│          PostgreSQL Database                         │
└─────────────────────────────────────────────────────┘
```

### Backend Layer Responsibilities

| Layer | Responsibility |
|---|---|
| **Routes** | Map HTTP verbs + paths to controllers; apply auth and permission middleware |
| **Middleware** | JWT authentication, RBAC authorization, rate limiting, validation, request IDs |
| **Controllers** | Parse request, call service, return response |
| **Services** | Business logic, transactions, audit logging |
| **Repositories** | Parameterized SQL queries, no business logic |
| **Policies** | RBAC permission matrix (single source of truth) |

---

## Role-Based Access Control

Every authenticated request passes through two middleware layers:

1. **`authenticate`** — verifies JWT signature and token version (prevents use of invalidated tokens after logout)
2. **`authorize(permission)`** — checks the user's role against the RBAC policy

### Permission Matrix

| Permission | Viewer | Analyst | Admin |
|---|:---:|:---:|:---:|
| `analytics` — view dashboard | ✅ | ✅ | ✅ |
| `read` — browse financial records | ❌ | ✅ | ✅ |
| `write` — create / edit / delete records | ❌ | ❌ | ✅ |
| `restore_records` — restore soft-deleted records | ❌ | ❌ | ✅ |
| `manage_users` — user management + audit logs | ❌ | ❌ | ✅ |

### Analytics Data Scope

| Role | Dashboard Data |
|---|---|
| Viewer | All users' aggregated data |
| Analyst | All users' aggregated data + individual records |
| Admin | All users' aggregated data + individual records + per-user breakdown table |

---

## Features

### Authentication
- Register with role selection (viewer / analyst / admin)
- Password strength enforcement: min 12 chars, uppercase, lowercase, digit, special character
- JWT tokens with server-side version tracking — logout truly invalidates the token
- Per-email brute-force lockout: 5 failed attempts → 15-minute lockout
- IP-based rate limiting on all auth endpoints

### Financial Records (Admin only: write)
- Create, read, update, delete income and expense records
- **Soft delete** — records are flagged `deleted_at`, never physically removed
- **Restore** — admin can undelete soft-deleted records
- **Optimistic locking** — concurrent edits detected via `updated_at` timestamp comparison (millisecond precision)
- **Idempotency keys** — duplicate requests are rejected, safe to retry
- Server-side filters: category search (ILIKE), type (income/expense), date range, pagination

### Analytics Dashboard
- Summary cards: total income, total expenses, net balance
- Cash flow line chart (monthly income vs expenses)
- Expense breakdown doughnut chart (by category)
- Recent transactions list with user attribution (admin/analyst view)
- Admin-only per-user breakdown table
- Date range presets: This Month, Last 30 Days, Last 90 Days, This Year, Last 12 Months

### User Management (Admin only)
- List all users with search by name or email
- Activate / deactivate user accounts
- Soft-delete users (preserves audit trail and financial records)
- Self-action protection: admin cannot deactivate or delete their own account

### Audit Logs (Admin only)
- Every critical action logged: login, logout, register, record CRUD, user management
- Server-side search by user name, email, or action type
- Filter by action, date range
- Export to CSV
- Auto-refresh every 30 seconds (toggleable)

---

## Project Structure

```
FinanceFlow/
├── backend/
│   ├── src/
│   │   ├── analytics/
│   │   │   └── aggregation.service.js     # SQL aggregation queries
│   │   ├── audit/
│   │   │   ├── audit.actions.js           # Action constants
│   │   │   ├── audit.repository.js
│   │   │   └── audit.service.js
│   │   ├── config/
│   │   │   ├── db.js                      # PostgreSQL pool + withTransaction helper
│   │   │   ├── env.js                     # Environment variable validation
│   │   │   └── migrate-runner.js          # Migration CLI runner
│   │   ├── controllers/
│   │   │   ├── analytics.controller.js
│   │   │   ├── audit.controller.js
│   │   │   ├── auth.controller.js
│   │   │   ├── records.controller.js
│   │   │   ├── roles.controller.js
│   │   │   └── users.controller.js
│   │   ├── middleware/
│   │   │   ├── authenticate.js            # JWT verification + token version check
│   │   │   ├── authorize.js               # RBAC permission check
│   │   │   ├── errorHandler.js            # Centralised error responses
│   │   │   ├── rateLimiter.js             # IP limiter + per-email lockout
│   │   │   ├── requestId.js               # Attaches UUID to every request
│   │   │   └── validate.js                # Joi schema validation
│   │   ├── policies/
│   │   │   └── rbac.policy.js             # Permission matrix (single source of truth)
│   │   ├── repositories/
│   │   │   ├── records.repository.js      # Parameterised SQL for records
│   │   │   ├── roles.repository.js
│   │   │   ├── users.repository.js
│   │   │   └── audit.repository.js
│   │   ├── routes/
│   │   │   ├── index.js
│   │   │   ├── analytics.routes.js
│   │   │   ├── audit.routes.js
│   │   │   ├── auth.routes.js
│   │   │   ├── records.routes.js
│   │   │   ├── roles.routes.js
│   │   │   └── users.routes.js
│   │   ├── services/
│   │   │   ├── auth.service.js
│   │   │   ├── records.service.js
│   │   │   ├── roles.service.js
│   │   │   ├── users.service.js
│   │   │   └── audit.service.js
│   │   ├── utils/
│   │   │   ├── apiResponse.js             # Standardised success/error helpers
│   │   │   ├── asyncWrapper.js            # Wraps async controllers for error forwarding
│   │   │   ├── logger.js                  # Winston logger with request IDs
│   │   │   ├── pagination.js              # Page/limit param parser
│   │   │   └── swagger.js                 # Swagger/OpenAPI config
│   │   ├── validators/
│   │   │   ├── auth.validator.js          # Password strength, role, email rules
│   │   │   ├── record.validator.js        # Amount, type, date, idempotency key
│   │   │   ├── analytics.validator.js
│   │   │   ├── role.validator.js
│   │   │   └── user.validator.js
│   │   ├── app.js                         # Express app setup (middleware, routes)
│   │   └── server.js                      # HTTP server + graceful shutdown
│   ├── db/
│   │   └── migrations/
│   │       ├── 001_create_roles.sql
│   │       ├── 002_create_users.sql
│   │       ├── 003_create_financial_records.sql
│   │       ├── 004_create_audit_logs.sql
│   │       ├── 005_create_indexes.sql
│   │       ├── 006_seed_roles.sql
│   │       ├── 007_add_last_login.sql
│   │       ├── 008_add_users_soft_delete.sql
│   │       └── rollback/                  # Reverse migrations
│   ├── seed-demo.js                       # Creates 3 demo users + 12 months of records
│   ├── test-production.js                 # 99-test production test suite
│   └── test-roles.js                      # Live role capability demonstration
│
├── frontend/
│   └── src/
│       ├── api/
│       │   └── axiosInstance.ts           # Axios with JWT interceptor + 401 redirect
│       ├── components/
│       │   ├── Charts.tsx                 # LineChart (cash flow) + CategoryChart (doughnut)
│       │   ├── Header.tsx
│       │   ├── Layout.tsx                 # App shell with sidebar
│       │   ├── ProtectedRoute.tsx         # Role-aware route guard
│       │   ├── RecordModal.tsx            # Create/edit financial record form
│       │   ├── Sidebar.tsx                # Role-filtered navigation
│       │   └── SummaryCards.tsx           # Income / Expense / Balance cards
│       ├── contexts/
│       │   └── AuthContext.tsx            # User state + login/logout helpers
│       ├── pages/
│       │   ├── AuditLogs.tsx              # Admin: search, filter, CSV export
│       │   ├── Dashboard.tsx              # Charts, summary, user breakdown
│       │   ├── Login.tsx
│       │   ├── Records.tsx                # Live search, type filter, date range
│       │   ├── Register.tsx               # Role selection cards
│       │   └── Users.tsx                  # Search, activate/deactivate, delete
│       └── utils/
│           └── idempotency.ts
│
├── .gitignore
├── .env.example
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL v14+
- npm v9+

### 1. Clone the repository

```bash
git clone https://github.com/aloksingh245/FinanceFlow.git
cd FinanceFlow
```

### 2. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 3. Configure environment

```bash
# Backend
cd backend
cp ../.env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET
```

```bash
# Frontend
cd frontend
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### 4. Run database migrations

```bash
cd backend
npm run migrate
```

### 5. (Optional) Seed demo data

Creates 3 demo users (admin, analyst, viewer) and 12 months of realistic financial records:

```bash
cd backend
node seed-demo.js
```

### 6. Start the servers

```bash
# Terminal 1 — Backend (port 3000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Environment Variables

### Backend `.env`

| Variable | Required | Description |
|---|:---:|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret key for signing JWTs (min 32 chars recommended) |
| `PORT` | — | API server port (default: `3000`) |
| `NODE_ENV` | — | `development` or `production` |
| `BCRYPT_SALT_ROUNDS` | — | bcrypt cost factor (default: `12`) |
| `CORS_ORIGIN` | — | Allowed origin for CORS (default: `http://localhost:5173`) |
| `LOG_LEVEL` | — | Winston log level: `error`, `warn`, `info`, `debug` (default: `info`) |
| `AUTH_RATE_LIMIT_MAX` | — | Max auth requests per 15 min per IP (default: `30`) |

### Frontend `.env`

| Variable | Required | Description |
|---|:---:|---|
| `VITE_API_BASE_URL` | — | Backend API base URL (default: `http://localhost:3000/api/v1`) |

---

## Database Migrations

```bash
# Run all pending migrations
npm run migrate

# Rollback all migrations
npm run rollback
```

Migrations run in numbered order from `db/migrations/`. Each migration is idempotent (`IF NOT EXISTS`).

### Schema Overview

```
roles               — viewer, analyst, admin
users               — id, name, email, password_hash, role_id, status, token_version, deleted_at
financial_records   — id, user_id, amount, type, category, notes, date, deleted_at, idempotency_key, updated_at
audit_logs          — id, user_id, action, entity, entity_id, ip_address, request_id, timestamp
```

---

## API Reference

Base URL: `http://localhost:3000/api/v1`

Interactive docs: `http://localhost:3000/api-docs` (development only)

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| POST | `/auth/register` | Public | Register new user with role |
| POST | `/auth/login` | Public | Login, returns JWT token |
| POST | `/auth/logout` | JWT | Invalidates token server-side |

### Financial Records

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/records` | `read` | List records with search, type, date filters |
| POST | `/records` | `write` | Create record (supports idempotency key) |
| GET | `/records/:id` | `read` | Get single record |
| PATCH | `/records/:id` | `write` | Update record (optimistic locking via `updated_at`) |
| DELETE | `/records/:id` | `write` | Soft-delete record |
| POST | `/records/:id/restore` | `restore_records` | Restore soft-deleted record |

**Query params for GET `/records`:**
- `search` — category ILIKE search
- `type` — `income` or `expense`
- `from` / `to` — date range (ISO format)
- `page` / `limit` — pagination

### Analytics

All analytics endpoints require the `analytics` permission (all roles). Admin and Analyst see data aggregated across all users.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/analytics/summary` | Total income, expense, net balance |
| GET | `/analytics/monthly` | Monthly income vs expense trends |
| GET | `/analytics/category` | Expense breakdown by category |
| GET | `/analytics/recent` | Last 10 transactions |
| GET | `/analytics/users/breakdown` | Per-user summary (admin only) |

**Query params:** `from` / `to` (ISO date strings)

### Users

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/users` | `manage_users` | List users with name/email search |
| GET | `/users/profile` | JWT | Get own profile |
| GET | `/users/:id` | `manage_users` | Get user by ID |
| PATCH | `/users/:id/status` | `manage_users` | Activate or deactivate user |
| DELETE | `/users/:id` | `manage_users` | Soft-delete user |

### Audit Logs

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/audit/logs` | `manage_users` | Paginated logs with search and filter |

**Query params:** `search` (name/email/action), `action`, `from`, `to`, `page`, `limit`

### Roles

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/roles` | `manage_users` | List all roles |
| PATCH | `/roles/:id` | `manage_users` | Update role permissions |

---

## Security

| Mechanism | Implementation |
|---|---|
| Password hashing | bcrypt with configurable salt rounds (default 12) |
| JWT invalidation | Token version stored in DB; incremented on logout |
| Brute force protection | Per-email lockout after 5 failed logins (15 min) |
| IP rate limiting | express-rate-limit on all auth endpoints |
| SQL injection | Parameterised queries only — no string concatenation |
| Input validation | Joi schemas on every endpoint |
| Role escalation | `role` field in registration is validated server-side; users cannot self-promote |
| Soft deletes | Records and users are never physically deleted |
| Optimistic locking | `updated_at` comparison prevents lost updates on concurrent edits |
| Request tracing | UUID attached to every request for log correlation |

---

## Testing

### Production Test Suite (99/99 passing)

```bash
cd backend
node test-production.js
```

Covers 15 test sections:

1. Health check
2. Registration (valid, duplicate, weak passwords, missing fields)
3. Login (valid credentials, wrong password, non-existent email)
4. Auth middleware (no token, invalid JWT, malformed bearer)
5. Records — Admin (CRUD, optimistic locking, idempotency, validation)
6. Records — Analyst (read only, write blocked)
7. Records — Viewer (all blocked)
8. Cross-user data isolation
9. Analytics — all three roles
10. User management — admin only
11. Audit logs — admin only
12. Logout and token invalidation
13. Security (SQL injection, XSS payload storage, oversized input, invalid UUIDs)
14. Pagination and query params
15. Soft delete user integrity

### Live Role Demo

```bash
cd backend
node test-roles.js
```

Registers three test users and demonstrates exactly what each role can and cannot do.
