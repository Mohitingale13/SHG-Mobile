# SHG Digital Record Platform

A mobile-first, bilingual (Marathi & English) record-keeping and governance transparency platform for Self Help Groups (SHGs). Built specifically for rural women in Maharashtra, India. It operates as a native Android app with an integrated Super Admin dashboard for centralized management.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Major Features](#2-major-features)
3. [Onboarding Workflow](#3-onboarding-workflow)
4. [Operational Workflow](#4-operational-workflow)
5. [Tech Stack](#5-tech-stack)
6. [Project Structure](#6-project-structure)
7. [Role-Based Access Control](#7-role-based-access-control)
8. [Financial Accounting Engine](#8-financial-accounting-engine)
9. [SHG Cash Flow & Balance Model](#9-shg-cash-flow--balance-model)
10. [Existing SHG Migration](#10-existing-shg-migration)
11. [AI Features](#11-ai-features)
12. [Reports](#12-reports)
13. [Security](#13-security)
14. [Localization](#14-localization)
15. [Automated Background Jobs](#15-automated-background-jobs)
16. [Setup Instructions](#16-setup-instructions)
17. [Building for Android](#17-building-for-android)
18. [Future Improvements](#18-future-improvements)
19. [License](#19-license)

---

## 1. Project Overview

The **SHG Digital Record Platform** digitizes the full financial and operational lifecycle of a Self Help Group. It automates monthly contribution tracking, late fee generation, meeting attendance, and a two-step loan approval workflow.

A key feature is the **AI Voice Assistant**, designed for users with lower digital literacy. By speaking naturally in Marathi or English, members and presidents can navigate to reports, request loans, or check payment statuses without any menu navigation.

The platform consists of:
- **Native Android App** (Expo React Native) — for all SHG members, the treasurer, and the president.
- **Super Admin Web Dashboard** — for NGO staff to centrally manage SHG deployments.

---

## 2. Major Features

### Platform & Administration
- **Super Admin Dashboard (Web)**: Centralized oversight for NGO staff. Create SHGs, generate invitation codes, and monitor all groups from a single panel.
- **Secure Group Code Generation**: Each SHG receives a unique alphanumeric code for secure onboarding.
- **Invitation Code System**: Time-limited, single-use invitation codes control who can register as a member.
- **Group Isolation**: Every data query is scoped to a `groupId`, ensuring complete data separation between SHGs.

### Onboarding
- **Multi-Step Onboarding Flow**: A structured setup wizard guides new presidents through group registration, formation date, opening balances, and settings.
- **Existing SHG Setup**: When an existing (off-app) SHG joins, the president enters current total savings and cash-in-hand as opening balances.
- **30-Day Migration Window**: A time-limited window during which the president (or treasurer) can backfill historical internal loans and bank loans from before the app was set up.
- **Bootstrapped Configuration Guard**: All automated cron jobs (payment generation, late fee calculation) are completely dormant until the president saves their SHG settings for the first time, preventing false "Overdue" alerts on new groups.

### Member & Role Management
- **Role Assignment**: The President can promote any member to the Treasurer role at any time.
- **Member Profiles**: View full payment history, loan history, and personal information per member.
- **Contribution Start Month**: Billing accurately starts from the specific month a member joined, not retroactively.
- **Suspension & Exit**: Members can be suspended or exited while preserving historical ledger integrity.

### Meeting Management
- **Schedule & Track Meetings**: Create meetings with date, agenda, and notes.
- **Attendance Tracking**: Optimistic UI for instant, race-condition-free attendance toggling — checkmarks respond immediately without waiting for the server.
- **Meeting Status Lifecycle**: `Scheduled` → `Completed` or `Cancelled`.

### Monthly Contributions
- **Automatic Monthly Due Generation**: The server automatically generates a `payment_not_received` record for every active member each month (only after settings are saved).
- **Multi-State Payment Flow**: `Payment Not Received` → `Pending` (member declared) → `Pending Verification` (submitted online) → `Confirmed` / `Rejected`.
- **President Override**: The President can reopen a verified payment for correction.
- **QR Payment Support**: Display a group QR code for digital contribution payments.

### Late Fee Automation
- **Programmable Structures**: Fixed amount or daily accrual.
- **Grace Period**: Configurable grace period before late fees start applying.
- **Automatic Calculation**: The server recalculates late fees automatically each cycle.

### Internal Group Loans (Frozen Module)
- **Member Loan Requests**: Any member can apply for a loan from the group's internal savings fund.
- **Two-Step Approval**: Treasurer verifies → President gives final approval.
- **Interest Calculation**: Both Flat Rate and Reducing Balance (monthly resting) methods supported.
- **Integrated Passbook**: Tracks dynamic amortization with exact outstanding balances and separate principal/interest splits per repayment.
- **Atomic Transactions**: Repayments use row-level database locks to prevent race conditions and double-submissions. *(See [Financial Accounting Engine](#8-financial-accounting-engine))*
- **Edit & Delete Repayments**: Instantly recalculates all subsequent ledger entries.

### External Group Bank Loans
- **Bank Loan Registration**: Record large external loans taken by the SHG from a bank.
- **Member Allocation**: Distribute the bank loan principal to individual members using Equal or Custom Distribution.
- **Individual Bank Loan Passbooks**: Each allocated member has their own EMI schedule with real-time interest/principal splits and remaining tenure, calculated using reverse-amortization financial mathematics.

### Dashboard
- **Role-Adaptive Dashboard**: Presidents and treasurers see a management summary; members see their personal dues and loan reminders.
- **Real-Time Financial Summary**: Current Cash Balance, Total Savings, Outstanding Loans, and more — updated in real-time from the ledger.
- **Personal Dues Card**: Shows this month's savings status (Paid / Pending / Overdue) and any active loan installment reminders. Hidden until SHG settings are first saved.
- **Recent Activity Feed**: Live log of the latest payments and loan events.

---

## 3. Onboarding Workflow

```mermaid
graph TD
    A[Super Admin] -->|Creates SHG + Group Code| B(President registers using Group Code)
    B --> C{New or Existing SHG?}
    C -->|New SHG| D[Set Formation Date & Save SHG Settings]
    C -->|Existing SHG| E[Enter Total Savings + Cash in Hand as Opening Balances]
    E --> F[Save SHG Settings]
    D --> G[Add Members via Invitation Codes]
    F --> G
    G --> H[Assign Treasurer Role to a Member]
    H --> I{Existing SHG Only}
    I -->|Within 30 days| J[President/Treasurer enters old Internal Loans]
    I -->|Within 30 days| K[President/Treasurer enters old Bank Loans]
    J --> L[SHG Fully Operational]
    K --> L
```

---

## 4. Operational Workflow

```mermaid
graph TD
    G{Operational Workflows} -->|Schedule & Record| H(Meetings & Attendance)
    G -->|Declare & Verify| I(Monthly Contributions)
    G -->|Request, Verify & Approve| J(Internal Loans)
    G -->|Create & Allocate| K(Group Bank Loans)
    G -->|Speak or Type| L(AI Voice Assistant)
    G -->|Generate Localized| M(PDF Reports)
```

---

## 5. Tech Stack

| Layer | Technology |
|---|---|
| **Frontend / Mobile** | Expo React Native (v54), Expo Router, React (v19.1) |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL |
| **ORM** | Drizzle ORM |
| **Authentication** | Token-based sessions with UUIDs |
| **AI / NLP** | Groq API (`llama-3.1-8b-instant`), Android Native Speech Recognition |
| **PDF Generation** | Expo Print (`expo-print`) |
| **Language** | TypeScript |
| **Deployment** | Web-build proxy serving, esbuild, Android APK/AAB |

### Key Libraries
- `@expo-google-fonts/poppins`, `@expo/vector-icons`
- `@react-native-async-storage/async-storage`
- `drizzle-orm`, `drizzle-zod`
- `expo-router`, `expo-speech-recognition`, `expo-print`
- `express`, `pg`
- `groq-sdk`
- `zod`

---

## 6. Project Structure

```text
app/
  _layout.tsx                       Root layout and context providers
  index.tsx                         Auth gate & redirect logic
  (auth)/
    welcome.tsx                     Landing screen for new users
    login.tsx                       Login screen
    register.tsx                    Member registration with invitation code
    create-account.tsx              Multi-step account creation (name, phone, password)
    verify-group.tsx                Group code verification for President onboarding
    formation-date.tsx              SHG formation date entry
    existing-shg-setup.tsx          Opening balances entry for existing SHGs
    activation.tsx                  Account activation flow
    change-password.tsx             Password change screen
  (main)/
    _layout.tsx                     Tab navigator layout
    index.tsx                       Main dashboard (role-adaptive)
    meetings.tsx                    Meeting list & scheduling
    payments.tsx                    Contribution management (declare, verify, delete)
    more.tsx                        Settings, profile, and utilities
  (super-admin)/
    index.tsx                       Super Admin web dashboard
  create-loan.tsx                   Internal loan request + Old Record Entry (migration)
  create-meeting.tsx                Meeting scheduling
  create-bank-loan.tsx              Group Bank Loan creation + Old Record Entry (migration)
  history.tsx                       Presidential audit history
  loan/[id].tsx                     Internal loan detail, passbook & repayment entry
  loan-settings.tsx                 Group loan configuration (interest rate, method)
  bank-loans.tsx                    Directory of all active & closed bank loans
  bank-loan/[id].tsx                Bank loan details & member allocation
  bank-loan/allocation/[id].tsx     Member's individual bank loan passbook
  member/[id].tsx                   Member profile, payment history, loan history
  members.tsx                       Member directory & role management
  reports.tsx                       Configurable reporting UI (11 report types)
  rules.tsx                         Group governance rules
  shg-settings.tsx                  SHG operational settings (contributions, late fees)

components/
  ConfirmDialog.tsx                  Reusable confirmation modal (with loading state)
  FilterPicker.tsx                   Reusable filter dropdown
  SHGDatePicker.tsx                  Date picker component
  ...

contexts/
  AuthContext.tsx                    Session management, role flags (isPresident, isTreasurer)
  DataContext.tsx                    Data caching, optimistic updates, and API mutations
  LanguageContext.tsx                Localization engine (English / Marathi), 2,300+ translation keys

lib/
  api.ts                             Fetch wrapper & API utilities
  nlpHandler.ts                      Voice recognition & Groq LLM routing
  pdf-generator.ts                   HTML-to-PDF rendering logic

server/
  index.ts                           Express entry point
  routes.ts                          Main API definitions (~2,100 lines)
  super-admin-routes.ts              Super Admin API definitions
  invitation-routes.ts               Invitation code management APIs
  storage.ts                         Drizzle DB storage implementations
  db.ts                              PostgreSQL connection
  db-init.ts                         Super Admin initialization
  cron.ts                            Automated payment & late fee generation

shared/
  schema.ts                          Drizzle ORM schema (Single Source of Truth)
  accounting.ts                      🔒 FROZEN — Internal loan amortization engine
  bankLoanAccounting.ts              Financial math & amortization for Bank Loans

docs/
  INTERNAL_LOAN_ACCOUNTING_SPEC.md   🔒 Frozen architecture spec for the loan engine
```

---

## 7. Role-Based Access Control

The platform has four distinct roles with strictly enforced backend and frontend permissions:

| Action | Super Admin | President | Treasurer | Member |
|---|:---:|:---:|:---:|:---:|
| Create / Delete SHG | ✅ | — | — | — |
| Generate Invitation Codes | ✅ | — | — | — |
| Save SHG Settings | — | ✅ | — | — |
| Assign Treasurer Role | — | ✅ | — | — |
| Enter Old Record (Migration) | — | ✅ | ✅* | — |
| Create Group Bank Loan | — | ✅ | ✅* | — |
| Schedule / Edit Meeting | — | ✅ | — | — |
| Mark Attendance | — | ✅ | ✅ | — |
| Verify / Reject Payments | — | ✅ | ✅ | — |
| Reopen Confirmed Payment | — | ✅ | — | — |
| Delete Payment Record | — | ✅ | — | — |
| Treasurer-Verify Loan | — | — | ✅ | — |
| Final Approve / Reject Loan | — | ✅ | — | — |
| Declare Monthly Payment | — | ✅ | ✅ | ✅ |
| Request Internal Loan | — | ✅ | ✅ | ✅ |
| View Own Payment History | — | ✅ | ✅ | ✅ |

*\* Only if the President has assigned a Treasurer. Access is lost if no Treasurer is assigned.*

### Backend Middleware
- `requireAuth` — validates Bearer token session for all protected routes.
- `requirePresident` — restricts to `president` role only.
- `requirePresidentOrTreasurer` — restricts to `president` or `treasurer` role.

---

## 8. Financial Accounting Engine

> **⚠️ FROZEN MODULE** — `shared/accounting.ts`, `recordLoanRepayment` in `server/storage.ts`, and the `loan_ledger` table schema are frozen infrastructure. See `docs/INTERNAL_LOAN_ACCOUNTING_SPEC.md` for the full specification.

The internal loan engine uses the **Reducing Balance Method (Monthly Resting)**:

| Formula | Value |
|---|---|
| Opening Principal | `previousLedger.closingPrincipal` |
| Interest Charged | `openingPrincipal × (monthlyRate / 100)` |
| Total Interest Due | `interestCharged + previousLedger.outstandingInterest` |
| Interest Paid | `min(paymentReceived, totalInterestDue)` |
| Principal Paid | `min(paymentReceived - interestPaid, openingPrincipal)` |
| Closing Principal | `openingPrincipal - principalPaid` |
| Outstanding Interest | `totalInterestDue - interestPaid` |

**Key architectural guarantees:**
- **Atomic transactions** with row-level locking prevent race conditions on concurrent repayments.
- **Immutable ledger** — the `loan_ledger` table is append-only. The `loans` table is a cached snapshot derived from the ledger.
- **Zero-floor balance** — principal can never become negative.

---

## 9. SHG Cash Flow & Balance Model

The **Current Cash Balance** (Cash in Hand) is calculated from first principles using the ledger:

```
Current Balance =
    Opening Cash in Hand (entered during setup)
  + Operational Savings (new savings collected after app start)
  + Late Fees Collected
  + Internal Loan Repayments (principal + interest returned to fund)
  - Internal Loans Disbursed (only loans approved in-app, not migrated)
```

**Key Design Decision:**
- **Total Savings** is the immutable source of truth for the overall savings pool.
- Historical (migrated) loans are excluded from the cash flow calculation since their cash impact is already captured in the **Opening Cash in Hand** entered during setup.
- **Group Bank Loans** are an entirely separate module and do not affect the internal cash balance.

---

## 10. Existing SHG Migration

When an SHG that has been operating offline joins the platform, it needs to digitize its historical records. The system provides a **30-Day Migration Window** from the date of group setup.

### What can be migrated
- **Old Internal Loans**: Loans taken before the app. Enter the original amount, duration, and choose between `Still Active` (with outstanding principal) or `Fully Repaid`.
- **Old Group Bank Loans**: Bank loans taken before the app. Choose `Still Active` or `Fully Repaid`.

### Who can enter migration data
- The **President** always has access.
- The **Treasurer** (if assigned) also has full access to help share the data entry workload.

### Migration window enforcement
- The 30-day expiry is enforced on both the **frontend** (UI is hidden after expiry) and the **backend** (API returns `403 migrationWindowExpired`).
- Migrated internal loans are tagged with `resolutionNo: "MIGRATED"` and excluded from the live cash-flow calculation to prevent double-counting with opening balances.

---

## 11. AI Features

The platform includes a native **Voice Assistant** to help users navigate using natural language.

- **Voice Recognition**: Uses `expo-speech-recognition` for native on-device audio capture on Android.
- **Groq LLM**: Transcripts are sent to the backend and processed via Groq API (`llama-3.1-8b-instant`).
- **Intent Classification**: The LLM maps the user's spoken intent to specific app routes (e.g., "savings report dikhao" → `/reports`).
- **Bilingual**: Supports both Marathi and English voice inputs. Returns localized AI responses.

---

## 12. Reports

The application provides **11 report types** exportable as fully localized PDFs, organized into three collapsible categories:

### Standard SHG Registers
| Report | Description |
|---|---|
| **Cash Book** | Running physical cash balance tracking |
| **Bank Book** | Running bank balance tracking |
| **SHG Financial Report** | Overall financial position (Income, Expenses, Assets, Liabilities) |

### Operational Ledgers
| Report | Description |
|---|---|
| **Monthly Savings Report** | Breakdown of member contributions and late fees |
| **Internal Loan Register** | Record of internal SHG loans and recovery metrics |
| **Group Bank Loan Register** | Record of external bank loans and member allocations |
| **Loan Recovery Report** | Monthly monitoring of loan recoveries |

### Administrative Registers
| Report | Description |
|---|---|
| **Member Passbook** | Individual combined savings and loan passbook |
| **Member Register** | Master roster of all active and former members |
| **Meeting Register** | Log of all scheduled and completed SHG meetings |
| **Annual SHG Report** | Comprehensive year-end statistical report for auditing |

**Dynamic Filtering:**
- Custom time ranges: Monthly, Quarterly, Half-Yearly, Annual, and Custom Date ranges.
- Report-specific filters: Payment Method, Loan Status, Select Member.
- PDFs automatically respect all applied filters and generate in the user's active language.

---

## 13. Security

- **Role-Based Permissions**: Strict backend middleware (`requireAuth`, `requirePresident`, `requirePresidentOrTreasurer`) and frontend guards on every protected screen and action.
- **Group Isolation**: Every API query is scoped to the authenticated user's `groupId`. No cross-SHG data access is possible.
- **Invitation Codes**: Time-limited and single-use codes prevent unauthorized member registration.
- **Group Codes**: Required for claiming the President role during initial onboarding.
- **Environment Variables**: All sensitive credentials (Super Admin login, Groq API key, database URL) are managed exclusively via `.env` and are never bundled into the client.
- **Soft Deletion**: Members use status flags (`suspended`, `inactive`) instead of hard deletes to preserve historical ledger integrity.
- **Atomic DB Transactions**: All financial writes (loan repayments) use PostgreSQL row-level locking to prevent race conditions.

---

## 14. Localization

The platform is built from the ground up for full bilingual usage across **Marathi** and **English**.

- **Scope**: The entire UI, validation messages, alert dialogs, confirmation modals, generated PDFs, and AI Voice Assistant responses are fully localized.
- **Implementation**: All strings route through `LanguageContext.tsx` using `t("key")`. The translation dictionary contains **2,300+ keys** organized hierarchically.
- **PDF Generation**: Extensive dynamic parsing maps every column header, status badge, and label inside all 11 PDF reports to the user's preferred language.
- **User Preference**: Language selection is persistent per device and synced to the backend profile.
- **Fallback Strategy**: If a translation key is missing, the engine falls back to last-segment lookup, then `underscore_to_Title Case` formatting — ensuring the UI never shows raw code strings to users.

---

## 15. Automated Background Jobs

The `server/cron.ts` file runs two automated jobs on the server:

### 1. Monthly Payment Generation
**Trigger**: Runs periodically.  
**Action**: For every active member in every configured SHG, checks if a payment record exists for the current month. If not, creates a `payment_not_received` record.  
**Guard**: Completely skipped if `groupSettings.setupProgress.settings` is not `true`. This ensures no false "Overdue" alerts are generated for groups still in the setup phase.

### 2. Late Fee Calculation
**Trigger**: Runs periodically.  
**Action**: For every pending/overdue payment past the configured grace period, recalculates and updates the late fee amount (fixed or daily accrual).  
**Guard**: Also skipped if SHG settings have not been saved.

---

## 16. Setup Instructions

### Prerequisites
- Node.js 22+
- npm
- Android Studio / SDK (for mobile builds)
- PostgreSQL database (Supabase recommended)

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
# Server
PORT=5000

# Database (Supabase or any Postgres instance)
DATABASE_URL=postgresql://postgres:password@host:5432/dbname

# Security & API
SESSION_SECRET=your_secure_random_secret
GROQ_API_KEY=your_groq_api_key

# Frontend API Endpoint (use your machine's local IP for device testing)
EXPO_PUBLIC_API_URL=http://192.168.x.x:5000

# Super Admin Credentials (set once on first run)
SUPER_ADMIN_PHONE=9999999999
SUPER_ADMIN_PASSWORD=your_secure_password
SUPER_ADMIN_NAME=NGO Admin
```

### 3. Initialize the Database
```bash
npm run db:push
```

### 4. Run Development Servers
Open two separate terminals:

**Terminal 1 — Backend:**
```bash
npm run server:dev
```

**Terminal 2 — Frontend / Expo:**
```bash
npm run expo:dev
```
Then scan the QR code with the Expo Go app on your Android device, or open in a simulator.

---

## 17. Building for Android

To generate an APK for testing or a production release:

```bash
# Using EAS Build (recommended)
npx eas build --platform android --profile preview

# Or using a local build
npx expo export --platform android
cd android
./gradlew assembleRelease
```

---

## 18. Future Improvements

- **SMS/WhatsApp Integration**: Automated notifications for pending payments and upcoming meetings.
- **Bank Account Integration**: Export disbursement files compatible with direct banking APIs.
- **Cloud Backup**: Automated, end-to-end encrypted backup of group financial records.
- **iOS Support**: Minor native module adjustments would enable full iOS deployment.
- **Offline Mode**: Local-first data storage with conflict resolution for areas with intermittent connectivity.

---

## 19. License

[MIT License](LICENSE)

---

*Developed as a digital infrastructure project for rural financial empowerment in Maharashtra, India.*
