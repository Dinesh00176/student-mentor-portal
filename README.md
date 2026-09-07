# MentorPath — Student Mentoring and Counseling Management System

A centralized platform for colleges/universities that lets mentors and counselors
track a student's academic progress, attendance, counseling history, mentor
remarks, interventions, and follow-ups in one place — built to answer:

> **Which students need my attention, why, what's been done, and what's next?**

Built on the **MERN stack**: MongoDB, Express.js, React (Vite), Node.js.

**Version 2** adds account status (active/inactive/suspended), password
management (change/forgot/reset), a student→mentor appointment/meeting-request
workflow, audit logging, generated notifications, admin edit/search/status UI
for mentors and counselors, dashboard charts, and CSV-exportable, filterable
reports — all additive to the original V1 architecture (see §12 below for the
full list).

---

## 1. Project Structure

```
student-mentoring-system/
├── backend/     Express + Mongoose API
├── frontend/    React + Vite client
├── README.md
└── .gitignore
```

See `backend/` and `frontend/` for their own folder breakdowns below.

---

## 2. Prerequisites

- Node.js 18+
- npm 9+
- A running MongoDB instance — either:
  - Local MongoDB (`mongod` on `mongodb://127.0.0.1:27017`), or
  - A free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (recommended if you don't want to install MongoDB locally)

---

## 3. Backend Setup

```bash
cd backend
cp .env.example .env
# edit .env: set MONGO_URI and a real JWT_SECRET
npm install
npm run seed   # creates demo data (departments, admin, mentors, counselor, students)
npm run dev    # starts the API on http://localhost:5000 with nodemon
```

### Backend environment variables (`backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | API port (default `5000`) |
| `NODE_ENV` | `development` or `production` |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random secret used to sign JWTs — **never commit a real value** |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `8h` |
| `CLIENT_ORIGIN` | Frontend origin allowed by CORS, e.g. `http://localhost:5173` |
| `GEMINI_API_KEY` | Optional — only needed for the "Generate Progress Summary" AI feature (Google Gemini) |
| `GEMINI_MODEL` | Optional — defaults to `gemini-2.0-flash` |

### Demo credentials (after running `npm run seed`)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@campus.edu` | `Admin@123` |
| Mentor | `arvind.mentor@campus.edu` | `Mentor@123` |
| Counselor | `divya.counselor@campus.edu` | `Counselor@123` |
| Student (Needs Attention) | `cse2023002@campus.edu` | `Student@123` |
| Student (High Priority) | `cse2023003@campus.edu` | `Student@123` |

---

## 4. Frontend Setup

```bash
cd frontend
cp .env.example .env
# edit .env if your API isn't on http://localhost:5000/api
npm install
npm run dev    # starts Vite dev server on http://localhost:5173
```

### Frontend environment variables (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API, e.g. `http://localhost:5000/api` |

---

## 5. Production Build

```bash
# Backend
cd backend
npm install --omit=dev
NODE_ENV=production npm start

# Frontend
cd frontend
npm install
npm run build      # outputs static files to frontend/dist
npm run preview    # optional local preview of the production build
```

Serve `frontend/dist` from any static host (Nginx, Vercel, Netlify, S3+CloudFront,
etc.) and point `VITE_API_BASE_URL` at your deployed backend's `/api` root before
building. Deploy the backend to any Node host (Render, Railway, Fly.io, a VM,
etc.) with the environment variables above set, and a MongoDB Atlas connection
string in `MONGO_URI`.

---

## 6. API Overview

All endpoints are mounted under `/api`. Every response uses the envelope:
```json
{ "success": true, "message": "...", "data": { ... } }
```

| Resource | Base route |
|---|---|
| Auth | `/api/auth` (`POST /login`, `POST /logout`, `GET /me`, `PATCH /change-password`, `POST /forgot-password`, `POST /reset-password`) |
| Departments | `/api/departments` |
| Students | `/api/students` (+ `/:id/attention`, `/:id/activity`, `/:id/assign-mentor`) |
| Mentors | `/api/mentors` (+ `/:id/status` for active/inactive/suspended) |
| Counselors | `/api/counselors` (+ `/:id/status`) |
| Academic records | `/api/academic` |
| Attendance | `/api/attendance` |
| Counseling | `/api/counseling` |
| Mentor remarks | `/api/remarks` |
| Interventions | `/api/interventions` |
| Follow-ups | `/api/followups` |
| Appointments | `/api/appointments` (student meeting requests + accept/reject/reschedule/complete) |
| Dashboards | `/api/dashboard/admin`, `/mentor`, `/student`, `/counselor` |
| Notifications | `/api/notifications` |
| Reports | `/api/reports/*` (supports `?export=csv` and department/year/mentor/date filters) |
| Audit log | `/api/audit-logs` (admin only) |
| Optional AI summary | `/api/ai/summary/:studentId` (Google Gemini) |

All routes except `/api/auth/login` require `Authorization: Bearer <token>`.
Role and ownership checks are enforced **server-side** — the frontend's route
guards are a UX convenience only, never the security boundary.

---

## 7. Student Attention / Risk Indicator

The "Stable / Needs Attention / High Priority" status shown throughout the app
is computed by a **transparent, rule-based engine**
(`backend/services/attentionEngine.js`) from measurable signals only:
attendance percentage, semester GPA, arrear/failed subjects, active
interventions, and repeated or overdue follow-ups. It returns a plain-language
list of reasons alongside the status. It is explicitly **not** a predictive or
diagnostic system and makes no claims about mental health or future behavior.

---

## 8. Optional AI Feature

"Generate Progress Summary" (visible on a student's profile to mentors) is a
single, user-triggered request: the mentor clicks the button, the backend
sends only the already-visible academic/attendance/counseling/intervention
data for that student to **Google's Gemini API** once, and the returned text
is shown labeled **"AI-generated — review before use."** Nothing is
auto-saved or auto-actioned. Requires `GEMINI_API_KEY` to be set; otherwise
the feature returns a clear "not configured" message instead of failing
silently.

---

## 9. Testing Notes

- All backend modules were verified to load without errors (`node -c` syntax
  checks on every file, plus a full require-graph load of `routes/index.js`).
- The frontend was verified to build cleanly with `vite build`.
- The core business logic — the attention/risk engine, GPA calculator, and
  attendance calculator — has a unit test suite covering stable, needs-attention,
  and high-priority scenarios (see the development notes for the test cases;
  add a `backend/tests/` folder with a test runner such as Jest if you want
  these committed as part of CI).
- Live database integration testing requires a reachable MongoDB instance
  (local `mongod` or Atlas) — run `npm run seed` then exercise the API with
  the demo credentials above to verify end-to-end behavior in your own
  environment.

---

## 10. Security Notes

- Passwords are hashed with bcryptjs; plain-text passwords are never stored.
- JWTs are signed with `JWT_SECRET` and carry only `{ id, role }`.
- Every mutating and sensitive-read route is protected by `verifyToken` +
  `requireRole`, plus per-resource ownership checks (e.g. a mentor can only
  read/write students assigned to them).
- Mongoose schema validation + `express-validator`-based request validation
  guard against malformed input; a central error handler ensures stack
  traces, DB errors, and secrets are never sent to the client.
- `.env` is git-ignored; only `.env.example` files (no real secrets) are
  committed.

---

## 11. What's Included / What's Not

**Included:** full auth + RBAC for 4 roles, student/mentor/counselor/department
management, academic + attendance tracking with real calculations, the
attention/risk rule engine, counseling workflow, mentor remarks, intervention
workflow with history, follow-up tracking, role-specific dashboards, an
activity timeline, notifications, admin reports, and an optional non-agentic
AI summary feature.

**Not included (by design, per project scope):** autonomous AI agents,
background jobs/schedulers, real-time chat/video, and any mental-health
diagnostic or predictive claims.

---

## 12. Version 2 Changelog

Everything below was added on top of the original V1 architecture — no
existing files were deleted, no existing routes/behavior were removed, and
the technology stack is unchanged.

**New capabilities:**
- Tri-state account status (`active` / `inactive` / `suspended`) on `User`,
  alongside the original `isActive` flag (kept in sync); suspending or
  deactivating an account takes effect immediately, even for already-issued
  JWTs.
- Password management: change password (authenticated), forgot/reset
  password via a time-limited token (dev mode returns the token directly in
  the response since no email service is configured — documented as a
  placeholder for a real email integration).
- Appointment / meeting-request workflow: students request a meeting with
  their assigned mentor (or a counselor); the recipient can accept, reject,
  reschedule, or complete it. Invalid recipients and past dates are rejected
  server-side.
- Audit logging: an admin-only, append-only log of key administrative
  actions (student/mentor/counselor create/update/status-change, mentor
  assignment, intervention/counseling changes, appointment status changes).
- Automatic notifications on mentor assignment, intervention creation,
  overdue follow-ups (auto-detected on read, no scheduler needed), and
  appointment requests/status changes — plus a notification bell in the app
  shell with mark-read / mark-all-read.
- Admin UI: search + status filter on mentors/counselors, edit modals,
  active/inactive/suspended status toggle with confirmation dialogs on
  destructive actions, "Edit Details" and "Assign/Reassign Mentor" actions on
  a student's profile.
- Reports: filtering (department/year/mentor/date range/status), a new
  "Students Needing Attention" report, and CSV export on every report.
- Lightweight, dependency-free bar charts on the Admin and Mentor dashboards
  (no new charting library).
- A dedicated Counselor dashboard endpoint (total/active cases, scheduled/
  completed sessions, pending appointments).
- Request validation via `express-validator`, wired into the previously
  unused `validators/` folder and `validate.js` middleware.
- Basic rate limiting on login/forgot-password (`express-rate-limit`) to
  slow brute-force attempts.
- **The optional AI summary feature now uses Google's Gemini API instead of
  Anthropic's** (`GEMINI_API_KEY` / `GEMINI_MODEL`), with the same
  single-shot, user-triggered, clearly-labeled, non-agentic contract as
  before.

**Preserved as-is:** all V1 authentication/RBAC, the attention/risk engine,
CRUD for students/academic/attendance/counseling/remarks/interventions/
follow-ups, the original dashboards' core content, the design system, and
every existing route's request/response contract (only additive fields and
new endpoints were introduced).
