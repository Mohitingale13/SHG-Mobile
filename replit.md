# SHG Digital Record Platform

## Overview
A mobile-first record-keeping and governance transparency platform for Self Help Groups (SHG) for rural women in Maharashtra. This is NOT a banking app - it tracks records of savings, meetings, loans, and group governance.

## Tech Stack
- **Frontend**: Expo React Native with Expo Router (file-based routing)
- **Backend**: Express.js REST API (all data lives server-side)
- **Storage**: Dual-mode — MemStorage (in-memory, no config) or DatabaseStorage (PostgreSQL/Supabase via Drizzle ORM). Automatically selected based on `DATABASE_URL` env var.
- **Auth**: Token-based sessions (UUID tokens, server-side session map, only token stored in AsyncStorage)
- **Language**: TypeScript
- **Font**: Poppins (via @expo-google-fonts/poppins)

## Architecture
- **Contexts**: AuthContext (user/group auth via API), LanguageContext (EN/MR), DataContext (all data via REST API)
- **API Client**: `lib/api.ts` — `apiGet`, `apiPost`, `apiPatch`, `apiPut` with automatic Bearer token injection
- **Roles**: President (admin of group), Member
- **Group System**: Unique Group IDs, isolated data per group
- **Localization**: English and Marathi throughout

## Backend API Endpoints (all prefixed /api)
- POST /api/auth/register/president — create group + president account
- POST /api/auth/register/member — join existing group as member
- POST /api/auth/login — returns session token
- POST /api/auth/logout — invalidates token
- GET  /api/auth/session — restore session from token
- POST /api/auth/verify-password — verify current user's password
- GET/POST /api/groups/:groupId/meetings — list or create meetings
- PATCH /api/meetings/:meetingId — update meeting (attendance, status, etc.)
- GET/POST /api/groups/:groupId/payments — list or declare payments
- PATCH /api/payments/:paymentId — verify/reject payment (president)
- GET/POST /api/groups/:groupId/loans — list or request loans
- PATCH /api/loans/:loanId/approve — approve loan (president)
- PATCH /api/loans/:loanId/reject — reject loan (president)
- GET/POST /api/loans/:loanId/repayments — list or add repayments
- GET /api/groups/:groupId/repayments — all repayments for group
- GET/PUT /api/groups/:groupId/settings — group loan settings
- GET/PUT /api/groups/:groupId/rules — group rules text
- GET /api/groups/:groupId/members — list members
- PATCH /api/members/:memberId/status — toggle member active/left (president)

## Storage Layer (server/storage.ts)
IStorage interface with two implementations:
- `MemStorage` — in-memory, used when `DATABASE_URL` is not set
- `DatabaseStorage` — Drizzle ORM + PostgreSQL/Supabase, used when `DATABASE_URL` is set
- Covers: Sessions, Users, Groups, Meetings, Payments, Loans, LoanRepayments, GroupSettings, GroupRules
- Schema defined in `shared/schema.ts` (Drizzle); push with `npm run db:push`
- Database connection initialized in `server/db.ts`

## App Structure
```
app/
  _layout.tsx        - Root layout with providers
  index.tsx          - Auth gate
  (auth)/            - Login & Register screens
  (main)/            - Tab navigation (Dashboard, Meetings, Payments, More)
  create-meeting.tsx - Create meeting modal
  meeting/[id].tsx   - Meeting detail
  members.tsx        - Member directory
  member/[id].tsx    - Member detail with history
  loans.tsx          - Loan list
  create-loan.tsx    - Request loan modal (password-protected, auto interest)
  loan/[id].tsx      - Loan detail
  loan-settings.tsx  - President-only: configure interest rate, max loan amount, duration rules
  rules.tsx          - Group rules
  history.tsx        - Full history (payments, loans, meetings)
contexts/
  AuthContext.tsx     - Auth & session management (includes verifyPassword)
  LanguageContext.tsx - EN/MR translations
  DataContext.tsx     - All data CRUD operations + GroupSettings
```

## Key Features
- President creates group with unique ID, members join via group ID
- Dashboard stat cards are clickable (navigate to Members, Meetings, Payments, Loans)
- Dashboard unified recent activity feed (payments + loans + meetings combined)
- Meeting management (create, edit, cancel, attendance tracking)
- Payment tracking (member declares, president verifies)
- Loan records (request with password verification, approve, repayment tracking)
- Loan Settings (president-only): configurable interest rate, max loan amount, duration rules per tier
- Interest rate auto-applied from group settings — not entered per loan
- Max loan amount validation in both DataContext and UI with clear error messages
- Duration rules tied to loan amount (small → short, large → longer); validated on request
- History screen with filterable payment/loan/meeting records (president can filter by member)
- Member detail page shows full payment & loan history with dates
- PDF statement generation for members
- Group rules (president edits, members view)
- English/Marathi language toggle
- **Voice Assistant**: floating mic button on dashboard; uses browser Web Speech API (no native deps) to capture speech in English or Marathi, sends transcript to backend `/api/nlp/classify` (Gemini 1.5 Flash), then navigates to the correct screen

