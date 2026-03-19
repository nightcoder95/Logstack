# LogStack — Project Analysis & Migration Plan (v2 — Revised)

> Generated: 2026-03-19 | Revised after review (v3)
> Scope: Full codebase audit + Supabase → MongoDB migration plan
> Strategy: **Build it all, then switch over** (no incremental migration)

---

## 1. Project Summary

### What is LogStack?
A **Next.js personal daily work log application** that lets users create, manage, and analyze work logs with rich text descriptions, todo tracking, filtering, search, bulk operations, and dashboard analytics.

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript 5 |
| UI | React 18, Tailwind CSS 3, Framer Motion, Radix UI primitives |
| Rich Text | TipTap 3.10.7 (with code, tables, images, links) |
| Charts | Recharts 2.10.3 |
| Icons | Lucide React |
| Toasts | Sonner |
| Data Fetching | TanStack React Query 5 |
| Backend | Supabase (PostgreSQL + Auth + RLS + Real-time) |
| Auth | Supabase Auth (email/password) |

### Routing Structure
```
app/
├── page.tsx                          → Auth redirect (→ /dashboard or /login)
├── layout.tsx                        → Root layout (providers, theme, toaster)
├── providers.tsx                     → React Query provider
├── globals.css                       → Tailwind + accent color system
├── login/page.tsx                    → Email/password sign-in
├── signup/page.tsx                   → Registration
├── forgot-password/page.tsx          → Password reset request
├── reset-password/page.tsx           → Password reset form
└── dashboard/
    ├── layout.tsx                    → Auth guard (server-side)
    ├── page.tsx                      → Dashboard: stats, charts, streaks, notifications
    ├── logs/
    │   ├── page.tsx                  → Logs list: search, filter, paginate, bulk ops (980 lines)
    │   ├── new/page.tsx              → Create log form
    │   └── [id]/edit/page.tsx        → Edit log form
    └── settings/page.tsx             → Theme, entry types, profile, password
```

### Database Schema (Current — Supabase PostgreSQL)

**`logs` table**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK → auth.users) | CASCADE delete |
| date | date | Default: current_date |
| entry_type | text | CHECK constraint: daily_work, goal_progress, learning, win, help_given, feedback_received, leave |
| title | text | Required, max 200 chars |
| todos | jsonb | Array of `{text, done}` |
| description | text | Rich HTML content |
| deadline | timestamptz | Optional |
| user_email | text | Denormalized from profiles — **unused in any component, drop on migration** |
| deleted_at | timestamptz | Soft delete marker |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**`profiles` table**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK, FK → auth.users) | |
| email | text | |
| full_name | text | Nullable |
| avatar_url | text | Nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Key Files (lib/)
```
lib/
├── types.ts                → Todo, Profile, Log interfaces
├── constants.ts            → ENTRY_TYPES, TYPE_COLORS, TYPE_STYLES, ENTRY_TYPE_LABELS
├── utils.ts                → cn() (clsx + tailwind-merge)
├── theme-context.tsx        → ThemeProvider (accent colors, dark mode)
├── supabase/
│   ├── client.ts           → Browser Supabase client
│   ├── server.ts           → Server Supabase client
│   └── middleware.ts        → Session refresh middleware
└── hooks/
    ├── useLogs.ts          → Fetch logs with filters, pagination, real-time subs
    ├── useProfile.ts       → Fetch/update user profile
    ├── useDebounce.ts       → Generic debounce hook
    └── useVirtualScroll.ts  → Virtual scroll (UNUSED)
```

### Data Flow (Current)
1. **Middleware** (`middleware.ts`) refreshes Supabase session on every request
2. **Server components** use `lib/supabase/server.ts` for auth checks
3. **Client components** create browser Supabase clients directly (no shared provider)
4. **React Query** caches data; Supabase real-time channels invalidate cache on changes
5. **No API routes** — all database queries happen client-side via Supabase SDK
6. **Dashboard stats** computed client-side from `.limit(100)` query — **correctness bug** with >100 logs

---

## 2. Code Flaws

### CRITICAL — Security & Data Integrity

