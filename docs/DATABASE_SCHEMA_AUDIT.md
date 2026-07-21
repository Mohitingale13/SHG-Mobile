# Database Schema Audit
*SHG Mobile App — Complete Reference*
*Last Updated: July 21, 2026*

---

## Overview

This document is the authoritative reference for every table in the SHG Mobile App database. It covers the purpose, key fields, and relationships of each table, along with confirmed findings on schema health.

The database is a PostgreSQL instance managed via Drizzle ORM. All table definitions live in `shared/schema.ts`.

---

## Table of Contents

1. [Authentication & Identity](#1-authentication--identity)
2. [Group Management](#2-group-management)
3. [Onboarding & Invitations](#3-onboarding--invitations)
4. [Meetings](#4-meetings)
5. [Monthly Savings (Payments)](#5-monthly-savings-payments)
6. [Internal Loans (SHG Funds)](#6-internal-loans-shg-funds)
7. [Bank-Assisted Loans (Hybrid)](#7-bank-assisted-loans-hybrid)
8. [Group Bank Loans (External)](#8-group-bank-loans-external)
9. [Configuration & Utilities](#9-configuration--utilities)
10. [Schema Health & Audit Findings](#10-schema-health--audit-findings)
11. [Migration History](#11-migration-history)

---

## 1. Authentication & Identity

### `identities`
The **root authentication record** for a real person. A single identity represents one human being identified by their phone number. This was introduced to support multi-SHG membership (one person in multiple groups).

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Internal primary key |
| `phone` | varchar(20) UNIQUE | Login phone number — globally unique |
| `password` | text | The single login password for all groups |
| `name` | text | Person's display name |
| `preferred_language` | varchar(10) | `en` or `mr` |
| `last_opened_membership_id` | varchar(36) | Which SHG membership was last active (for quick-resume) |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Relationships:** One identity → many `memberships`.

---

### `memberships`
The **junction table** linking an `identity` to a specific SHG `group`, via a specific `user` profile. One row = one person in one group.

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | |
| `identity_id` | varchar(36) | FK → `identities.id` |
| `group_id` | varchar(36) | FK → `groups.groupId` (the SHG code, e.g. SHG-1234) |
| `user_id` | varchar(36) | FK → `users.id` (the group-specific profile) |
| `role` | varchar(20) | `member`, `president`, `treasurer` |
| `status` | varchar(20) | `active`, `inactive` |
| `created_at` | timestamp | |

**Indexes:** Unique on `(identity_id, group_id)` to prevent duplicate memberships. Index on `group_id` for fast group-member lookups.

---

### `users`
A member's **profile within a specific group**. One person can have multiple `users` rows if they belong to multiple SHGs.

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Group-scoped member ID |
| `name` | text | Member's name |
| `phone` | varchar(20) | Phone (not unique here — uniqueness enforced at `identities` level) |
| `password` | text | **[Legacy — see note below]** |
| `village` | text | Member's village |
| `join_date` | timestamp | Date joined this specific group |
| `exit_date` | timestamp | Date left the group (nullable) |
| `role` | varchar(20) | `member`, `president`, `treasurer` |
| `preferred_language` | varchar(10) | |
| `group_id` | varchar(36) | FK → `groups.groupId` (SHG code) |
| `status` | varchar(20) | `active`, `inactive` |
| `contribution_start_month` | varchar(7) | e.g. `2024-01` — first month savings are tracked |

> **⚠️ Note on `password` field:** Since authentication was migrated to the `identities` table, `users.password` is technically redundant. However, it exists for backwards compatibility and is currently kept in sync during password change operations via the `change-password` route. It is safe to keep but should be considered for cleanup in a future migration.

---

### `sessions`
Holds **active login tokens**. When a user logs in, a session token is created here. Cleared on logout or manually by admins.

| Column | Type | Description |
|---|---|---|
| `token` | varchar(36) (PK) | The Bearer token sent with every API request |
| `user_id` | varchar(36) | FK → `users.id` |
| `created_at` | timestamp | |

---

## 2. Group Management

### `groups`
The core **SHG entity**. Every table in the system references this via `group_id`.

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Internal UUID |
| `group_id` | varchar(100) UNIQUE | Human-readable SHG code (e.g., `SHG-2024-MH-001`) used in API routes |
| `unique_group_code` | varchar(20) UNIQUE | Short code used during new president onboarding |
| `name` | text | Full SHG name |
| `village` | text | Village |
| `taluka` | text | Taluka |
| `district` | text | District |
| `preferred_language` | varchar(10) | Default `mr` (Marathi) |
| `status` | varchar(20) | `pending` (unclaimed) or `active` |
| `president_id` | varchar(36) | FK → `users.id` |
| `treasurer_id` | varchar(36) | FK → `users.id` |
| `qr_code` | text | Base64 data URI of the payment QR image (uploaded by president/treasurer) |
| `created_by_super_admin` | varchar(36) | Who provisioned this group |
| `activated_on` | timestamp | When the president first registered |
| `created_at` | timestamp | |

---

### `group_settings`
A **flexible JSON store** for per-group configuration (e.g. savings amount, late fee rules, interest policy).

| Column | Type | Description |
|---|---|---|
| `group_id` | varchar(36) (PK) | FK → `groups.groupId` |
| `settings` | jsonb | JSON blob containing group configuration |

---

### `group_rules`
Stores the SHG's **bylaws or rules** as free-form text. Editable by the president.

| Column | Type | Description |
|---|---|---|
| `group_id` | varchar(36) (PK) | FK → `groups.groupId` |
| `rules` | text | The group's rules document |

---

### `affiliated_banks`
Records the SHG's **actual savings/current bank accounts** (not the bank loans — just the bank the SHG uses).

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | |
| `group_id` | varchar(36) | FK → `groups.groupId` |
| `name` | text | Bank name |
| `branch` | text | Branch name |
| `ifsc_code` | varchar(20) | |
| `contact_person` | text | Relationship manager etc. |
| `contact_number` | varchar(20) | |
| `notes` | text | Free-form notes |
| `is_active` | boolean | Whether this account is active |
| `created_by` | varchar(36) | |
| `created_at` | timestamp | |

**Index:** `bank_group_idx` on `group_id`.

---

## 3. Onboarding & Invitations

### `invitation_codes`
Generates **short-lived codes** allowing existing members to join the SHG through the app. Created by the president.

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | |
| `code` | varchar(10) UNIQUE | The short code shown to the member |
| `group_id` | varchar(36) | FK → `groups.groupId` |
| `active` | boolean | Whether the code can still be used |
| `expires_at` | timestamp | Expiry time |
| `max_uses` | integer | Max times this code can be used (default 1) |
| `current_uses` | integer | How many times it has been used so far |
| `created_by` | varchar(36) | |
| `created_at` | timestamp | |

---

### `invitation_code_usage`
**Audit trail** of invitation code usage.

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | |
| `invitation_code_id` | varchar(36) | FK → `invitation_codes.id` |
| `user_id` | varchar(36) | FK → `users.id` of the person who used it |
| `used_at` | timestamp | |

---

## 4. Meetings

### `meetings`
Tracks **scheduled and completed SHG meetings**, including agenda, notes, and attendance.

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | |
| `group_id` | varchar(36) | FK → `groups.groupId` |
| `scheduled_date` | timestamp | Date of the meeting |
| `agenda` | text | Pre-meeting agenda |
| `notes` | text | Post-meeting minutes |
| `attendance` | jsonb | Array of `{ memberId, memberName, attended }` |
| `status` | varchar(20) | `scheduled`, `completed`, `cancelled` |
| `created_by` | varchar(36) | |
| `created_at` | timestamp | |

---

## 5. Monthly Savings (Payments)

### `payments`
Records every **monthly savings contribution** by a member. Supports a claim-and-verify workflow where members self-report, and admins confirm.

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | |
| `group_id` | varchar(36) | FK → `groups.groupId` |
| `member_id` | varchar(36) | FK → `users.id` |
| `member_name` | text | Denormalized name for display |
| `amount` | integer | Amount paid (in Rs.) |
| `expected_amount` | integer | Amount that was due |
| `late_fee` | integer | Any late fee charged |
| `month` | varchar(7) | e.g. `2024-06` |
| `due_date` | timestamp | When payment was due |
| `date` | timestamp | When payment was made |
| `mode` | varchar(20) | `cash` or `online` |
| `status` | varchar(30) | `pending`, `verified`, `rejected` |
| `verified_by` | varchar(36) | Admin who confirmed payment |
| `verified_at` | timestamp | |
| `rejection_reason` | text | |
| `rejected_by` | varchar(36) | |
| `rejected_at` | timestamp | |
| `overridden_by` | varchar(36) | President override fields |
| `override_reason` | text | |
| `override_at` | timestamp | |

**Index:** `payment_group_member_month_idx` on `(group_id, member_id, month)` for fast per-member-per-month lookups.

---

## 6. Internal Loans (SHG Funds)

> ⚠️ **FROZEN MODULE** — The `loan_ledger` table and the `recordLoanRepayment` transaction logic in `server/storage.ts` are protected by architectural rules. Do not modify accounting logic without consulting `docs/INTERNAL_LOAN_ACCOUNTING_SPEC.md`.

### `loans`
Represents an **internal loan issued from the SHG's own savings fund** to a member.

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | |
| `group_id` | varchar(36) | FK → `groups.groupId` |
| `member_id` | varchar(36) | FK → `users.id` |
| `member_name` | text | Denormalized |
| `resolution_no` | text | Meeting resolution reference |
| `amount` | integer | SHG principal amount (Rs.) |
| `interest` | real | Monthly interest rate (%) |
| `duration` | integer | Loan duration in months |
| `remaining_balance` | integer | Current outstanding SHG balance |
| `status` | varchar(30) | `pending_treasurer`, `pending_president`, `approved`, `rejected`, `closed` |
| `treasurer_action_by` | varchar(36) | |
| `treasurer_action_at` | timestamp | |
| `approved_by` | varchar(36) | |
| `approved_at` | timestamp | |
| `meeting_id` | varchar(36) | Meeting where this was sanctioned |
| `created_at` | timestamp | |
| `rejection_reason` | text | |
| `rejected_by` | varchar(36) | |
| `rejected_at` | timestamp | |
| `president_override` | boolean | Was president approval bypassed? |
| `override_reason` | text | |
| `override_at` | timestamp | |
| `calculation_method` | varchar(20) | `legacy` (flat) or `reducing_balance` |
| `fixed_principal_installment` | integer | Used by reducing balance method |
| `total_principal_paid` | integer | Running total of principal repaid |
| `total_interest_paid` | integer | Running total of interest repaid |
| `outstanding_interest` | integer | Accumulated unpaid interest |
| `start_date` | text | **Display-only** — does not affect `loan_ledger` calculations |

**Bank-Assisted Hybrid Fields** — See Section 7 below.

**Index:** `loan_member_idx` on `member_id`.

---

### `loan_repayments`
Individual **repayment installment records** for internal loans.

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | |
| `loan_id` | varchar(36) | FK → `loans.id` |
| `amount` | integer | Total amount paid |
| `shg_amount` | integer | Portion going to SHG fund |
| `bank_amount` | integer | Portion going to bank (for hybrid loans) |
| `date` | timestamp | |
| `recorded_by` | varchar(36) | FK → `users.id` |
| `remarks` | text | |

---

### `loan_ledger`
The **immutable, append-only accounting ledger** for internal loans. Each row is a mathematically complete ledger entry created atomically during a repayment transaction.

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | |
| `loan_id` | varchar(36) | FK → `loans.id` |
| `receipt_no` | varchar(50) | Auto-generated receipt number |
| `date` | timestamp | Payment date |
| `opening_principal` | integer | Principal at start of this period |
| `interest_rate_applied` | real | Rate used for this entry |
| `interest_charged` | integer | Interest accrued this period |
| `interest_paid` | integer | Interest portion of payment |
| `principal_paid` | integer | Principal portion of payment |
| `payment_received` | integer | Total received |
| `closing_principal` | integer | Principal after this payment |
| `outstanding_interest` | integer | Unpaid interest carried forward |
| `remarks` | text | |
| `recorded_by` | varchar(36) | |
| `type` | varchar(20) | `repayment` or `disbursement` |
| `created_at` | timestamp | |

**Index:** `ledger_loan_idx` on `loan_id`.

---

## 7. Bank-Assisted Loans (Hybrid)

These are **additional columns on the `loans` table** that allow an internal loan to have a co-funded bank component. This is a distinct feature from the Group Bank Loans system (Section 8). The treasurer or president can flag an internal loan as bank-assisted during the approval stage.

| Column | Type | Description |
|---|---|---|
| `has_bank_loan` | boolean | Whether this internal loan has a bank component |
| `bank_id` | varchar(36) | FK → `affiliated_banks.id` |
| `bank_name` | text | Name of the co-funding bank |
| `bank_loan_amount` | integer | Bank's principal portion |
| `bank_interest_rate` | real | Bank's interest rate (%) |
| `bank_duration` | integer | Bank loan duration in months |
| `bank_remaining_balance` | integer | Current outstanding bank balance |
| `bank_loan_start_date` | timestamp | When the bank loan began |
| `bank_loan_remarks` | text | Free-form notes |

**Active Usage:**
- UI badge on `app/loans.tsx` — "Bank Assisted Loan" tag shown when `hasBankLoan = true`
- Repayment validation — prevents recording a bank portion if the loan is not bank-assisted
- Balance recalculation on repayment and repayment-deletion
- PDF report generation in `lib/pdf-generator.ts`
- Accounting helpers in `shared/accounting.ts` (`calculateBankTotal`, `calculateBankEmi`)

---

## 8. Group Bank Loans (External)

A completely separate module tracking **loans taken by the SHG entity itself from a commercial bank**, then distributed to individual members.

### `group_bank_loans`
The master loan record for the bank's lending to the SHG as a whole.

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | |
| `group_id` | varchar(36) | FK → `groups.groupId` |
| `bank_name` | text | Lending bank name |
| `branch` | text | |
| `account_number` | varchar(50) | |
| `ifsc_code` | varchar(20) | |
| `sanction_date` | timestamp | Date loan was sanctioned |
| `amount` | integer | Total sanctioned amount |
| `annual_interest_rate` | real | Annual rate (%) |
| `duration_months` | integer | Loan term |
| `repayment_start_date` | timestamp | When EMIs start |
| `remarks` | text | |
| `status` | varchar(30) | `active`, `closed` |
| `created_by` | varchar(36) | |
| `created_at` | timestamp | |

---

### `bank_loan_allocations`
How the group bank loan is **distributed among individual members**.

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | |
| `bank_loan_id` | varchar(36) | FK → `group_bank_loans.id` |
| `member_id` | varchar(36) | FK → `users.id` |
| `allocated_principal` | integer | Member's share of the bank loan |
| `total_principal_paid` | integer | Running total |
| `total_interest_paid` | integer | Running total |
| `outstanding_balance` | integer | Current balance |
| `outstanding_interest` | integer | Unpaid interest |
| `status` | varchar(30) | `active`, `closed` |

**Indexes:** `allocation_bank_idx` on `bank_loan_id`, `allocation_member_idx` on `member_id`.

---

### `bank_loan_repayments`
Individual repayment installments for a member's allocated bank loan share.

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | |
| `allocation_id` | varchar(36) | FK → `bank_loan_allocations.id` |
| `receipt_no` | varchar(50) | |
| `amount` | integer | |
| `date` | timestamp | |
| `recorded_by` | varchar(36) | |
| `remarks` | text | |

---

### `bank_loan_ledger`
The **immutable accounting ledger** for bank loan allocations — mirrors the structure of `loan_ledger` but for the external bank loan module.

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | |
| `allocation_id` | varchar(36) | FK → `bank_loan_allocations.id` |
| `receipt_no` | varchar(50) | |
| `type` | varchar(20) | `repayment`, `disbursement` |
| `date` | timestamp | |
| `opening_principal` | integer | |
| `interest_rate_applied` | real | |
| `interest_charged` | integer | |
| `interest_paid` | integer | |
| `principal_paid` | integer | |
| `payment_received` | integer | |
| `closing_principal` | integer | |
| `outstanding_interest` | integer | |
| `remarks` | text | |
| `recorded_by` | varchar(36) | |
| `created_at` | timestamp | |

**Index:** `bank_ledger_alloc_idx` on `allocation_id`.

---

## 9. Configuration & Utilities

### `cron_locks`
A distributed locking mechanism to **prevent cron jobs from running concurrently** (e.g., if the server restarts mid-job).

| Column | Type | Description |
|---|---|---|
| `job_name` | varchar(50) (PK) | Unique identifier for the background job |
| `locked_at` | timestamp | When the lock was acquired |

---

## 10. Schema Health & Audit Findings

### ✅ Confirmed Clean — No Action Required

| Finding | Status |
|---|---|
| Bank-Assisted Loan fields on `loans` table | ✅ Actively used — confirmed through full code audit |
| `group_bank_loans` vs `loans.hasBankLoan` duplication concern | ✅ Not a duplicate — two separate features |
| `users.password` field | ⚠️ Kept in sync with `identities.password` for now — low priority cleanup candidate for a future migration |

### ⚠️ Low-Priority Technical Debt

1. **`users.password` is redundant** — Authentication is now rooted in the `identities` table. The `users.password` field is kept in sync but is not used for auth. Future migration: drop this column and remove the sync logic from the `change-password` route.

2. **`invitation_code_usage.user_id` is not a foreign key constraint** — It stores a `user_id` but has no explicit `REFERENCES` constraint in the DB. Not breaking, but worth adding as a formal constraint in a future migration.

---

## 11. Migration History

| File | Date | Summary |
|---|---|---|
| `0000_right_bug.sql` | Jul 4, 2026 | Initial schema — `users`, `groups`, `sessions`, `meetings`, `payments`, `loans`, `loan_repayments`, `invitation_codes`, `invitation_code_usage` |
| `0001_youthful_giant_man.sql` | Jul 6, 2026 | Added: village/taluka/district to groups; shg_amount/bank_amount to loan_repayments; rejection/override fields to loans & payments; bank-assisted hybrid fields to loans; `affiliated_banks` table; `contribution_start_month` to users |
| `0002_flawless_peter_parker.sql` | Jul 10, 2026 | Added: full Group Bank Loan module (`group_bank_loans`, `bank_loan_allocations`, `bank_loan_repayments`, `bank_loan_ledger`); `loan_ledger` (reducing balance engine); new calculation fields on loans |
| `0003_bank_loan_fixup.sql` | Jul 10, 2026 | Fixup: added missing `ifsc_code` and `created_by` to `group_bank_loans`; added `type` column to `bank_loan_ledger` |

> **Note:** The `identities` and `memberships` tables were added to the schema code but do not appear in migration files — they were likely applied directly in production or via a mechanism outside Drizzle's migration runner. A migration file for these tables should be created to keep the migration history complete.

---

*End of Schema Audit*