## Voice Assistant
- **Frontend**: `lib/nlpHandler.ts` — `startVoiceRecognition()` (Web Speech API, `mr-IN`/`en-IN`), `classifyIntent()` (calls backend), `processVoiceCommand()`
- **Backend**: `POST /api/nlp/classify` (auth-protected) — calls Gemini 1.5 Flash; returns `{ action, route, confidence, replyEn, replyMr }`
- **Supported intents**: VIEW_DASHBOARD, VIEW_MEETINGS, VIEW_PAYMENTS, VIEW_LOANS, VIEW_MEMBERS, VIEW_HISTORY, VIEW_RULES, LOAN_SETTINGS, REQUEST_LOAN, UNKNOWN
- **Mic button states**: idle (blue) → listening (red, pulsing) → processing (teal) → result (green) or error (red)
- **Overlay**: shows "Listening…" / transcript / Gemini reply while active
- **Security**: `GEMINI_API_KEY` stays on server; browser never sees it
- **Browser support**: Chrome (desktop/Android) required for Web Speech API; shows friendly error in other browsers

## GroupSettings (stored server-side per group)
- interestRate: number (%) — default 2%
- maxLoanAmount: number (Rs.) — default Rs. 50,000
- durationRules: DurationRule[] — default 3 tiers:
  - Up to Rs. 5,000 → 1–6 months
  - Up to Rs. 20,000 → 3–12 months
  - Up to Rs. 50,000 → 6–24 months

## Running the Project

### Production / Static mode (recommended)
```
npm install
npm run build:web      # generates web-build/ from Expo static export
npm run server:dev     # serves web-build/ + API on port 5000
```
Open http://localhost:5000 — no Expo dev server required.

### Development mode (hot reload)
Start both workflows:
- Start Backend (port 5000) — Express API + proxy to Expo dev server
- Start Frontend (port 8081) — Expo Metro bundler with hot reload

The backend auto-detects: if `web-build/index.html` exists → serve static; otherwise → proxy to port 8081.

## Recent Changes
- Fixed data loading resilience: replaced `Promise.all` with `Promise.allSettled` in DataContext so individual API endpoint failures don't crash the entire data load; each endpoint is loaded independently with fallback to previous state
- Bug fix: after registration/login, all 7 data endpoints (meetings, payments, loans, repayments, members, rules, settings) now all load correctly and independently
- Member group validation confirmed working: joining with a non-existent group ID returns `groupNotFound` error, displayed in UI as "Group ID not found"
- President can declare their own payments (not just members)
- Phone number limited to exactly 10 digits on login and register screens
- President can remove/reactivate members from member list screen
- Added static web build support: `npm run build:web` exports to `web-build/` via `expo export --platform web`
- Backend auto-detects: serves `web-build/` statically when present, falls back to proxy for dev mode
- Removed Expo Go QR code landing page; backend now proxies non-API requests to Expo web dev server
- App runs as a normal web application — no QR scanning required
- Initial build: Full SHG platform with auth, meetings, payments, loans, rules, members, language toggle
- Added clickable dashboard stat cards for quick navigation
- Added password authentication requirement before loan requests (modal verification)
- Created History screen accessible from More tab (filterable by member for president)
- Enhanced member detail page with full payment & loan history sections
- AuthContext now includes verifyPassword method
- Dashboard: unified Recent Activity feed combining payments, loans, meetings
- Loan Settings screen: president can configure interest rate, max loan amount, and tiered duration rules
- create-loan: removed manual interest field, auto-applies group interest, shows policy card and duration hints
- DataContext: GroupSettings interface, validateLoanRequest, getDurationRuleForAmount exported helpers
- Member PDF statement: professionally formatted with header, member details, summary cards (including total repaid), savings history, loan history with repayments, attendance records, and fine history.
- Member Detail Page: Quick stats for payments, loans, and attendance; history sections for payments and loans; toggle status (Active/Left).
- Voice Assistant: floating mic button added to dashboard; Web Speech API (no native packages) captures speech in en-IN/mr-IN; transcript sent to backend POST /api/nlp/classify which calls Gemini 1.5 Flash to classify intent and return a navigation route; animated overlay shows listening/processing/result states; GEMINI_API_KEY stays server-side; requires Chrome browser.