#### Flaw 1: No API Route Layer
**Files**: All page components query Supabase directly from the browser
**Problem**: Zero server-side business logic or authorization. This only works because Supabase RLS enforces row-level security at the database level. Once Supabase is removed, there is no authorization whatsoever.
**Impact**: Blocks migration; business logic scattered across 8+ components

#### Flaw 1b: Dashboard Stats are Incorrect with >100 Logs
**File**: `app/dashboard/page.tsx` (line 59)
**Code**: `.limit(100)` then calculates streak, type distribution, and deadlines client-side
**Problem**: This is a **correctness bug**. With 101+ logs, streak and type distribution are computed only on the latest 100 entries — the numbers shown would be wrong. Not just inefficient.
**Fix**: Dedicated `/api/logs/stats` endpoint using MongoDB aggregation pipeline returning pre-computed stats.

#### Flaw 2: XSS via `dangerouslySetInnerHTML`
**File**: `app/dashboard/logs/page.tsx` (~line 859)
**Code**: `dangerouslySetInnerHTML={{ __html: log.description || '' }}`
**Problem**: No sanitization library (e.g., DOMPurify) in the dependency tree. If a log description contains malicious HTML/JS, it will execute.

#### Flaw 3: `SECURITY DEFINER` on Soft Delete RPC
**File**: `supabase/soft_delete_function.sql`
**Problem**: Runs with the function owner's privileges. While it checks `auth.uid()`, any bug in that check could expose all users' data. Eliminated entirely by moving to API-route-based authorization.

#### Flaw 4: Minimal Input Validation
**Files**: `app/dashboard/logs/new/page.tsx`, `app/dashboard/logs/[id]/edit/page.tsx`
**Problem**: Only validates `title.trim()` and `title.length > 200`. No server-side validation. No schema validation (e.g., Zod). Custom entry types from localStorage bypass the DB CHECK constraint.

#### Flaw 5: `todos` Type Mismatch
**File**: `lib/types.ts` (line 22)
**Code**: `todos: string | null` — but DB column is `jsonb`
**Problem**: Code uses `JSON.stringify()` before insert and `JSON.parse()` on read. Works but the TypeScript type is a lie, making the codebase harder to reason about.

### HIGH — Architecture & Maintainability

#### Flaw 6: Monolithic 980-Line Component
**File**: `app/dashboard/logs/page.tsx`
**Problem**: Contains filtering UI, table rendering, mobile card view, pagination, bulk operations, export logic, delete dialog, sort logic, inline editing, and selection mode — all in ONE component. Extremely difficult to maintain, test, or modify.

#### Flaw 7: Duplicate Supabase Client Creation
**Files**: `DashboardNav.tsx`, `dashboard/page.tsx`, `logs/page.tsx`, `logs/new/page.tsx`, `logs/[id]/edit/page.tsx`, `settings/page.tsx`, `useLogs.ts`, `useProfile.ts`
**Pattern**: `useMemo(() => createClient(), [])` repeated 8+ times
**Fix**: Eliminated by migration — replaced with API route calls (no client-side DB access)

#### Flaw 8: Duplicate Form Logic (New vs Edit)
**Files**: `app/dashboard/logs/new/page.tsx`, `app/dashboard/logs/[id]/edit/page.tsx`
**Problem**: ~80% code overlap — todo management (`addTodo`, `removeTodo`, `toggleTodo`), form fields, validation, localStorage loading for custom entry types. Violates DRY.

#### Flaw 9: Duplicate Real-Time Subscriptions
**Files**: `app/dashboard/page.tsx` (lines 25-45), `lib/hooks/useLogs.ts` (lines 39-59)
**Problem**: Both independently subscribe to Supabase channels on the `logs` table. When both are mounted, two redundant subscriptions exist.

#### Flaw 10: Broken Custom Entry Types Feature
**Files**: `app/dashboard/settings/page.tsx`, `logs/new/page.tsx`, `logs/[id]/edit/page.tsx`
**Problem**: Custom entry types are stored in `localStorage` (lost on device change, never synced). Worse: the DB has a CHECK constraint that only allows 7 predefined types — any custom type will fail at insert time. **This feature is fundamentally broken.** Fixed during Phase 2 by storing in MongoDB users document.

