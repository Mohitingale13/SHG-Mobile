# SHG Records — Self Help Group Digital Record Platform

A mobile-first record-keeping and governance transparency platform for Self Help Groups (SHGs) built for rural women in Maharashtra, India. Runs as a native Android app and as a web application. Supports English and Marathi.

---

## Features

- Member registration and role management (President, Member)
- Meeting scheduling, attendance tracking, and notes
- Payment declarations and president verification
- Loan management with approval workflow, auto-applied interest, and tiered duration rules
- Loan repayment tracking
- PDF statement generation per member
- Configurable group settings and custom rules (president-only)
- Voice assistant with Android native speech recognition and Groq-powered intent classification
- Full history screen with per-member filtering (president)
- English / Marathi language toggle throughout

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Expo React Native with Expo Router (file-based routing) |
| Backend | Node.js + Express.js REST API |
| Database | PostgreSQL via Supabase (Drizzle ORM) |
| NLP / Voice | Groq API — `llama-3.1-8b-instant` |
| Auth | Token-based sessions (UUID, server-side session map) |
| Language | TypeScript |

---

## Environment Variables

Copy `.env.example` to `.env` and set the following:

| Variable | Required | Description |
|---|---|---|
| `PORT` | No (default 5000) | Port the Express server listens on |
| `SUPABASE_DATABASE_URL` | For persistence | Supabase PostgreSQL connection string (takes priority over `DATABASE_URL`) |
| `DATABASE_URL` | Fallback | Any PostgreSQL connection string. Managed automatically by Replit if using Replit DB. |
| `GROQ_API_KEY` | For voice assistant | API key from [console.groq.com](https://console.groq.com/keys) |
| `SESSION_SECRET` | Recommended | Secret for session signing |

**Without either database variable** the app runs with in-memory storage — data resets on every server restart. Suitable for quick local testing only.

**Database priority:** `SUPABASE_DATABASE_URL` is checked first, then `DATABASE_URL`. This allows Supabase to be used explicitly without touching Replit's managed `DATABASE_URL`.

---

## Local Development Setup

### Prerequisites

- Node.js 22
- npm
- For Android: Android Studio with Android SDK, `adb` in PATH

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values. At minimum set `PORT=5000`.

### 3. Connect Supabase (for persistent data)

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Settings → Database → Connection string → URI** — copy the Transaction pooler URI (port 6543).
3. Add to `.env`:
   ```
   SUPABASE_DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
4. Push the schema:
   ```bash
   npm run db:push
   ```

### 4. Run in development mode

Open two terminals:

**Terminal 1 — Backend (port 5000):**
```bash
npm run server:dev
```

**Terminal 2 — Frontend (port 8081):**
```bash
npm run expo:dev
```

Open **http://localhost:5000** in your browser. The backend proxies all non-API requests to the Expo web server at port 8081 when no static build is present.

---

## Production (Static) Mode

```bash
npm run build:web        # exports Expo web app to web-build/
npm run server:dev       # serves web-build/ + API on port 5000
```

The server detects `web-build/index.html` at startup and serves it statically instead of proxying to Metro.

---

## Android APK

### Requirements

- Android Studio installed
- `%LOCALAPPDATA%\Android\Sdk\platform-tools` in PATH (Windows)
- Developer Options + USB Debugging enabled on device

### 1. Set the API URL (baked into the JS bundle at build time)

```powershell
$env:EXPO_PUBLIC_API_URL = "https://your-deployed-app.replit.app"
```

### 2. Generate the Android native project

```powershell
npx expo prebuild --platform android --clean
```

### 3. Verify Android SDK is detected

```powershell
npx expo doctor
```

### 4. Build and install on a connected device (debug)

```powershell
npx expo run:android --device
```

This installs a debug APK that connects to Metro bundler. Suitable for development and testing.

### 5. Build a standalone release APK (for distribution)

```powershell
cd android
.\gradlew.bat assembleRelease
```

Output: `android\app\build\outputs\apk\release\app-release-unsigned.apk`

Enable **Install from unknown sources** on the target device to sideload this APK. For Play Store distribution, the APK must be signed.

---

## Dependency Versions (Android)

React Native's renderer is compiled against a specific React version. Keep these pinned exactly:

| Package | Version |
|---|---|
| `react` | `19.1.4` |
| `react-dom` | `19.1.4` |
| `react-native` | `0.81.6` |

Use `--save-exact` to prevent npm from upgrading across minor versions:

```bash
npm install react@19.1.4 react-dom@19.1.4 --save-exact --legacy-peer-deps
```

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run server:dev` | Start Express backend in development mode (port 5000) |
| `npm run expo:dev` | Start Expo Metro bundler for web (port 8081) |
| `npm run build:web` | Export Expo web app to `web-build/` for production |
| `npm run server:build` | Bundle Express server via esbuild to `server_dist/` |
| `npm run server:prod` | Run the bundled production server |
| `npm run db:push` | Push Drizzle schema to PostgreSQL database |

---

## Deployment (Replit Autoscale)

The project is configured for Replit Autoscale deployment:

- **Build step:** `npm run build:web && npm run server:build`
  - Exports the Expo web app to `web-build/`
  - Bundles the Express server to `server_dist/`
- **Run step:** `npm run server:prod` (`cross-env NODE_ENV=production node server_dist/index.js`)
- **Port:** `5000`

Set `SUPABASE_DATABASE_URL` and `GROQ_API_KEY` as Secrets in the Replit dashboard before deploying.

---

## Voice Assistant

A floating mic button on the dashboard activates voice navigation.

**On Android (native):**
- Uses `expo-speech-recognition` with `en-IN` or `mr-IN` language code
- No internet required for speech capture — processed on-device by Android

**On Web (Chrome only):**
- Uses the browser's Web Speech API
- Requires Chrome — other browsers show a friendly error

**Intent classification (both platforms):**
- The captured transcript is sent to `POST /api/nlp/classify` (auth-protected)
- The backend calls Groq (`llama-3.1-8b-instant`) to classify intent
- Returns `{ action, route, confidence, replyEn, replyMr }`
- The app navigates to the matched screen and shows the Groq reply

**Supported voice commands:** show dashboard, show meetings, show payments, show loans, show members, show history, show rules, loan settings, request loan.

**`GROQ_API_KEY` stays server-side** — the client never sees it.

---

## Storage Modes

| Condition | Storage Used | Behaviour |
|---|---|---|
| Neither database variable set | `MemStorage` | In-memory, resets on restart |
| `SUPABASE_DATABASE_URL` set | `DatabaseStorage` | Supabase PostgreSQL via Drizzle |
| Only `DATABASE_URL` set | `DatabaseStorage` | Any PostgreSQL via Drizzle |

---

## Project Structure

```
app/
  _layout.tsx          Root layout with providers
  index.tsx            Auth gate (redirects to login or dashboard)
  (auth)/              Login and Register screens
  (main)/              Tab navigation: Dashboard, Meetings, Payments, More
  create-meeting.tsx   Create meeting modal
  meeting/[id].tsx     Meeting detail and attendance
  members.tsx          Member directory
  member/[id].tsx      Member detail with payment and loan history
  loans.tsx            Loan list
  create-loan.tsx      Request loan modal (password-protected, auto interest)
  loan/[id].tsx        Loan detail and repayment tracking
  loan-settings.tsx    President-only: interest rate, max amount, duration rules
  rules.tsx            Group rules (president edits, members view)
  history.tsx          Full history with member filter (president)
contexts/
  AuthContext.tsx      Auth and session management
  LanguageContext.tsx  English / Marathi translations
  DataContext.tsx      All data CRUD via REST API, GroupSettings
lib/
  api.ts               API client (apiGet, apiPost, apiPatch, apiPut)
  nlpHandler.ts        Voice recognition and intent classification
server/
  index.ts             Express server entry point
  routes.ts            All API route definitions
  storage.ts           MemStorage and DatabaseStorage implementations
  db.ts                Drizzle + PostgreSQL connection
shared/
  schema.ts            Drizzle table definitions (single source of truth)
constants/             App colors and translation strings
```

---

## Roles

| Feature | Member | President |
|---|---|---|
| Declare payment | Yes | Yes |
| Verify payments | No | Yes |
| Request loan | Yes | Yes |
| Approve / reject loans | No | Yes |
| Add loan repayment | No | Yes |
| Schedule meetings | No | Yes |
| Edit attendance | No | Yes |
| Manage group settings | No | Yes |
| Edit group rules | No | Yes |
| Remove / reactivate members | No | Yes |
| Generate member PDF statement | No | Yes |

---

## Group Settings (president-configurable)

| Setting | Default |
|---|---|
| Interest rate | 2% |
| Maximum loan amount | Rs. 50,000 |
| Duration rule — up to Rs. 5,000 | 1–6 months |
| Duration rule — up to Rs. 20,000 | 3–12 months |
| Duration rule — up to Rs. 50,000 | 6–24 months |

Interest is applied automatically from group settings when a loan is requested — members do not enter it manually.