### MEDIUM — Quality & UX

#### Flaw 11: No Error Boundaries
**Missing**: No `error.tsx` files anywhere in the `app/` directory
**Impact**: Any uncaught error crashes the entire page with no recovery path

#### Flaw 12: No Mutation Loading States
**File**: `app/dashboard/logs/page.tsx`
**Problem**: Delete and bulk delete buttons have no `isPending`/loading indicator. Users can click multiple times, triggering duplicate requests.

#### Flaw 13: Hardcoded Dark Theme
**File**: `app/layout.tsx` (line 18): `<html lang="en" className="dark">`
**Problem**: Theme context exists with `'dark' | 'light'` type, but light mode is never implemented. The Toaster is also hardcoded to `theme="dark"`.

#### Flaw 14: Dead Code — `useVirtualScroll`
**File**: `lib/hooks/useVirtualScroll.ts`
**Problem**: Complete implementation (50+ lines) that is imported nowhere. The logs page uses pagination instead.

#### Flaw 15: Zero Tests
**Problem**: No test files exist. No testing dependencies in `package.json`. No CI/CD pipeline.

#### Flaw 16: CHECK Constraint vs Custom Types Conflict
**File**: `supabase/migrations/001_initial_schema.sql` (lines 16-18)
**Problem**: `CHECK (entry_type IN ('daily_work', ...))` rejects any value not in the predefined list, making the localStorage custom entry types feature silently fail at runtime.

---

## 3. Migration Plan: Supabase → MongoDB

> **Strategy**: Build it all, then switch over. The app does NOT need to remain functional during migration. We build the full new backend, test it, then cut over.

### Phase 0: Component Restructuring (No Backend Changes)

> **Goal**: Decompose and clean up the frontend. No API routes yet — those are built directly against MongoDB in Phase 2. Keep Supabase running as-is during this phase.

#### Step 0.1 — Add Zod Validation Library
New file: `lib/validation.ts`
- `logSchema` — title (required, max 200), entry_type (enum), date, todos (array of {text, done}), description, deadline
- `profileSchema` — full_name
- `authSchema` — email, password (min 8)
- Used later by API routes in Phase 2. Adding now to share with client-side form validation immediately.

#### Step 0.2 — Extract Shared Log Form
Create `components/LogForm.tsx` with `mode: 'create' | 'edit'` prop.
- Consolidates duplicate todo management logic (`addTodo`, `removeTodo`, `toggleTodo`)
- Consolidates form fields, validation, custom entry type loading
- Both `new/page.tsx` and `[id]/edit/page.tsx` become thin wrappers

#### Step 0.3 — Decompose Logs Page
Extract from the 980-line `app/dashboard/logs/page.tsx`:
- `components/logs/LogsFilter.tsx` — search, date pickers, type filters, quick filters
- `components/logs/LogsTable.tsx` — desktop table view
- `components/logs/LogsMobileList.tsx` — mobile card list
- `components/logs/LogsPagination.tsx` — pagination controls
- `components/logs/LogsBulkActions.tsx` — selection mode, bulk delete, export
- `components/logs/ActiveFilters.tsx` — active filter badges

The parent `logs/page.tsx` becomes an orchestrator (~100-150 lines) that manages state and composes these sub-components.

---

### Phase 1: Authentication Migration (Supabase Auth → NextAuth.js)

#### Step 1.1 — Install Dependencies
```bash
npm install next-auth @auth/mongodb-adapter mongodb bcryptjs
npm install -D @types/bcryptjs
```

#### Step 1.2 — MongoDB Connection
New file: `lib/mongodb.ts`
- Singleton MongoClient connection (reused across requests in dev/prod)
- Env vars: `MONGODB_URI`, `MONGODB_DB`

#### Step 1.3 — NextAuth Configuration

**Auth model decision**: Use NextAuth's MongoDBAdapter `users` collection as the single source of truth. Add `passwordHash` as a custom field on the same document. The signup route writes the hash there; the Credentials `authorize()` reads from the same document. **No separate Users collection** — avoids split source of truth.

New file: `lib/auth.ts`
- `CredentialsProvider` for email/password
- `MongoDBAdapter` for user/session storage
- **JWT session strategy** (not database sessions — simpler for this app)
- Callbacks: `jwt` callback attaches `userId`, `session` callback exposes it
- `authorize()` function: lookup user by email in adapter's `users` collection, verify password hash with bcryptjs

New file: `app/api/auth/[...nextauth]/route.ts` — NextAuth route handler
New file: `app/api/auth/signup/route.ts` — POST: validate with Zod, hash password, insert into `users` collection

#### Step 1.4 — Replace Middleware
Rewrite `middleware.ts`:
- Use `getToken` from `next-auth/jwt`
- Protect `/dashboard/*` routes only
- **Must NOT block `/api/auth/*`** routes (NextAuth needs these unprotected)
- Delete `lib/supabase/middleware.ts`

#### Step 1.5 — Update Auth Pages
| Page | Change |
|------|--------|
| `login/page.tsx` | `signIn('credentials', ...)` from next-auth/react |
| `signup/page.tsx` | POST to `/api/auth/signup`, then `signIn()` |
| `forgot-password/page.tsx` | POST to `/api/auth/forgot-password` (requires email service — Resend or Nodemailer) |
| `reset-password/page.tsx` | POST to `/api/auth/reset-password` with token |
| `app/page.tsx` | `getServerSession()` instead of Supabase `auth.getUser()` |
| `dashboard/layout.tsx` | `getServerSession()` for server-side auth guard |

#### Step 1.6 — Update Providers
Add NextAuth `SessionProvider` to `app/providers.tsx` alongside existing `QueryClientProvider`

#### Step 1.7 — Update DashboardNav
- Replace `user: SupabaseUser` prop with `useSession()` from next-auth/react
- Replace `supabase.auth.signOut()` with `signOut()` from next-auth/react
- Remove all Supabase imports

---

### Phase 2: Database Migration (PostgreSQL → MongoDB)

> **No Mongoose** — use the raw `mongodb` driver + Zod for validation. Fewer moving parts, no model recompilation quirks in dev, smaller bundle.

#### Step 2.1 — MongoDB Document Design

**Users collection** (NextAuth adapter's `users` collection, extended with custom fields):
```js
{
  _id: ObjectId,
  // NextAuth standard fields:
  name: String | null,
  email: String,
  emailVerified: Date | null,
  image: String | null,
  // Custom fields:
  passwordHash: String,
  fullName: String | null,
  avatarUrl: String | null,
  customEntryTypes: [{ value: String, label: String }],  // moved from localStorage
  preferences: { accentColor: String, theme: String },
  createdAt: Date,
  updatedAt: Date
}
```

**Logs collection:**
```js
{
  _id: ObjectId,
  userId: ObjectId,         // reference to users._id
  date: Date,               // proper Date, not string
  entryType: String,
  title: String,
  todos: [{ text: String, done: Boolean }] | null,  // native array — no JSON.stringify!
  description: String | null,  // sanitized HTML (sanitize on write only)
  deadline: Date | null,
  deletedAt: Date | null,
  createdAt: Date,
  updatedAt: Date
  // NOTE: user_email intentionally excluded — exists in Supabase schema but
  // is unused in any component. Dropped from MongoDB schema and TypeScript type.
}
```

**Indexes:**
- `{ userId: 1, date: -1 }` — primary query pattern
- `{ userId: 1, entryType: 1 }`
- `{ userId: 1, deletedAt: 1 }` — partial (where null)
- `{ userId: 1, deadline: 1 }` — sparse
- `{ title: 'text', description: 'text' }` — full-text search

#### Step 2.2 — Data Access Layer (DAL)
New file: `lib/db/logs.ts`
- `getLogs(userId, filters)` — list with search, type filter, date range, pagination, sort
- `getLogById(userId, id)` — single log; validate `ObjectId.isValid(id)` before query
- `createLog(userId, data)` — insert with sanitized description
- `updateLog(userId, id, data)` — update; validate ObjectId; ownership enforced by userId filter
- `softDeleteLog(userId, id)` — set deletedAt; validate ObjectId
- `bulkSoftDelete(userId, ids)` — validate all ids are valid ObjectIds, set deletedAt for all in one `updateMany`
- `getLogStats(userId)` — MongoDB aggregation pipeline returning `{ total, streak, typeDistribution: Record<string, number>, upcomingDeadlines: Log[] }`

New file: `lib/db/users.ts`
- `getUserById(id)` — profile data
- `updateUserProfile(id, data)` — update fullName, avatarUrl
- `updateUserPreferences(id, prefs)` — update accent color, theme
- `getCustomEntryTypes(id)` / `addCustomEntryType(id, type)` / `removeCustomEntryType(id, value)`

Every function takes `userId` as first param → replaces Supabase RLS authorization.

#### Step 2.3 — API Routes (built directly against MongoDB DAL)

**API surface** (11 endpoints):
```
POST   /api/auth/[...nextauth]     — NextAuth handler (Phase 1)
POST   /api/auth/signup             — Registration (Phase 1)
GET    /api/logs                    — List (with filter/pagination query params)
POST   /api/logs                    — Create log
DELETE /api/logs                    — Bulk soft delete: body { ids: string[] }
GET    /api/logs/[id]               — Get single log
PATCH  /api/logs/[id]               — Update log
DELETE /api/logs/[id]               — Soft delete single log
GET    /api/logs/stats              — Aggregated stats for dashboard
GET    /api/profile                 — Get profile
PATCH  /api/profile                 — Update profile (name, preferences, entry types)
```

Each route pattern:
1. `getServerSession(authOptions)` → 401 if no session
2. Validate input with Zod schema (validate ObjectId format on `[id]` routes before querying)
3. Call DAL function with `session.user.id`
4. Return JSON in standard format: `{ data }` on success, `{ error, message, code }` on failure

**Decisions**:
- `/api/logs/stats` reinstated — dashboard fetches `.limit(100)` and derives stats client-side, which is a **correctness bug** (stats wrong with >100 logs). This endpoint uses a MongoDB aggregation pipeline to return `{ total, streak, typeDistribution, upcomingDeadlines }` server-side correctly.
- `DELETE /api/logs` with `{ ids: string[] }` body — single round-trip for bulk delete instead of N parallel requests. Validate each id is a valid ObjectId before processing.
- Bulk export stays client-side (creates Blob → `URL.createObjectURL` → `<a>.click()` — no network involved).
- No `/api/settings/entry-types` — entry types managed via `PATCH /api/profile` (they live on the user document).

#### Step 2.4 — HTML Sanitization
Add `isomorphic-dompurify` as dependency.
- **Sanitize on write only** (in `createLog` and `updateLog` DAL functions) — this is the authoritative boundary
- Do NOT sanitize on render for new data (unnecessary double-processing)
- One-time migration script sanitizes all legacy descriptions from Supabase

#### Step 2.5 — Update React Query Hooks

**Modified hooks:**
- `lib/hooks/useLogs.ts` → `fetch('/api/logs?...')` instead of Supabase query. Remove real-time subscription. Add `refetchInterval: 30000` with `refetchIntervalInBackground: false`.
- `lib/hooks/useProfile.ts` → `fetch('/api/profile')` instead of Supabase query

**New mutation hooks** (consolidated in single file):
- `lib/hooks/useLogMutations.ts` — exports `useCreateLog`, `useUpdateLog`, `useDeleteLog`, `useBulkDeleteLogs`
- Keeps related mutation logic together; each function is independently importable
- All mutations: `onError` → `toast.error(message)`, `onSuccess` → invalidate `['logs']` query key
- All mutations: handle 401 response → `signOut()` + redirect to login (session expiry)

#### Step 2.6 — Update Page Components
All pages switch from direct Supabase calls to API-backed hooks:
- `app/dashboard/page.tsx` — remove Supabase client, remove real-time subscription, derive stats from `useLogs` data
- `app/dashboard/logs/page.tsx` — already decomposed in Phase 0, now uses mutation hooks for delete/bulk
- `app/dashboard/logs/new/page.tsx` — uses `LogForm` + `useCreateLog`
- `app/dashboard/logs/[id]/edit/page.tsx` — uses `LogForm` + `useUpdateLog`
- `app/dashboard/settings/page.tsx` — uses `useProfile` for profile + custom entry types (from DB, not localStorage)

---

### Phase 3: Cleanup & Cutover

#### Step 3.1 — Remove Supabase Entirely
- Delete `lib/supabase/` directory (client.ts, server.ts, middleware.ts)
- Delete `supabase/` directory (migrations, soft_delete_function.sql)
- Remove from package.json: `@supabase/ssr`, `@supabase/supabase-js`
- `npm install` to clean lockfile
- Full grep for any remaining `supabase` or `createClient` imports — remove stragglers

#### Step 3.2 — Environment Variables
Remove: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
Add:
- `MONGODB_URI` — MongoDB connection string
- `MONGODB_DB` — Database name
- `NEXTAUTH_SECRET` — JWT signing secret
- `NEXTAUTH_URL` — App URL (e.g., http://localhost:3000)
- `EMAIL_SERVER` — SMTP connection (for password reset, if using Nodemailer)
- `EMAIL_FROM` — Sender email address

#### Step 3.3 — Data Migration Script
Create `scripts/migrate-data.ts` (one-time use):
1. **Dry-run mode** (`--dry-run` flag): validate all records, report issues without inserting
2. Connect to Supabase PostgreSQL via direct connection string
3. Connect to MongoDB
4. Export users from `auth.users` + `profiles`
5. Password hash compatibility: **test bcrypt variant before migrating**. Supabase uses bcrypt with a specific cost factor. Run a test verification against a known password. If compatible, copy hashes directly. If not, set `requiresPasswordReset: true` on users — they get a "reset your password" prompt on first login.
6. Export all logs, transforming:
   - `id` (uuid) → new `ObjectId` (maintain uuid→ObjectId mapping table for verification)
   - `user_id` → corresponding MongoDB user `ObjectId`
   - `user_email` → **dropped** (unused field)
   - `todos` from JSON string → native array; skip record + log if JSON.parse fails
   - `date` string → Date object
   - `description` → sanitized via DOMPurify
   - `entry_type` → validate against enum; log and skip unknown values
7. Insert in batches of 500 (resumable — track last processed id)
8. Create indexes after insert
9. Generate migration report: total processed, skipped, failed, by-table breakdown
10. User deletion cleanup: configure MongoDB TTL or application-level cascade so deleting a user also deletes their logs (replaces Postgres CASCADE DELETE)

#### Step 3.4 — Post-Migration Fixes
- Fix `todos` type in `lib/types.ts`: `string | null` → `Todo[] | null`
- Remove all `JSON.parse`/`JSON.stringify` for todos in components
- Add error boundaries: `app/error.tsx`, `app/dashboard/error.tsx`, `app/dashboard/logs/error.tsx`
- Add mutation loading states (`isPending` on delete/bulk buttons)
- Delete `lib/hooks/useVirtualScroll.ts` (dead code)
- Remove both Supabase real-time subscription blocks (dashboard page + useLogs hook)

---

## 4. Execution Order

| # | Task | Phase | Risk | Effort |
|---|------|-------|------|--------|
| 1 | Add Zod validation schemas | 0 | Low | Low |
| 2 | Extract shared LogForm component | 0 | Low | Medium |
| 3 | Decompose 980-line logs page into sub-components | 0 | Low | Medium |
| 4 | Install NextAuth + MongoDB deps | 1 | Low | Low |
| 5 | Create MongoDB connection singleton | 1 | Low | Low |
| 6 | Configure NextAuth (credentials + adapter + JWT) | 1 | Medium | Medium |
| 7 | Create signup API route | 1 | Low | Low |
| 8 | Replace middleware (Supabase → NextAuth) | 1 | Medium | Low |
| 9 | Update auth pages (login, signup, forgot/reset password) | 1 | Medium | Medium |
| 10 | Update providers.tsx (add SessionProvider) | 1 | Low | Low |
| 11 | Update DashboardNav (NextAuth session) | 1 | Low | Low |
| 12 | Create data access layer (lib/db/logs.ts, lib/db/users.ts) | 2 | Low | Medium |
| 13 | Create API routes (logs CRUD + stats + bulk delete, profile) directly against MongoDB | 2 | Medium | Medium |
| 14 | Add HTML sanitization on write (isomorphic-dompurify) | 2 | Low | Low |
| 15 | Update React Query hooks (useLogs, useProfile → fetch API) | 2 | Medium | Medium |
| 16 | Create useLogMutations.ts (consolidated: create, update, delete, bulk delete) | 2 | Low | Low |
| 17 | Update all page components to use API-backed hooks | 2 | Medium | Medium |
| 18 | Replace real-time subs with polling (refetchInterval: 30s) | 2 | Low | Low |
| 19 | Write data migration script | 3 | High | Medium |
| 20 | Remove all Supabase code, deps, and env vars | 3 | Medium | Low |
| 21 | Post-migration fixes (types, error boundaries, loading states, dead code) | 3 | Low | Medium |
| 22 | Add tests (future) | — | Low | High |

---

## 5. File Change Manifest

### Files to CREATE
```
lib/mongodb.ts                           — MongoDB connection singleton
lib/auth.ts                              — NextAuth config & helpers
lib/validation.ts                        — Zod schemas for logs, profile, auth
lib/db/logs.ts                           — Logs data access layer (raw mongodb driver)
lib/db/users.ts                          — Users data access layer (raw mongodb driver)
app/api/auth/[...nextauth]/route.ts      — NextAuth route handler
app/api/auth/signup/route.ts             — Registration endpoint
app/api/logs/route.ts                    — GET (list) + POST (create) + DELETE (bulk, body: { ids })
app/api/logs/stats/route.ts             — GET (aggregated dashboard stats)
app/api/logs/[id]/route.ts              — GET + PATCH + DELETE (single)
app/api/profile/route.ts                — GET + PATCH (includes entry types & preferences)
components/LogForm.tsx                   — Shared log form (create/edit)
components/logs/LogsFilter.tsx           — Search, date pickers, type filters
components/logs/LogsTable.tsx            — Desktop table view
components/logs/LogsMobileList.tsx       — Mobile card list
components/logs/LogsPagination.tsx       — Pagination controls
components/logs/LogsBulkActions.tsx      — Selection mode, bulk delete, export
components/logs/ActiveFilters.tsx        — Active filter badges
app/error.tsx                            — Global error boundary
app/dashboard/error.tsx                  — Dashboard error boundary
app/dashboard/logs/error.tsx             — Logs error boundary
lib/hooks/useLogMutations.ts            — All log mutations: useCreateLog, useUpdateLog, useDeleteLog, useBulkDeleteLogs
scripts/migrate-data.ts                  — One-time Supabase → MongoDB migration
```

### Files to MODIFY
```
middleware.ts                            — Supabase session → NextAuth getToken()
app/providers.tsx                        — Add SessionProvider
app/page.tsx                             — getServerSession() instead of Supabase
app/login/page.tsx                       — NextAuth signIn()
app/signup/page.tsx                      — POST to /api/auth/signup
app/forgot-password/page.tsx             — API call (if email service configured)
app/reset-password/page.tsx              — API call
app/dashboard/layout.tsx                 — getServerSession() for auth guard
app/dashboard/page.tsx                   — Remove Supabase client & real-time sub, use hooks
app/dashboard/logs/page.tsx              — Decompose into sub-components + use mutation hooks
app/dashboard/logs/new/page.tsx          — Thin wrapper around LogForm + useCreateLog
app/dashboard/logs/[id]/edit/page.tsx    — Thin wrapper around LogForm + useUpdateLog
app/dashboard/settings/page.tsx          — API routes for profile/preferences/entry types
components/DashboardNav.tsx              — NextAuth useSession()/signOut()
lib/hooks/useLogs.ts                     — fetch() + polling instead of Supabase + real-time
lib/hooks/useProfile.ts                  — fetch() instead of Supabase
lib/types.ts                             — Fix todos: Todo[] | null; remove user_email from Log type
package.json                             — Swap dependencies
```

### Files to DELETE
```
lib/supabase/client.ts                   — Replaced by API routes
lib/supabase/server.ts                   — Replaced by getServerSession()
lib/supabase/middleware.ts               — Replaced by NextAuth middleware
lib/hooks/useVirtualScroll.ts            — Dead code (unused)
supabase/                                — Entire directory (migrations, functions)
```

### Files UNCHANGED
```
components/ui/*                          — Shadcn UI primitives
components/DatePicker.tsx
components/EmptyState.tsx
components/InlineEditTitle.tsx
components/LogCard.tsx
components/LogsTableSkeleton.tsx
components/MarkdownToolbar.tsx
components/NotificationCard.tsx
components/RichTextEditor.tsx
lib/constants.ts
lib/utils.ts
lib/hooks/useDebounce.ts
lib/theme-context.tsx
app/globals.css
tailwind.config.js
postcss.config.js
next.config.js
```

---

## 6. Key Design Decisions (from review)

| Decision | Rationale |
|----------|-----------|
| **No API routes in Phase 0** | Avoid building backend twice (once against Supabase, once against MongoDB). Build API routes directly against MongoDB in Phase 2. |
| **Raw `mongodb` driver, not Mongoose** | Simpler stack. Zod handles validation. No model recompilation quirks in Next.js dev. Smaller bundle. |
| **NextAuth adapter `users` collection + custom fields** | Single source of truth. `passwordHash` lives on the same document NextAuth manages. No split persistence. |
| **Sanitize on write only** | API route is the authoritative boundary. No render-side sanitization (avoids redundancy, UX issues). Legacy rows sanitized in migration script. |
| **11 API endpoints** | Bulk export is client-side Blob (no network). Stats endpoint reinstated — dashboard limit(100) is a correctness bug. Bulk delete gets its own method on `/api/logs`. |
| **`/api/logs/stats` reinstated** | Dashboard computes streak/distribution from `.limit(100)` — wrong with >100 logs. Aggregation pipeline server-side is the only correct fix. |
| **`DELETE /api/logs` with `{ ids[] }` body** | Single DB round-trip vs N parallel requests. Not about "overwhelming" the server (fine for personal app at scale) but about correctness and efficiency. |
| **`user_email` dropped** | Exists in Supabase schema and TypeScript type but is **never read in any component** (confirmed by grep). Denormalized for a query pattern that was never built. Remove from MongoDB schema and TypeScript type. |
| **No cursor-based pagination** | `skip()` O(n) only matters at very large scale this app won't reach. Offset pagination keeps page-jumping UX and is simpler. Revisit only if performance becomes measurable. |
| **No optimistic locking / concurrent edit protection** | Single-user personal app. Two-tab simultaneous edits are not a realistic scenario. Last-write-wins is correct. |
| **Bulk export stays client-side** | Already implemented as Blob → `URL.createObjectURL` → `<a>.click()`. No network involved. No timeout risk. No server endpoint needed. |
| **Consolidated mutation hooks in one file** | `useLogMutations.ts` exports `useCreateLog`, `useUpdateLog`, `useDeleteLog`, `useBulkDeleteLogs`. Related mutations in one place; each independently importable. |
| **Polling (30s) instead of real-time** | Adequate for single-user work log. Eliminates Supabase channel complexity. `refetchIntervalInBackground: false` avoids background churn. |
| **ObjectId validation in all API routes** | Malformed id params throw MongoDB cast errors without this. Validate with `ObjectId.isValid(id)` before any DB call, return 400 if invalid. |
| **Standardised error response format** | All API routes return `{ error: string, message: string, code: number }` on failure. Consistent for React Query `onError` handlers and future debugging. |
| **Rate limiting on auth endpoints** | `/api/auth/signup` and NextAuth's credentials endpoint need rate limiting. Use `next-rate-limit` or middleware-level IP throttling to prevent brute-force. |
| **Middleware excludes `/api/auth/*`** | NextAuth needs its own routes unprotected. Only `/dashboard/*` requires auth check. |
| **Custom entry types fixed during Phase 2** | Stored in MongoDB users document instead of localStorage. No rework — goes directly to the right backing store. |
