var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  affiliatedBanks: () => affiliatedBanks,
  bankLoanAllocations: () => bankLoanAllocations,
  bankLoanLedger: () => bankLoanLedger,
  bankLoanRepayments: () => bankLoanRepayments,
  cronLocks: () => cronLocks,
  groupBankLoans: () => groupBankLoans,
  groupRules: () => groupRules,
  groupSettings: () => groupSettings,
  groups: () => groups,
  identities: () => identities,
  invitationCodeUsage: () => invitationCodeUsage,
  invitationCodes: () => invitationCodes,
  loanLedger: () => loanLedger,
  loanRepayments: () => loanRepayments,
  loans: () => loans,
  meetings: () => meetings,
  memberships: () => memberships,
  payments: () => payments,
  sessions: () => sessions,
  users: () => users
});
import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  real,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
  boolean
} from "drizzle-orm/pg-core";
var users, groups, invitationCodes, invitationCodeUsage, sessions, meetings, payments, affiliatedBanks, loans, loanRepayments, groupSettings, groupRules, cronLocks, loanLedger, groupBankLoans, bankLoanAllocations, bankLoanRepayments, bankLoanLedger, identities, memberships;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    users = pgTable("users", {
      id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      phone: varchar("phone", { length: 20 }).notNull(),
      password: text("password").notNull(),
      village: text("village").notNull(),
      joinDate: timestamp("join_date").notNull(),
      exitDate: timestamp("exit_date"),
      role: varchar("role", { length: 20 }).notNull().default("member"),
      preferredLanguage: varchar("preferred_language", { length: 10 }),
      groupId: varchar("group_id", { length: 36 }).notNull(),
      status: varchar("status", { length: 20 }).notNull().default("active"),
      contributionStartMonth: varchar("contribution_start_month", { length: 7 })
    });
    groups = pgTable("groups", {
      id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
      groupId: varchar("group_id", { length: 100 }).notNull().unique(),
      uniqueGroupCode: varchar("unique_group_code", { length: 20 }).unique(),
      name: text("name").notNull(),
      village: text("village"),
      taluka: text("taluka"),
      district: text("district"),
      preferredLanguage: varchar("preferred_language", { length: 10 }).notNull().default("mr"),
      status: varchar("status", { length: 20 }).notNull().default("pending"),
      presidentId: varchar("president_id", { length: 36 }),
      treasurerId: varchar("treasurer_id", { length: 36 }),
      qrCode: text("qr_code"),
      createdBySuperAdmin: varchar("created_by_super_admin", { length: 36 }),
      activatedOn: timestamp("activated_on"),
      createdAt: timestamp("created_at").notNull().default(sql`now()`)
    });
    invitationCodes = pgTable("invitation_codes", {
      id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
      code: varchar("code", { length: 10 }).notNull().unique(),
      groupId: varchar("group_id", { length: 36 }).notNull(),
      active: boolean("active").notNull().default(true),
      expiresAt: timestamp("expires_at"),
      maxUses: integer("max_uses").notNull().default(1),
      currentUses: integer("current_uses").notNull().default(0),
      createdBy: varchar("created_by", { length: 36 }).notNull(),
      createdAt: timestamp("created_at").notNull().default(sql`now()`)
    });
    invitationCodeUsage = pgTable("invitation_code_usage", {
      id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
      invitationCodeId: varchar("invitation_code_id", { length: 36 }).notNull(),
      userId: varchar("user_id", { length: 36 }).notNull(),
      usedAt: timestamp("used_at").notNull().default(sql`now()`)
    });
    sessions = pgTable("sessions", {
      token: varchar("token", { length: 36 }).primaryKey(),
      userId: varchar("user_id", { length: 36 }).notNull(),
      createdAt: timestamp("created_at").notNull().default(sql`now()`)
    });
    meetings = pgTable("meetings", {
      id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
      groupId: varchar("group_id", { length: 36 }).notNull(),
      scheduledDate: timestamp("scheduled_date").notNull(),
      agenda: text("agenda").notNull().default(""),
      notes: text("notes").notNull().default(""),
      attendance: jsonb("attendance").notNull().default(sql`'[]'::jsonb`),
      status: varchar("status", { length: 20 }).notNull().default("scheduled"),
      createdBy: varchar("created_by", { length: 36 }).notNull(),
      createdAt: timestamp("created_at").notNull().default(sql`now()`)
    });
    payments = pgTable("payments", {
      id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
      groupId: varchar("group_id", { length: 36 }).notNull(),
      memberId: varchar("member_id", { length: 36 }).notNull(),
      memberName: text("member_name").notNull(),
      amount: integer("amount").notNull(),
      expectedAmount: integer("expected_amount").notNull().default(0),
      lateFee: integer("late_fee").notNull().default(0),
      month: varchar("month", { length: 7 }).default(""),
      dueDate: timestamp("due_date"),
      date: timestamp("date").notNull().default(sql`now()`),
      mode: varchar("mode", { length: 20 }).notNull().default("cash"),
      status: varchar("status", { length: 30 }).notNull().default("pending"),
      verifiedBy: varchar("verified_by", { length: 36 }),
      verifiedAt: timestamp("verified_at"),
      rejectionReason: text("rejection_reason"),
      rejectedBy: varchar("rejected_by", { length: 36 }),
      rejectedAt: timestamp("rejected_at"),
      overriddenBy: varchar("overridden_by", { length: 36 }),
      overrideReason: text("override_reason"),
      overrideAt: timestamp("override_at")
    }, (t) => ({
      paymentGroupMemberMonthIdx: index("payment_group_member_month_idx").on(t.groupId, t.memberId, t.month)
    }));
    affiliatedBanks = pgTable("affiliated_banks", {
      id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
      groupId: varchar("group_id", { length: 36 }).notNull(),
      name: text("name").notNull(),
      branch: text("branch"),
      ifscCode: varchar("ifsc_code", { length: 20 }),
      contactPerson: text("contact_person"),
      contactNumber: varchar("contact_number", { length: 20 }),
      notes: text("notes"),
      isActive: boolean("is_active").notNull().default(true),
      createdBy: varchar("created_by", { length: 36 }).notNull(),
      createdAt: timestamp("created_at").notNull().default(sql`now()`)
    }, (t) => ({
      bankGroupIdx: index("bank_group_idx").on(t.groupId)
    }));
    loans = pgTable("loans", {
      id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
      groupId: varchar("group_id", { length: 36 }).notNull(),
      memberId: varchar("member_id", { length: 36 }).notNull(),
      memberName: text("member_name").notNull(),
      resolutionNo: text("resolution_no").notNull(),
      amount: integer("amount").notNull(),
      interest: real("interest").notNull(),
      duration: integer("duration").notNull(),
      remainingBalance: integer("remaining_balance").notNull(),
      status: varchar("status", { length: 30 }).notNull().default("pending_treasurer"),
      treasurerActionBy: varchar("treasurer_action_by", { length: 36 }),
      treasurerActionAt: timestamp("treasurer_action_at"),
      approvedBy: varchar("approved_by", { length: 36 }),
      approvedAt: timestamp("approved_at"),
      meetingId: varchar("meeting_id", { length: 36 }),
      createdAt: timestamp("created_at").notNull().default(sql`now()`),
      rejectionReason: text("rejection_reason"),
      rejectedBy: varchar("rejected_by", { length: 36 }),
      rejectedAt: timestamp("rejected_at"),
      presidentOverride: boolean("president_override").default(false),
      overrideReason: text("override_reason"),
      overrideAt: timestamp("override_at"),
      hasBankLoan: boolean("has_bank_loan").notNull().default(false),
      bankId: varchar("bank_id", { length: 36 }),
      bankName: text("bank_name"),
      bankLoanAmount: integer("bank_loan_amount"),
      bankInterestRate: real("bank_interest_rate"),
      bankDuration: integer("bank_duration"),
      bankRemainingBalance: integer("bank_remaining_balance"),
      bankLoanStartDate: timestamp("bank_loan_start_date"),
      bankLoanRemarks: text("bank_loan_remarks"),
      calculationMethod: varchar("calculation_method", { length: 20 }).notNull().default("legacy"),
      fixedPrincipalInstallment: integer("fixed_principal_installment"),
      totalPrincipalPaid: integer("total_principal_paid").notNull().default(0),
      totalInterestPaid: integer("total_interest_paid").notNull().default(0),
      outstandingInterest: integer("outstanding_interest").notNull().default(0),
      startDate: text("start_date")
      // Display-only loan start date; does not affect loan_ledger calculations
    }, (t) => ({
      loanMemberIdx: index("loan_member_idx").on(t.memberId)
    }));
    loanRepayments = pgTable("loan_repayments", {
      id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
      loanId: varchar("loan_id", { length: 36 }).notNull(),
      amount: integer("amount").notNull(),
      shgAmount: integer("shg_amount").notNull().default(0),
      bankAmount: integer("bank_amount").notNull().default(0),
      date: timestamp("date").notNull().default(sql`now()`),
      recordedBy: varchar("recorded_by", { length: 36 }).notNull(),
      remarks: text("remarks")
    });
    groupSettings = pgTable("group_settings", {
      groupId: varchar("group_id", { length: 36 }).primaryKey(),
      settings: jsonb("settings").notNull()
    });
    groupRules = pgTable("group_rules", {
      groupId: varchar("group_id", { length: 36 }).primaryKey(),
      rules: text("rules").notNull().default("")
    });
    cronLocks = pgTable("cron_locks", {
      jobName: varchar("job_name", { length: 50 }).primaryKey(),
      lockedAt: timestamp("locked_at").notNull().default(sql`now()`)
    });
    loanLedger = pgTable("loan_ledger", {
      id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
      loanId: varchar("loan_id", { length: 36 }).notNull(),
      receiptNo: varchar("receipt_no", { length: 50 }).notNull(),
      date: timestamp("date").notNull().default(sql`now()`),
      openingPrincipal: integer("opening_principal").notNull(),
      interestRateApplied: real("interest_rate_applied").notNull(),
      interestCharged: integer("interest_charged").notNull(),
      interestPaid: integer("interest_paid").notNull(),
      principalPaid: integer("principal_paid").notNull(),
      paymentReceived: integer("payment_received").notNull(),
      closingPrincipal: integer("closing_principal").notNull(),
      outstandingInterest: integer("outstanding_interest").notNull(),
      remarks: text("remarks"),
      recordedBy: varchar("recorded_by", { length: 36 }).notNull(),
      type: varchar("type", { length: 20 }).notNull().default("repayment"),
      createdAt: timestamp("created_at").notNull().default(sql`now()`)
    }, (t) => ({
      ledgerLoanIdx: index("ledger_loan_idx").on(t.loanId)
    }));
    groupBankLoans = pgTable("group_bank_loans", {
      id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
      groupId: varchar("group_id", { length: 36 }).notNull(),
      bankName: text("bank_name").notNull(),
      branch: text("branch"),
      accountNumber: varchar("account_number", { length: 50 }),
      ifscCode: varchar("ifsc_code", { length: 20 }),
      sanctionDate: timestamp("sanction_date").notNull(),
      amount: integer("amount").notNull(),
      annualInterestRate: real("annual_interest_rate").notNull(),
      durationMonths: integer("duration_months").notNull(),
      repaymentStartDate: timestamp("repayment_start_date"),
      remarks: text("remarks"),
      status: varchar("status", { length: 30 }).notNull().default("active"),
      createdBy: varchar("created_by", { length: 36 }).notNull(),
      createdAt: timestamp("created_at").notNull().default(sql`now()`)
    });
    bankLoanAllocations = pgTable("bank_loan_allocations", {
      id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
      bankLoanId: varchar("bank_loan_id", { length: 36 }).notNull(),
      memberId: varchar("member_id", { length: 36 }).notNull(),
      allocatedPrincipal: integer("allocated_principal").notNull(),
      totalPrincipalPaid: integer("total_principal_paid").notNull().default(0),
      totalInterestPaid: integer("total_interest_paid").notNull().default(0),
      outstandingBalance: integer("outstanding_balance").notNull(),
      outstandingInterest: integer("outstanding_interest").notNull().default(0),
      status: varchar("status", { length: 30 }).notNull().default("active")
    }, (t) => ({
      allocationBankIdx: index("allocation_bank_idx").on(t.bankLoanId),
      allocationMemberIdx: index("allocation_member_idx").on(t.memberId)
    }));
    bankLoanRepayments = pgTable("bank_loan_repayments", {
      id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
      allocationId: varchar("allocation_id", { length: 36 }).notNull(),
      receiptNo: varchar("receipt_no", { length: 50 }).notNull(),
      amount: integer("amount").notNull(),
      date: timestamp("date").notNull().default(sql`now()`),
      recordedBy: varchar("recorded_by", { length: 36 }).notNull(),
      remarks: text("remarks")
    });
    bankLoanLedger = pgTable("bank_loan_ledger", {
      id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
      allocationId: varchar("allocation_id", { length: 36 }).notNull(),
      receiptNo: varchar("receipt_no", { length: 50 }).notNull(),
      type: varchar("type", { length: 20 }).notNull().default("repayment"),
      date: timestamp("date").notNull().default(sql`now()`),
      openingPrincipal: integer("opening_principal").notNull(),
      interestRateApplied: real("interest_rate_applied").notNull(),
      interestCharged: integer("interest_charged").notNull(),
      interestPaid: integer("interest_paid").notNull(),
      principalPaid: integer("principal_paid").notNull(),
      paymentReceived: integer("payment_received").notNull(),
      closingPrincipal: integer("closing_principal").notNull(),
      outstandingInterest: integer("outstanding_interest").notNull(),
      remarks: text("remarks"),
      recordedBy: varchar("recorded_by", { length: 36 }).notNull(),
      createdAt: timestamp("created_at").notNull().default(sql`now()`)
    }, (t) => ({
      bankLedgerAllocIdx: index("bank_ledger_alloc_idx").on(t.allocationId)
    }));
    identities = pgTable("identities", {
      id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
      phone: varchar("phone", { length: 20 }).notNull().unique(),
      password: text("password").notNull(),
      name: text("name").notNull(),
      preferredLanguage: varchar("preferred_language", { length: 10 }).default("en"),
      lastOpenedMembershipId: varchar("last_opened_membership_id", { length: 36 }),
      createdAt: timestamp("created_at").notNull().default(sql`now()`),
      updatedAt: timestamp("updated_at").notNull().default(sql`now()`)
    });
    memberships = pgTable("memberships", {
      id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
      identityId: varchar("identity_id", { length: 36 }).notNull(),
      groupId: varchar("group_id", { length: 36 }).notNull(),
      userId: varchar("user_id", { length: 36 }).notNull(),
      role: varchar("role", { length: 20 }).notNull().default("member"),
      status: varchar("status", { length: 20 }).notNull().default("active"),
      createdAt: timestamp("created_at").notNull().default(sql`now()`)
    }, (t) => ({
      membershipUnique: uniqueIndex("membership_identity_group_idx").on(t.identityId, t.groupId),
      membershipGroupIdx: index("membership_group_idx").on(t.groupId)
    }));
  }
});

// server/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
function getDb() {
  if (!_db) {
    const pool = new Pool({ connectionString: process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL });
    _db = drizzle(pool, { schema: schema_exports });
  }
  return _db;
}
var _db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    _db = null;
  }
});

// shared/accounting.ts
function resolveRepaymentAmounts(repayment) {
  if (!repayment.shgAmount && !repayment.bankAmount && repayment.amount) {
    return { shgAmount: repayment.amount, bankAmount: 0 };
  }
  return {
    shgAmount: repayment.shgAmount || 0,
    bankAmount: repayment.bankAmount || 0
  };
}
function calculateNextLedgerEntry(loanSnapshot, paymentAmount, monthlyRate, fixedPrincipalInstallment, unpaidInterestPolicy = "due") {
  const openingPrincipal = loanSnapshot.remainingBalance;
  const previousOutstandingInterest = loanSnapshot.outstandingInterest;
  const interestCharged = Math.round(openingPrincipal * (monthlyRate / 100));
  const totalInterestDue = interestCharged + previousOutstandingInterest;
  let interestPaid = 0;
  let principalPaid = 0;
  if (paymentAmount >= totalInterestDue) {
    interestPaid = totalInterestDue;
    principalPaid = paymentAmount - totalInterestDue;
  } else {
    interestPaid = paymentAmount;
    principalPaid = 0;
  }
  if (principalPaid > openingPrincipal) {
    principalPaid = openingPrincipal;
  }
  let closingPrincipal = openingPrincipal - principalPaid;
  let newOutstandingInterest = totalInterestDue - interestPaid;
  if (newOutstandingInterest > 0 && unpaidInterestPolicy === "capitalize") {
    closingPrincipal += newOutstandingInterest;
    newOutstandingInterest = 0;
  }
  const suggestedPrincipal = Math.min(fixedPrincipalInstallment, openingPrincipal);
  const suggestedInstallment = suggestedPrincipal + interestCharged + previousOutstandingInterest;
  return {
    openingPrincipal,
    interestRateApplied: monthlyRate,
    interestCharged,
    interestPaid,
    principalPaid,
    paymentReceived: paymentAmount,
    closingPrincipal,
    outstandingInterest: newOutstandingInterest,
    suggestedPrincipal,
    suggestedInstallment,
    totalInterestDue
  };
}
var init_accounting = __esm({
  "shared/accounting.ts"() {
    "use strict";
  }
});

// server/storage.ts
import { randomUUID } from "crypto";
import { eq, inArray, and, desc } from "drizzle-orm";
var DEFAULT_SETTINGS, MemStorage, DatabaseStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_db();
    init_schema();
    init_accounting();
    DEFAULT_SETTINGS = {
      interestRate: 2,
      maxLoanAmount: 5e4,
      durationRules: [
        { maxAmount: 5e3, minDuration: 1, maxDuration: 6 },
        { maxAmount: 2e4, minDuration: 3, maxDuration: 12 },
        { maxAmount: 5e4, minDuration: 6, maxDuration: 24 }
      ],
      monthlyContributionAmount: 100,
      contributionDueDay: 5,
      lateFeeAmount: 10,
      lateFeeType: "fixed",
      gracePeriodDays: 5
    };
    MemStorage = class {
      sessions = /* @__PURE__ */ new Map();
      users = /* @__PURE__ */ new Map();
      groups = /* @__PURE__ */ new Map();
      meetings = /* @__PURE__ */ new Map();
      payments = /* @__PURE__ */ new Map();
      loans = /* @__PURE__ */ new Map();
      repayments = /* @__PURE__ */ new Map();
      groupSettings = /* @__PURE__ */ new Map();
      groupRules = /* @__PURE__ */ new Map();
      banks = /* @__PURE__ */ new Map();
      async createSession(userId) {
        const token = randomUUID();
        const session = { token, userId, createdAt: /* @__PURE__ */ new Date() };
        this.sessions.set(token, session);
        return session;
      }
      async getSession(token) {
        return this.sessions.get(token);
      }
      async deleteSession(token) {
        this.sessions.delete(token);
      }
      async getUserById(id) {
        return this.users.get(id);
      }
      async getUserByPhone(phone) {
        return Array.from(this.users.values()).find((u) => u.phone === phone);
      }
      async getUsersByGroupId(groupId) {
        return Array.from(this.users.values()).filter((u) => u.groupId === groupId);
      }
      async createUser(data) {
        const id = randomUUID();
        const user = { ...data, id };
        this.users.set(id, user);
        return user;
      }
      async updateUser(id, data) {
        const user = this.users.get(id);
        if (!user) return void 0;
        const updated = { ...user, ...data };
        this.users.set(id, updated);
        return updated;
      }
      async getGroupByGroupId(groupId) {
        return Array.from(this.groups.values()).find((g) => g.groupId === groupId);
      }
      async getGroupByUniqueGroupCode(code) {
        return Array.from(this.groups.values()).find((g) => g.uniqueGroupCode === code);
      }
      async getAllGroups() {
        return Array.from(this.groups.values());
      }
      async createGroup(data) {
        const id = randomUUID();
        const group = { ...data, id };
        this.groups.set(id, group);
        return group;
      }
      async updateGroup(groupId, data) {
        const group = Array.from(this.groups.values()).find((g) => g.groupId === groupId);
        if (!group) return void 0;
        const updated = { ...group, ...data };
        this.groups.set(group.id, updated);
        return updated;
      }
      async deleteGroup(groupId) {
        const group = Array.from(this.groups.values()).find((g) => g.groupId === groupId);
        if (group) {
          this.groups.delete(group.id);
        }
      }
      async getMeetingsByGroupId(groupId) {
        return Array.from(this.meetings.values()).filter((m) => m.groupId === groupId);
      }
      async getMeetingById(id) {
        return this.meetings.get(id);
      }
      async createMeeting(data) {
        const id = randomUUID();
        const meeting = { ...data, id };
        this.meetings.set(id, meeting);
        return meeting;
      }
      async updateMeeting(id, data) {
        const meeting = this.meetings.get(id);
        if (!meeting) return void 0;
        const updated = { ...meeting, ...data };
        this.meetings.set(id, updated);
        return updated;
      }
      async deleteMeeting(id) {
        this.meetings.delete(id);
      }
      async getPaymentsByGroupId(groupId) {
        return Array.from(this.payments.values()).filter((p) => p.groupId === groupId);
      }
      async getPaymentsForMember(groupId, memberId) {
        return Array.from(this.payments.values()).filter((p) => p.groupId === groupId && p.memberId === memberId);
      }
      async getPaymentById(id) {
        return this.payments.get(id);
      }
      async createPayment(data) {
        const id = randomUUID();
        const payment = { ...data, id };
        this.payments.set(id, payment);
        return payment;
      }
      async updatePayment(id, data) {
        const payment = this.payments.get(id);
        if (!payment) return void 0;
        const updated = { ...payment, ...data };
        this.payments.set(id, updated);
        return updated;
      }
      async deletePayment(id) {
        this.payments.delete(id);
      }
      async getLoanLedger(loanId) {
        return [];
      }
      async getLoanLedgerByGroupId(groupId) {
        return [];
      }
      async getLoansByGroupId(groupId) {
        return Array.from(this.loans.values()).filter((l) => l.groupId === groupId);
      }
      async getLoansForMember(groupId, memberId) {
        return Array.from(this.loans.values()).filter((l) => l.groupId === groupId && l.memberId === memberId);
      }
      async getLoanById(id) {
        return this.loans.get(id);
      }
      async createLoan(data) {
        const id = randomUUID();
        const loan = { ...data, id };
        this.loans.set(id, loan);
        return loan;
      }
      async updateLoan(id, data) {
        const loan = this.loans.get(id);
        if (!loan) return void 0;
        const updated = { ...loan, ...data };
        this.loans.set(id, updated);
        return updated;
      }
      async deleteLoan(id) {
        for (const [rid, r] of this.repayments.entries()) {
          if (r.loanId === id) this.repayments.delete(rid);
        }
        this.loans.delete(id);
      }
      async getRepaymentsByLoanId(loanId) {
        return Array.from(this.repayments.values()).filter((r) => r.loanId === loanId);
      }
      async getRepaymentsByGroupId(groupId) {
        const groupLoans = await this.getLoansByGroupId(groupId);
        const loanIds = new Set(groupLoans.map((l) => l.id));
        return Array.from(this.repayments.values()).filter(
          (r) => loanIds.has(r.loanId)
        );
      }
      async getRepaymentById(id) {
        return this.repayments.get(id);
      }
      async recordLoanRepayment(loanId, repaymentData, unpaidInterestPolicy) {
        const rep = await this.createRepayment({ ...repaymentData, loanId });
        const loan = await this.getLoanById(loanId);
        return { repayment: rep, ledger: {}, loan };
      }
      async createRepayment(data) {
        const id = randomUUID();
        const repayment = { ...data, id };
        this.repayments.set(id, repayment);
        return repayment;
      }
      async deleteRepayment(id) {
        this.repayments.delete(id);
      }
      async hasGroupSettings(groupId) {
        return this.settings.has(groupId);
      }
      async getGroupSettings(groupId) {
        return this.groupSettings.get(groupId) ?? { ...DEFAULT_SETTINGS };
      }
      async updateGroupSettings(groupId, settings) {
        this.groupSettings.set(groupId, settings);
      }
      async getGroupRules(groupId) {
        return this.groupRules.get(groupId) ?? "";
      }
      async updateGroupRules(groupId, rules) {
        this.groupRules.set(groupId, rules);
      }
      async acquireCronLock(jobName) {
        return true;
      }
      async getBanksByGroupId(groupId) {
        return Array.from(this.banks.values()).filter((b) => b.groupId === groupId);
      }
      async getBankById(id) {
        return this.banks.get(id);
      }
      async createBank(data) {
        const id = randomUUID();
        const bank = { ...data, id };
        this.banks.set(id, bank);
        return bank;
      }
      async updateBank(id, data) {
        const bank = this.banks.get(id);
        if (!bank) return void 0;
        const updated = { ...bank, ...data };
        this.banks.set(id, updated);
        return updated;
      }
      async deleteBank(id) {
        this.banks.delete(id);
      }
      // ── Identity & Membership (MemStorage stubs — not used in production) ──
      async getIdentityByPhone(_phone) {
        return void 0;
      }
      async getIdentityById(_id) {
        return void 0;
      }
      async createIdentity(data) {
        const id = randomUUID();
        const now2 = (/* @__PURE__ */ new Date()).toISOString();
        return { ...data, id, createdAt: now2, updatedAt: now2 };
      }
      async updateIdentity(_id, _data) {
        return void 0;
      }
      async getMembershipById(_id) {
        return void 0;
      }
      async getMembershipsByIdentityId(_identityId) {
        return [];
      }
      async getMembershipByIdentityAndGroup(_identityId, _groupId) {
        return void 0;
      }
      async getMembershipsByGroupId(_groupId) {
        return [];
      }
      async createMembership(data) {
        const id = randomUUID();
        return { ...data, id, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
      }
      async updateMembership(_id, _data) {
        return void 0;
      }
    };
    DatabaseStorage = class {
      get db() {
        return getDb();
      }
      async createSession(userId) {
        const token = randomUUID();
        await this.db.insert(sessions).values({ token, userId, createdAt: /* @__PURE__ */ new Date() });
        return { token, userId, createdAt: /* @__PURE__ */ new Date() };
      }
      async getSession(token) {
        const rows = await this.db.select().from(sessions).where(eq(sessions.token, token));
        const row = rows[0];
        if (!row) return void 0;
        return { token: row.token, userId: row.userId, createdAt: row.createdAt };
      }
      async deleteSession(token) {
        await this.db.delete(sessions).where(eq(sessions.token, token));
      }
      async getUserById(id) {
        const rows = await this.db.select().from(users).where(eq(users.id, id));
        return rows[0];
      }
      async getUserByPhone(phone) {
        const rows = await this.db.select().from(users).where(eq(users.phone, phone));
        return rows[0];
      }
      async getUsersByGroupId(groupId) {
        const rows = await this.db.select().from(users).where(eq(users.groupId, groupId));
        return rows;
      }
      async createUser(data) {
        const id = randomUUID();
        await this.db.insert(users).values({ ...data, id });
        return { ...data, id };
      }
      async updateUser(id, data) {
        await this.db.update(users).set(data).where(eq(users.id, id));
        return this.getUserById(id);
      }
      async getGroupByGroupId(groupId) {
        const rows = await this.db.select().from(groups).where(eq(groups.groupId, groupId));
        return rows[0];
      }
      async getGroupByUniqueGroupCode(code) {
        const rows = await this.db.select().from(groups).where(eq(groups.uniqueGroupCode, code));
        return rows[0];
      }
      async getAllGroups() {
        const rows = await this.db.select().from(groups).orderBy(desc(groups.createdAt));
        return rows;
      }
      async createGroup(data) {
        const id = randomUUID();
        await this.db.insert(groups).values({ ...data, id });
        return { ...data, id };
      }
      async updateGroup(groupId, data) {
        await this.db.update(groups).set(data).where(eq(groups.groupId, groupId));
        return this.getGroupByGroupId(groupId);
      }
      async deleteGroup(groupId) {
        await this.db.transaction(async (tx) => {
          const groupBankLoans2 = await tx.select({ id: groupBankLoans.id }).from(groupBankLoans).where(eq(groupBankLoans.groupId, groupId));
          const groupBankLoanIds = groupBankLoans2.map((l) => l.id);
          if (groupBankLoanIds.length > 0) {
            const allocations = await tx.select({ id: bankLoanAllocations.id }).from(bankLoanAllocations).where(inArray(bankLoanAllocations.bankLoanId, groupBankLoanIds));
            const allocationIds = allocations.map((a) => a.id);
            if (allocationIds.length > 0) {
              await tx.delete(bankLoanLedger).where(inArray(bankLoanLedger.allocationId, allocationIds));
              await tx.delete(bankLoanRepayments).where(inArray(bankLoanRepayments.allocationId, allocationIds));
            }
            await tx.delete(bankLoanAllocations).where(inArray(bankLoanAllocations.bankLoanId, groupBankLoanIds));
          }
          await tx.delete(groupBankLoans).where(eq(groupBankLoans.groupId, groupId));
          await tx.delete(affiliatedBanks).where(eq(affiliatedBanks.groupId, groupId));
          const loans2 = await tx.select({ id: loans.id }).from(loans).where(eq(loans.groupId, groupId));
          const loanIds = loans2.map((l) => l.id);
          if (loanIds.length > 0) {
            await tx.delete(loanLedger).where(inArray(loanLedger.loanId, loanIds));
            await tx.delete(loanRepayments).where(inArray(loanRepayments.loanId, loanIds));
          }
          await tx.delete(loans).where(eq(loans.groupId, groupId));
          await tx.delete(payments).where(eq(payments.groupId, groupId));
          await tx.delete(meetings).where(eq(meetings.groupId, groupId));
          const invCodes = await tx.select({ id: invitationCodes.id }).from(invitationCodes).where(eq(invitationCodes.groupId, groupId));
          const invCodeIds = invCodes.map((i) => i.id);
          if (invCodeIds.length > 0) {
            await tx.delete(invitationCodeUsage).where(inArray(invitationCodeUsage.invitationCodeId, invCodeIds));
          }
          await tx.delete(invitationCodes).where(eq(invitationCodes.groupId, groupId));
          const users2 = await tx.select({ id: users.id }).from(users).where(eq(users.groupId, groupId));
          const userIds = users2.map((u) => u.id);
          if (userIds.length > 0) {
            await tx.delete(sessions).where(inArray(sessions.userId, userIds));
          }
          await tx.delete(users).where(eq(users.groupId, groupId));
          await tx.delete(groupSettings).where(eq(groupSettings.groupId, groupId));
          await tx.delete(groups).where(eq(groups.groupId, groupId));
        });
      }
      async getMeetingsByGroupId(groupId) {
        const rows = await this.db.select().from(meetings).where(eq(meetings.groupId, groupId));
        return rows.map((r) => ({ ...r, attendance: r.attendance }));
      }
      async getMeetingById(id) {
        const rows = await this.db.select().from(meetings).where(eq(meetings.id, id));
        const r = rows[0];
        if (!r) return void 0;
        return { ...r, attendance: r.attendance };
      }
      async createMeeting(data) {
        const id = randomUUID();
        await this.db.insert(meetings).values({ ...data, id, attendance: data.attendance });
        return { ...data, id };
      }
      async updateMeeting(id, data) {
        await this.db.update(meetings).set(data).where(eq(meetings.id, id));
        return this.getMeetingById(id);
      }
      async deleteMeeting(id) {
        await this.db.delete(meetings).where(eq(meetings.id, id));
      }
      async getPaymentsByGroupId(groupId) {
        const rows = await this.db.select().from(payments).where(eq(payments.groupId, groupId));
        return rows;
      }
      async getPaymentsForMember(groupId, memberId) {
        const rows = await this.db.select().from(payments).where(
          and(eq(payments.groupId, groupId), eq(payments.memberId, memberId))
        );
        return rows;
      }
      async getPaymentById(id) {
        const rows = await this.db.select().from(payments).where(eq(payments.id, id));
        return rows[0];
      }
      async createPayment(data) {
        const id = randomUUID();
        await this.db.insert(payments).values({ ...data, id });
        return { ...data, id };
      }
      async updatePayment(id, data) {
        await this.db.update(payments).set(data).where(eq(payments.id, id));
        return this.getPaymentById(id);
      }
      async deletePayment(id) {
        await this.db.delete(payments).where(eq(payments.id, id));
      }
      async getLoanLedger(loanId) {
        return await this.db.select().from(loanLedger).where(eq(loanLedger.loanId, loanId));
      }
      async getLoanLedgerByGroupId(groupId) {
        const ledgers = await this.db.select({ ledger: loanLedger }).from(loanLedger).innerJoin(loans, eq(loanLedger.loanId, loans.id)).where(eq(loans.groupId, groupId));
        return ledgers.map((l) => l.ledger);
      }
      async getLoansByGroupId(groupId) {
        const rows = await this.db.select().from(loans).where(eq(loans.groupId, groupId));
        return rows;
      }
      async getLoansForMember(groupId, memberId) {
        const rows = await this.db.select().from(loans).where(
          and(eq(loans.groupId, groupId), eq(loans.memberId, memberId))
        );
        return rows;
      }
      async getLoanById(id) {
        const rows = await this.db.select().from(loans).where(eq(loans.id, id));
        return rows[0];
      }
      async createLoan(data) {
        const id = randomUUID();
        await this.db.insert(loans).values({ ...data, id });
        return { ...data, id };
      }
      async updateLoan(id, data) {
        await this.db.update(loans).set(data).where(eq(loans.id, id));
        return this.getLoanById(id);
      }
      async deleteLoan(id) {
        await this.db.delete(loanRepayments).where(eq(loanRepayments.loanId, id));
        await this.db.delete(loans).where(eq(loans.id, id));
      }
      async getRepaymentsByLoanId(loanId) {
        const rows = await this.db.select().from(loanRepayments).where(eq(loanRepayments.loanId, loanId));
        return rows;
      }
      async getRepaymentsByGroupId(groupId) {
        const groupLoans = await this.getLoansByGroupId(groupId);
        if (groupLoans.length === 0) return [];
        const loanIds = groupLoans.map((l) => l.id);
        const rows = await this.db.select().from(loanRepayments).where(inArray(loanRepayments.loanId, loanIds));
        return rows;
      }
      async getRepaymentById(id) {
        const rows = await this.db.select().from(loanRepayments).where(eq(loanRepayments.id, id));
        return rows[0];
      }
      async recordLoanRepayment(loanId, repaymentData, unpaidInterestPolicy) {
        const repId = randomUUID();
        const ledgerId = randomUUID();
        let finalRepayment;
        let finalLedger;
        let finalLoan;
        await this.db.transaction(async (tx) => {
          const loanArr = await tx.select().from(loans).where(eq(loans.id, loanId)).for("update");
          const currentLoan = loanArr[0];
          if (!currentLoan) throw new Error("Loan not found");
          const ledgerArr = await tx.select().from(loanLedger).where(eq(loanLedger.loanId, loanId)).orderBy(desc(loanLedger.date), desc(loanLedger.createdAt)).limit(1).for("update");
          const lastLedger = ledgerArr[0];
          const openingBalance = lastLedger ? lastLedger.closingPrincipal : currentLoan.amount;
          const outstandingInt = lastLedger ? lastLedger.outstandingInterest : 0;
          const shgAmount = repaymentData.shgAmount;
          const fixedInstallment = currentLoan.fixedPrincipalInstallment;
          const ledgerCalc = calculateNextLedgerEntry(
            { remainingBalance: openingBalance, outstandingInterest: outstandingInt },
            shgAmount,
            currentLoan.interest,
            fixedInstallment,
            unpaidInterestPolicy
          );
          if (Math.abs(openingBalance - ledgerCalc.principalPaid - ledgerCalc.closingPrincipal) > 0.01) {
            throw new Error("Integrity Check Failed: Opening - PrincipalPaid != Closing");
          }
          const dbRepayment = {
            ...repaymentData,
            loanId,
            date: new Date(repaymentData.date),
            id: repId
          };
          await tx.insert(loanRepayments).values(dbRepayment);
          const ledgerEntry = {
            id: ledgerId,
            loanId,
            receiptNo: `REP-${loanId.substring(0, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`,
            openingPrincipal: ledgerCalc.openingPrincipal,
            interestRateApplied: currentLoan.interest,
            interestCharged: ledgerCalc.interestCharged,
            interestPaid: ledgerCalc.interestPaid,
            principalPaid: ledgerCalc.principalPaid,
            paymentReceived: ledgerCalc.paymentReceived,
            closingPrincipal: ledgerCalc.closingPrincipal,
            outstandingInterest: ledgerCalc.outstandingInterest,
            date: new Date(repaymentData.date),
            type: "repayment",
            recordedBy: repaymentData.recordedBy,
            remarks: repaymentData.remarks
          };
          await tx.insert(loanLedger).values(ledgerEntry);
          const totalPrincipalPaid = currentLoan.totalPrincipalPaid + ledgerCalc.principalPaid;
          const totalInterestPaid = currentLoan.totalInterestPaid + ledgerCalc.interestPaid;
          const status = ledgerCalc.closingPrincipal <= 0 ? "completed" : currentLoan.status;
          await tx.update(loans).set({
            remainingBalance: ledgerCalc.closingPrincipal,
            outstandingInterest: ledgerCalc.outstandingInterest,
            totalPrincipalPaid,
            totalInterestPaid,
            status
          }).where(eq(loans.id, loanId));
          finalRepayment = dbRepayment;
          finalLedger = ledgerEntry;
          finalLoan = {
            ...currentLoan,
            remainingBalance: ledgerCalc.closingPrincipal,
            outstandingInterest: ledgerCalc.outstandingInterest,
            totalPrincipalPaid,
            totalInterestPaid,
            status
          };
        });
        return { repayment: finalRepayment, ledger: finalLedger, loan: finalLoan };
      }
      async createRepayment(data) {
        const id = randomUUID();
        await this.db.insert(loanRepayments).values({ ...data, id });
        return { ...data, id };
      }
      async deleteRepayment(id) {
        await this.db.delete(loanRepayments).where(eq(loanRepayments.id, id));
      }
      async hasGroupSettings(groupId) {
        const rows = await this.db.select().from(groupSettings).where(eq(groupSettings.groupId, groupId));
        return rows.length > 0;
      }
      async getGroupSettings(groupId) {
        const rows = await this.db.select().from(groupSettings).where(eq(groupSettings.groupId, groupId));
        if (!rows[0]) return { ...DEFAULT_SETTINGS };
        return rows[0].settings;
      }
      async updateGroupSettings(groupId, settings) {
        await this.db.insert(groupSettings).values({ groupId, settings }).onConflictDoUpdate({ target: groupSettings.groupId, set: { settings } });
      }
      async getGroupRules(groupId) {
        const rows = await this.db.select().from(groupRules).where(eq(groupRules.groupId, groupId));
        return rows[0]?.rules ?? "";
      }
      async updateGroupRules(groupId, rules) {
        await this.db.insert(groupRules).values({ groupId, rules }).onConflictDoUpdate({ target: groupRules.groupId, set: { rules } });
      }
      async acquireCronLock(jobName) {
        const now2 = /* @__PURE__ */ new Date();
        try {
          const existing = await this.db.select().from(cronLocks).where(eq(cronLocks.jobName, jobName));
          if (existing.length > 0) {
            const lastRun = new Date(existing[0].lockedAt).getTime();
            if (Date.now() - lastRun < 1e3 * 60 * 5) {
              return false;
            }
          }
          await this.db.insert(cronLocks).values({ jobName, lockedAt: /* @__PURE__ */ new Date() }).onConflictDoUpdate({ target: cronLocks.jobName, set: { lockedAt: /* @__PURE__ */ new Date() } });
          return true;
        } catch (e) {
          return false;
        }
      }
      async getInvitationCode(code) {
        const rows = await this.db.select().from(invitationCodes).where(eq(invitationCodes.code, code));
        return rows[0];
      }
      async getInvitationCodesByGroup(groupId) {
        const rows = await this.db.select().from(invitationCodes).where(eq(invitationCodes.groupId, groupId));
        return rows;
      }
      async createInvitationCode(data) {
        const id = randomUUID();
        await this.db.insert(invitationCodes).values({ ...data, id, currentUses: 0, createdAt: /* @__PURE__ */ new Date() });
        const rows = await this.db.select().from(invitationCodes).where(eq(invitationCodes.id, id));
        return rows[0];
      }
      async incrementInvitationCodeUsage(codeId, userId) {
        await this.db.transaction(async (tx) => {
          const rows = await tx.select().from(invitationCodes).where(eq(invitationCodes.id, codeId));
          if (!rows.length) throw new Error("Invalid code");
          const code = rows[0];
          if (code.currentUses >= code.maxUses) throw new Error("Code limit reached");
          await tx.update(invitationCodes).set({ currentUses: code.currentUses + 1 }).where(eq(invitationCodes.id, codeId));
          await tx.insert(invitationCodeUsage).values({
            id: randomUUID(),
            invitationCodeId: codeId,
            userId,
            usedAt: /* @__PURE__ */ new Date()
          });
        });
      }
      // ─── Affiliated Banks ──────────────────────────────────────────────────────
      async getBanksByGroupId(groupId) {
        const rows = await this.db.select().from(affiliatedBanks).where(eq(affiliatedBanks.groupId, groupId));
        return rows;
      }
      async getBankById(id) {
        const rows = await this.db.select().from(affiliatedBanks).where(eq(affiliatedBanks.id, id));
        return rows[0];
      }
      async createBank(data) {
        const id = randomUUID();
        await this.db.insert(affiliatedBanks).values({ ...data, id });
        const rows = await this.db.select().from(affiliatedBanks).where(eq(affiliatedBanks.id, id));
        return rows[0];
      }
      async updateBank(id, data) {
        await this.db.update(affiliatedBanks).set(data).where(eq(affiliatedBanks.id, id));
        return this.getBankById(id);
      }
      async deleteBank(id) {
        await this.db.delete(affiliatedBanks).where(eq(affiliatedBanks.id, id));
      }
      // --- Group Bank Loans Implementation ---
      async getGroupBankLoansByGroupId(groupId) {
        return await this.db.select().from(groupBankLoans).where(eq(groupBankLoans.groupId, groupId));
      }
      async getGroupBankLoanById(id) {
        const rows = await this.db.select().from(groupBankLoans).where(eq(groupBankLoans.id, id));
        return rows[0];
      }
      async createGroupBankLoan(loan) {
        const id = randomUUID();
        await this.db.insert(groupBankLoans).values({ ...loan, id });
        const rows = await this.db.select().from(groupBankLoans).where(eq(groupBankLoans.id, id));
        return rows[0];
      }
      async updateGroupBankLoan(id, data) {
        await this.db.update(groupBankLoans).set(data).where(eq(groupBankLoans.id, id));
        return this.getGroupBankLoanById(id);
      }
      async deleteGroupBankLoan(id) {
        const allocations = await this.getBankLoanAllocationsByLoanId(id);
        for (const alloc of allocations) {
          await this.db.delete(bankLoanRepayments).where(eq(bankLoanRepayments.allocationId, alloc.id));
          await this.db.delete(bankLoanLedger).where(eq(bankLoanLedger.allocationId, alloc.id));
        }
        await this.db.delete(bankLoanAllocations).where(eq(bankLoanAllocations.bankLoanId, id));
        await this.db.delete(groupBankLoans).where(eq(groupBankLoans.id, id));
      }
      async getBankLoanAllocationsByLoanId(bankLoanId) {
        return await this.db.select().from(bankLoanAllocations).where(eq(bankLoanAllocations.bankLoanId, bankLoanId));
      }
      async getBankLoanAllocationById(id) {
        const rows = await this.db.select().from(bankLoanAllocations).where(eq(bankLoanAllocations.id, id));
        return rows[0];
      }
      async getBankLoanAllocationsByGroupId(groupId) {
        const rows = await this.db.select({ alloc: bankLoanAllocations }).from(bankLoanAllocations).innerJoin(groupBankLoans, eq(bankLoanAllocations.bankLoanId, groupBankLoans.id)).where(eq(groupBankLoans.groupId, groupId));
        return rows.map((r) => r.alloc);
      }
      async allocateBankLoanFunds(allocations, ledgers) {
        await this.db.transaction(async (tx) => {
          for (let i = 0; i < allocations.length; i++) {
            const alloc = allocations[i];
            const ledger = ledgers[i];
            const allocId = randomUUID();
            await tx.insert(bankLoanAllocations).values({
              ...alloc,
              id: allocId,
              totalPrincipalPaid: 0,
              totalInterestPaid: 0,
              outstandingInterest: 0,
              status: "active"
            });
            const ledgerId = randomUUID();
            await tx.insert(bankLoanLedger).values({
              ...ledger,
              id: ledgerId,
              allocationId: allocId
            });
          }
        });
      }
      async getBankLoanLedger(allocationId) {
        return await this.db.select().from(bankLoanLedger).where(eq(bankLoanLedger.allocationId, allocationId));
      }
      async getGroupBankLoanLedgerByGroupId(groupId) {
        const ledgers = await this.db.select({ ledger: bankLoanLedger }).from(bankLoanLedger).innerJoin(bankLoanAllocations, eq(bankLoanLedger.allocationId, bankLoanAllocations.id)).innerJoin(groupBankLoans, eq(bankLoanAllocations.bankLoanId, groupBankLoans.id)).where(eq(groupBankLoans.groupId, groupId));
        return ledgers.map((l) => l.ledger);
      }
      async recordBankLoanRepayment(repayment, ledgerEntry, snapshotUpdate) {
        let repId = "";
        console.log("REPAYMENT DATE:", repayment.date);
        await this.db.transaction(async (tx) => {
          repId = randomUUID();
          await tx.insert(bankLoanRepayments).values({ ...repayment, id: repId });
          const ledgerId = randomUUID();
          await tx.insert(bankLoanLedger).values({ ...ledgerEntry, id: ledgerId });
          await tx.update(bankLoanAllocations).set(snapshotUpdate).where(eq(bankLoanAllocations.id, repayment.allocationId));
        });
        const rows = await this.db.select().from(bankLoanRepayments).where(eq(bankLoanRepayments.id, repId));
        return rows[0];
      }
      async getBankLoanAllocationsByMemberId(memberId) {
        return await this.db.select().from(bankLoanAllocations).where(eq(bankLoanAllocations.memberId, memberId));
      }
      async updateBankLoanAllocation(id, data) {
        await this.db.update(bankLoanAllocations).set(data).where(eq(bankLoanAllocations.id, id));
        return this.getBankLoanAllocationById(id);
      }
      async getBankLoanRepaymentsByAllocationId(allocationId) {
        return await this.db.select().from(bankLoanRepayments).where(eq(bankLoanRepayments.allocationId, allocationId));
      }
      async getNextBankLoanReceiptSequence(year) {
        const jobName = `bank_loan_receipt_seq_${year}`;
        const rows = await this.db.select().from(cronLocks).where(eq(cronLocks.jobName, jobName));
        if (rows.length === 0) {
          await this.db.insert(cronLocks).values({ jobName, lockedAt: /* @__PURE__ */ new Date() });
          return 1;
        }
        const allReps = await this.db.select().from(bankLoanRepayments);
        const yearStr = String(year);
        const count = allReps.filter((r) => r.receiptNo.includes(`BLR-${yearStr}-`)).length;
        return count + 1;
      }
      // ── Identity & Membership ───────────────────────────────────────────────────
      async getIdentityByPhone(phone) {
        const rows = await this.db.select().from(identities).where(eq(identities.phone, phone));
        return rows[0];
      }
      async getIdentityById(id) {
        const rows = await this.db.select().from(identities).where(eq(identities.id, id));
        return rows[0];
      }
      async createIdentity(data) {
        const id = randomUUID();
        const now2 = /* @__PURE__ */ new Date();
        await this.db.insert(identities).values({ ...data, id, createdAt: now2, updatedAt: now2 });
        return { ...data, id, createdAt: now2.toISOString(), updatedAt: now2.toISOString() };
      }
      async updateIdentity(id, data) {
        await this.db.update(identities).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(identities.id, id));
        return this.getIdentityById(id);
      }
      async getMembershipById(id) {
        const rows = await this.db.select().from(memberships).where(eq(memberships.id, id));
        return rows[0];
      }
      async getMembershipsByIdentityId(identityId) {
        const rows = await this.db.select().from(memberships).where(eq(memberships.identityId, identityId));
        return rows;
      }
      async getMembershipByIdentityAndGroup(identityId, groupId) {
        const rows = await this.db.select().from(memberships).where(
          and(eq(memberships.identityId, identityId), eq(memberships.groupId, groupId))
        );
        return rows[0];
      }
      async getMembershipsByGroupId(groupId) {
        const rows = await this.db.select().from(memberships).where(eq(memberships.groupId, groupId));
        return rows;
      }
      async createMembership(data) {
        const id = randomUUID();
        const now2 = /* @__PURE__ */ new Date();
        await this.db.insert(memberships).values({ ...data, id, createdAt: now2 });
        return { ...data, id, createdAt: now2.toISOString() };
      }
      async updateMembership(id, data) {
        await this.db.update(memberships).set(data).where(eq(memberships.id, id));
        return this.getMembershipById(id);
      }
    };
    storage = process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
  }
});

// server/cron.ts
var cron_exports = {};
__export(cron_exports, {
  startCronJobs: () => startCronJobs
});
function startCronJobs() {
  console.log("Starting background cron jobs...");
  setInterval(async () => {
    await runJobsSafely();
  }, 1e3 * 60 * 60 * 6);
  setTimeout(async () => {
    await runJobsSafely();
  }, 5e3);
}
async function runJobsSafely() {
  const locked = await storage.acquireCronLock("monthly_payments");
  if (!locked) {
    console.log("Cron job skipped (lock not acquired or recently run)");
    return;
  }
  try {
    await calculateLateFees();
  } catch (e) {
    console.error("Cron job error:", e);
  }
}
async function calculateLateFees() {
  const groups2 = await storage.getAllGroups();
  const now2 = /* @__PURE__ */ new Date();
  for (const group of groups2) {
    const settings = await storage.getGroupSettings(group.groupId);
    if (!settings || !settings.setupProgress?.settings) continue;
    const payments2 = await storage.getPaymentsByGroupId(group.groupId);
    const pendingPayments = payments2.filter(
      (p) => (p.status === "payment_not_received" || p.status === "pending" || p.status === "pending_verification") && p.dueDate
    );
    for (const payment of pendingPayments) {
      if (!payment.dueDate) continue;
      const dueDate = new Date(payment.dueDate);
      dueDate.setDate(dueDate.getDate() + settings.gracePeriodDays);
      if (now2 > dueDate) {
        let newLateFee = 0;
        if (settings.lateFeeType === "fixed") {
          newLateFee = settings.lateFeeAmount;
        } else if (settings.lateFeeType === "daily") {
          const originalDueDate = new Date(payment.dueDate);
          const daysOverdue = Math.floor((now2.getTime() - originalDueDate.getTime()) / (1e3 * 60 * 60 * 24));
          newLateFee = daysOverdue > 0 ? daysOverdue * settings.lateFeeAmount : 0;
        } else if (settings.lateFeeType === "none") {
          newLateFee = 0;
        }
        if (payment.lateFee !== newLateFee) {
          await storage.updatePayment(payment.id, { lateFee: newLateFee });
          console.log(`Updated late fee for payment ${payment.id} to ${newLateFee}`);
        }
      }
    }
  }
}
var init_cron = __esm({
  "server/cron.ts"() {
    "use strict";
    init_storage();
  }
});

// server/index.ts
import "dotenv/config";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

// server/routes.ts
init_storage();
import { createServer } from "node:http";

// server/super-admin-routes.ts
init_storage();
import { randomBytes, randomUUID as randomUUID2 } from "crypto";
function requireSuperAdmin(req, res, next) {
  const authReq = req;
  if (!authReq.currentUser || authReq.currentUser.role !== "super_admin") {
    return res.status(403).json({ error: "Forbidden: Super Admin access required" });
  }
  next();
}
function registerSuperAdminRoutes(app2) {
  app2.post("/api/super-admin/groups", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { name, preferredLanguage } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Missing group name" });
      }
      const uniqueGroupCode = "SHG-" + randomBytes(4).toString("hex").toUpperCase().slice(0, 8);
      const groupId = randomUUID2();
      const group = await storage.createGroup({
        groupId,
        uniqueGroupCode,
        name,
        preferredLanguage: preferredLanguage || "mr",
        status: "pending",
        presidentId: null,
        createdBySuperAdmin: req.currentUser.id,
        createdAt: /* @__PURE__ */ new Date()
      });
      return res.status(201).json(group);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal server error", details: e.message });
    }
  });
  app2.get("/api/super-admin/groups", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const groups2 = await storage.getAllGroups();
      return res.json(groups2);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.patch("/api/super-admin/groups/:groupId/status", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { groupId } = req.params;
      const { status } = req.body;
      if (!["active", "suspended", "inactive"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const group = await storage.getGroupByGroupId(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      const updated = await storage.updateGroup(group.groupId, { status });
      return res.json(updated);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.delete("/api/super-admin/groups/:groupId", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { groupId } = req.params;
      const group = await storage.getGroupByGroupId(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      await storage.deleteGroup(group.groupId);
      return res.json({ success: true, message: "Group deleted successfully" });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}

// server/invitation-routes.ts
init_storage();
import { randomBytes as randomBytes2 } from "crypto";
function registerInvitationRoutes(app2) {
  app2.post("/api/groups/:groupId/invitations", requireAuth, requireSameGroup, async (req, res) => {
    try {
      if (req.currentUser?.role !== "president") {
        return res.status(403).json({ error: "Only presidents can generate invitations" });
      }
      const { groupId } = req.params;
      const group = await storage.getGroupByGroupId(groupId);
      if (!group || group.status === "pending") {
        return res.status(400).json({ error: "Group is not fully active yet" });
      }
      const { maxUses = 1, expiresInDays = 7 } = req.body;
      const code = randomBytes2(3).toString("hex").toUpperCase();
      const expiresAt = /* @__PURE__ */ new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      const invitation = await storage.createInvitationCode({
        code,
        groupId,
        active: true,
        maxUses,
        expiresAt,
        createdBy: req.currentUser.id
      });
      return res.status(201).json(invitation);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/groups/:groupId/invitations", requireAuth, requireSameGroup, async (req, res) => {
    try {
      if (req.currentUser?.role !== "president") {
        return res.status(403).json({ error: "Only presidents can view invitations" });
      }
      const { groupId } = req.params;
      const invitations = await storage.getInvitationCodesByGroup(groupId);
      return res.json(invitations);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}

// server/routes.ts
init_accounting();

// shared/bankLoanAccounting.ts
function generateBankLoanReceiptNo(year, sequenceNumber) {
  const paddedSeq = String(sequenceNumber).padStart(6, "0");
  return `BLR-${year}-${paddedSeq}`;
}
function applyBankLoanRepayment(openingPrincipal, outstandingInterest, annualInterestRate, paymentReceived) {
  const monthlyRate = annualInterestRate / 100 / 12;
  const interestCharged = Math.round(openingPrincipal * monthlyRate);
  const totalInterestDue = interestCharged + outstandingInterest;
  let interestPaid;
  let principalPaid;
  let newOutstandingInterest;
  if (paymentReceived >= totalInterestDue) {
    interestPaid = totalInterestDue;
    principalPaid = Math.min(paymentReceived - totalInterestDue, openingPrincipal);
    newOutstandingInterest = 0;
  } else {
    interestPaid = paymentReceived;
    principalPaid = 0;
    newOutstandingInterest = totalInterestDue - paymentReceived;
  }
  const closingPrincipal = Math.max(0, openingPrincipal - principalPaid);
  return {
    openingPrincipal,
    interestCharged,
    interestPaid,
    principalPaid,
    paymentReceived,
    closingPrincipal,
    outstandingInterest: newOutstandingInterest
  };
}

// server/routes.ts
init_db();
init_schema();
import Groq from "groq-sdk";
async function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    console.log("requireAuth 401: Missing or invalid auth header", auth);
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = auth.slice(7);
  const session = await storage.getSession(token);
  if (!session) {
    console.log("requireAuth 401: Session not found for token", token);
    return res.status(401).json({ error: "Invalid or expired session" });
  }
  const user = await storage.getUserById(session.userId);
  if (!user) {
    console.log("requireAuth 401: User not found for session", session.userId);
    return res.status(401).json({ error: "User not found" });
  }
  req.currentUser = user;
  req.currentSession = session;
  next();
}
function requirePresident(req, res, next) {
  if (req.currentUser?.role !== "president") {
    return res.status(403).json({ error: "President access required" });
  }
  next();
}
function requirePresidentOrTreasurer(req, res, next) {
  if (req.currentUser?.role !== "president" && req.currentUser?.role !== "treasurer") {
    return res.status(403).json({ error: "President or Treasurer access required" });
  }
  next();
}
function requireSameGroup(groupId, req, res, next) {
  if (req.currentUser?.groupId !== groupId) {
    return res.status(403).json({ error: "Access denied: different group" });
  }
  next();
}
function now(req) {
  if (req.body && req.body.deviceTime) {
    const d = new Date(req.body.deviceTime);
    if (!isNaN(d.getTime())) return d;
  }
  return /* @__PURE__ */ new Date();
}
async function registerRoutes(app2) {
  registerSuperAdminRoutes(app2);
  registerInvitationRoutes(app2);
  app2.post("/api/auth/register/president", async (req, res) => {
    try {
      const { name, phone, password, village, joinDate, exitDate, uniqueGroupCode } = req.body;
      if (!name || !phone || !password || !village || !uniqueGroupCode) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const existingGroup = await storage.getGroupByUniqueGroupCode(uniqueGroupCode);
      if (!existingGroup) return res.status(404).json({ error: "groupNotFound" });
      if (existingGroup.presidentId || existingGroup.status !== "pending") {
        return res.status(409).json({ error: "Group already claimed" });
      }
      const existingIdentity = await storage.getIdentityByPhone(phone);
      if (existingIdentity) {
        const existingMembership = await storage.getMembershipByIdentityAndGroup(existingIdentity.id, existingGroup.groupId);
        if (existingMembership) {
          return res.status(409).json({ error: "alreadyMemberOfThisGroup" });
        }
      } else {
        const usersInGroup = await storage.getUsersByGroupId(existingGroup.groupId);
        if (usersInGroup.some((u) => u.phone === phone)) {
          return res.status(409).json({ error: "alreadyMemberOfThisGroup" });
        }
      }
      const user = await storage.createUser({
        name,
        phone,
        password,
        village,
        joinDate: joinDate ? new Date(joinDate) : now(req),
        exitDate: exitDate ? new Date(exitDate) : void 0,
        role: "president",
        groupId: existingGroup.groupId,
        status: "active",
        preferredLanguage: existingGroup.preferredLanguage
      });
      await storage.updateGroup(existingGroup.groupId, {
        presidentId: user.id,
        status: "active",
        activatedOn: /* @__PURE__ */ new Date()
      });
      let identity = existingIdentity;
      if (!identity) {
        identity = await storage.createIdentity({ phone, password, name, preferredLanguage: existingGroup.preferredLanguage || "en" });
      } else {
        await storage.updateIdentity(identity.id, { password });
      }
      const membership = await storage.createMembership({ identityId: identity.id, groupId: existingGroup.groupId, userId: user.id, role: "president", status: "active" });
      await storage.updateIdentity(identity.id, { lastOpenedMembershipId: membership.id });
      const session = await storage.createSession(user.id);
      const group = await storage.getGroupByGroupId(existingGroup.groupId);
      const { password: _p, ...safeUser } = user;
      return res.status(201).json({ token: session.token, user: safeUser, group });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/auth/register/member", async (req, res) => {
    try {
      const { name, phone, password, village, joinDate, exitDate, uniqueGroupCode } = req.body;
      if (!name || !phone || !password || !village || !uniqueGroupCode) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const group = await storage.getGroupByUniqueGroupCode(uniqueGroupCode);
      if (!group) return res.status(404).json({ error: "invalidOrExpiredCode" });
      if (group.status === "pending") return res.status(404).json({ error: "groupNotFound" });
      const existingIdentity = await storage.getIdentityByPhone(phone);
      if (existingIdentity) {
        const existingMembership = await storage.getMembershipByIdentityAndGroup(existingIdentity.id, group.groupId);
        if (existingMembership) {
          return res.status(409).json({ error: "alreadyMemberOfThisGroup" });
        }
      }
      const usersInGroup = await storage.getUsersByGroupId(group.groupId);
      const manuallyAdded = usersInGroup.find((u) => u.phone === phone && u.password === "password123");
      let user;
      if (manuallyAdded) {
        user = await storage.updateUser(manuallyAdded.id, { name, password, village });
        if (existingIdentity) {
          await storage.updateIdentity(existingIdentity.id, { password });
        } else {
          const identity = await storage.createIdentity({ phone, password, name, preferredLanguage: group.preferredLanguage || "en" });
          const membership = await storage.createMembership({ identityId: identity.id, groupId: group.groupId, userId: manuallyAdded.id, role: manuallyAdded.role, status: "active" });
          await storage.updateIdentity(identity.id, { lastOpenedMembershipId: membership.id });
        }
      } else {
        user = await storage.createUser({
          name,
          phone,
          password,
          village,
          joinDate: joinDate ? new Date(joinDate) : now(req),
          exitDate: exitDate ? new Date(exitDate) : void 0,
          role: "member",
          groupId: group.groupId,
          status: "active",
          preferredLanguage: group.preferredLanguage
        });
        let identity = existingIdentity;
        if (!identity) {
          identity = await storage.createIdentity({ phone, password, name, preferredLanguage: group.preferredLanguage || "en" });
        } else {
          await storage.updateIdentity(identity.id, { password });
        }
        const membership = await storage.createMembership({ identityId: identity.id, groupId: group.groupId, userId: user.id, role: "member", status: "active" });
        if (!existingIdentity?.lastOpenedMembershipId) {
          await storage.updateIdentity(identity.id, { lastOpenedMembershipId: membership.id });
        }
      }
      const session = await storage.createSession(user.id);
      const { password: _p, ...safeUser } = user;
      return res.status(201).json({ token: session.token, user: safeUser, group });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/groups/verify/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const group = await storage.getGroupByUniqueGroupCode(code.trim());
      if (!group) {
        return res.status(404).json({ error: "invalidOrExpiredCode" });
      }
      return res.json({ name: group.name, uniqueGroupCode: group.uniqueGroupCode });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { phone, password, membershipId } = req.body;
      if (!phone || !password) {
        return res.status(400).json({ error: "Phone and password required" });
      }
      const identity = await storage.getIdentityByPhone(phone);
      if (identity) {
        if (identity.password !== password) {
          return res.status(401).json({ error: "invalidCredentials" });
        }
        const allMemberships = await storage.getMembershipsByIdentityId(identity.id);
        const active = allMemberships.filter((m) => m.status === "active");
        if (active.length === 0) {
          return res.status(401).json({ error: "invalidCredentials" });
        }
        let targetMembership = membershipId ? active.find((m) => m.id === membershipId) : identity.lastOpenedMembershipId ? active.find((m) => m.id === identity.lastOpenedMembershipId) : void 0;
        if (!targetMembership && active.length === 1) {
          targetMembership = active[0];
        }
        if (!targetMembership) {
          const groups2 = await Promise.all(active.map(async (m) => {
            const grp = await storage.getGroupByGroupId(m.groupId);
            return { membershipId: m.id, groupId: m.groupId, groupName: grp?.name || m.groupId, role: m.role, village: grp?.village };
          }));
          return res.json({ requiresGroupSelection: true, memberships: groups2 });
        }
        const user2 = await storage.getUserById(targetMembership.userId);
        if (!user2) return res.status(401).json({ error: "invalidCredentials" });
        await storage.updateIdentity(identity.id, { lastOpenedMembershipId: targetMembership.id });
        const session2 = await storage.createSession(user2.id);
        const group2 = await storage.getGroupByGroupId(user2.groupId);
        const { password: _p2, ...safeUser2 } = user2;
        return res.json({ token: session2.token, user: safeUser2, group: group2 });
      }
      const user = await storage.getUserByPhone(phone);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "invalidCredentials" });
      }
      const session = await storage.createSession(user.id);
      const group = await storage.getGroupByGroupId(user.groupId);
      const { password: _p, ...safeUser } = user;
      return res.json({ token: session.token, user: safeUser, group });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post(
    "/api/auth/change-password",
    requireAuth,
    async (req, res) => {
      try {
        const { currentPassword, newPassword, village } = req.body;
        if (!newPassword) {
          return res.status(400).json({ error: "Password cannot be empty" });
        }
        const user = await storage.getUserById(req.currentUser.id);
        if (!user || currentPassword && user.password !== currentPassword) {
          return res.status(401).json({ error: "Invalid current password" });
        }
        const updateData = { password: newPassword };
        if (village) updateData.village = village;
        const updatedUser = await storage.updateUser(user.id, updateData);
        if (!updatedUser) return res.status(500).json({ error: "Failed to update password" });
        const identity = await storage.getIdentityByPhone(user.phone);
        if (identity) {
          await storage.updateIdentity(identity.id, { password: newPassword });
          const memberships2 = await storage.getMembershipsByIdentityId(identity.id);
          for (const m of memberships2) {
            if (m.userId !== user.id) {
              await storage.updateUser(m.userId, { password: newPassword });
            }
          }
        }
        const { password: _p, ...safeUser } = updatedUser;
        return res.json({ ok: true, user: safeUser });
      } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
      }
    }
  );
  app2.post(
    "/api/auth/logout",
    requireAuth,
    async (req, res) => {
      if (req.currentSession) {
        await storage.deleteSession(req.currentSession.token);
      }
      return res.json({ ok: true });
    }
  );
  app2.get(
    "/api/auth/session",
    requireAuth,
    async (req, res) => {
      const user = req.currentUser;
      const group = await storage.getGroupByGroupId(user.groupId);
      const { password: _p, ...safeUser } = user;
      return res.json({ user: safeUser, group });
    }
  );
  app2.post("/api/auth/select-membership", async (req, res) => {
    try {
      const { phone, password, membershipId } = req.body;
      if (!phone || !password || !membershipId) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const identity = await storage.getIdentityByPhone(phone);
      if (!identity || identity.password !== password) {
        return res.status(401).json({ error: "invalidCredentials" });
      }
      const membership = await storage.getMembershipById(membershipId);
      if (!membership || membership.identityId !== identity.id || membership.status !== "active") {
        return res.status(403).json({ error: "invalidMembership" });
      }
      const user = await storage.getUserById(membership.userId);
      if (!user) return res.status(401).json({ error: "invalidCredentials" });
      await storage.updateIdentity(identity.id, { lastOpenedMembershipId: membershipId });
      const session = await storage.createSession(user.id);
      const group = await storage.getGroupByGroupId(user.groupId);
      const { password: _p, ...safeUser } = user;
      return res.json({ token: session.token, user: safeUser, group });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post(
    "/api/auth/switch-membership",
    requireAuth,
    async (req, res) => {
      try {
        const { membershipId, password } = req.body;
        if (!membershipId || !password) {
          return res.status(400).json({ error: "Missing required fields" });
        }
        const currentUser = req.currentUser;
        const identity = await storage.getIdentityByPhone(currentUser.phone);
        if (!identity || identity.password !== password) {
          return res.status(401).json({ error: "invalidCredentials" });
        }
        const membership = await storage.getMembershipById(membershipId);
        if (!membership || membership.identityId !== identity.id || membership.status !== "active") {
          return res.status(403).json({ error: "invalidMembership" });
        }
        const targetUser = await storage.getUserById(membership.userId);
        if (!targetUser) return res.status(401).json({ error: "invalidCredentials" });
        if (req.currentSession) {
          await storage.deleteSession(req.currentSession.token);
        }
        await storage.updateIdentity(identity.id, { lastOpenedMembershipId: membershipId });
        const session = await storage.createSession(targetUser.id);
        const group = await storage.getGroupByGroupId(targetUser.groupId);
        const { password: _p, ...safeUser } = targetUser;
        return res.json({ token: session.token, user: safeUser, group });
      } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
      }
    }
  );
  app2.get(
    "/api/auth/my-memberships",
    requireAuth,
    async (req, res) => {
      try {
        const currentUser = req.currentUser;
        const identity = await storage.getIdentityByPhone(currentUser.phone);
        if (!identity) {
          const group = await storage.getGroupByGroupId(currentUser.groupId);
          return res.json({ memberships: [{ membershipId: null, groupId: currentUser.groupId, groupName: group?.name || currentUser.groupId, role: currentUser.role, village: group?.village }] });
        }
        const allMemberships = await storage.getMembershipsByIdentityId(identity.id);
        const active = allMemberships.filter((m) => m.status === "active");
        const result = await Promise.all(active.map(async (m) => {
          const grp = await storage.getGroupByGroupId(m.groupId);
          return { membershipId: m.id, groupId: m.groupId, groupName: grp?.name || m.groupId, role: m.role, village: grp?.village };
        }));
        return res.json({ memberships: result });
      } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Internal server error" });
      }
    }
  );
  app2.post(
    "/api/groups/:groupId/members",
    requireAuth,
    requireSameGroup,
    requirePresident,
    async (req, res) => {
      try {
        const { groupId } = req.params;
        const { name, phone, joinDate, address } = req.body;
        if (!name || !phone) return res.status(400).json({ error: "Name and phone are required" });
        const existingUsersInGroup = await storage.getUsersByGroupId(groupId);
        if (existingUsersInGroup.some((u) => u.phone === phone.trim())) {
          return res.status(409).json({ error: "Phone number already registered" });
        }
        const group = await storage.getGroupByGroupId(groupId);
        const user = await storage.createUser({
          name: name.trim(),
          phone: phone.trim(),
          password: "password123",
          // Default password for manually added members
          village: address || group?.village || "",
          joinDate: joinDate ? new Date(joinDate) : now(req),
          role: "member",
          groupId,
          status: "active",
          preferredLanguage: group?.preferredLanguage || "en"
        });
        const { password: _p, ...safeUser } = user;
        return res.status(201).json(safeUser);
      } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Failed to add member" });
      }
    }
  );
  app2.patch(
    "/api/groups/:groupId",
    requireAuth,
    requireSameGroup,
    requirePresidentOrTreasurer,
    async (req, res) => {
      const { groupId } = req.params;
      const data = req.body;
      const updatedGroup = await storage.updateGroup(groupId, data);
      if (!updatedGroup) {
        return res.status(404).json({ error: "Group not found" });
      }
      return res.json(updatedGroup);
    }
  );
  app2.get(
    "/api/groups/:groupId/summary",
    requireAuth,
    requireSameGroup,
    async (req, res) => {
      try {
        const { groupId } = req.params;
        const payments2 = await storage.getPaymentsByGroupId(groupId);
        const loans2 = await storage.getLoansByGroupId(groupId);
        const repayments = await storage.getRepaymentsByGroupId(groupId);
        const members = await storage.getUsersByGroupId(groupId);
        const activeMembers = members.filter((m) => m.status === "active").length;
        const groupSettings2 = await storage.getGroupSettings(groupId);
        const openingBalances = groupSettings2?.openingBalances || {};
        const openingSavings = Number(openingBalances.totalSavings) || 0;
        const openingBalance = Number(openingBalances.currentBalance) || 0;
        const totalSavings = openingSavings + payments2.filter((p) => p.status === "confirmed" && p.amount > 0).reduce((sum, p) => sum + p.amount, 0);
        const totalPenalties = payments2.filter((p) => p.status === "confirmed" && p.lateFee > 0).reduce((sum, p) => sum + p.lateFee, 0);
        const activeLoansCount = loans2.filter((l) => ["approved", "completed"].includes(l.status) && l.remainingBalance > 0).length;
        const completedLoansCount = loans2.filter((l) => l.status === "completed" || l.status === "approved" && l.remainingBalance <= 0).length;
        const approvedLoans = loans2.filter((l) => ["approved", "completed"].includes(l.status));
        const totalPrincipalDisbursed = approvedLoans.reduce((sum, l) => sum + l.amount, 0);
        const appDisbursedLoans = approvedLoans.filter((l) => l.resolutionNo !== "MIGRATED");
        const totalPrincipalDisbursedInApp = appDisbursedLoans.reduce((sum, l) => sum + l.amount, 0);
        const principalCollected = approvedLoans.reduce((sum, l) => sum + (l.totalPrincipalPaid || 0), 0);
        const interestCollected = approvedLoans.reduce((sum, l) => sum + (l.totalInterestPaid || 0), 0);
        const outstandingPrincipal = approvedLoans.reduce((sum, l) => sum + (l.remainingBalance || 0), 0);
        const outstandingInterest = approvedLoans.reduce((sum, l) => sum + (l.outstandingInterest || 0), 0);
        const totalRepaymentsForCash = repayments.reduce((sum, r) => sum + resolveRepaymentAmounts(r).shgAmount, 0);
        const operationalSavings = totalSavings - openingSavings;
        const currentBalance = openingBalance + operationalSavings + totalPenalties + totalRepaymentsForCash - totalPrincipalDisbursedInApp;
        return res.json({
          totalSavings,
          currentBalance,
          totalPrincipalDisbursed,
          principalCollected,
          interestCollected,
          outstandingPrincipal,
          outstandingInterest,
          activeLoansCount,
          completedLoansCount,
          activeMembers
        });
      } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Failed to load summary" });
      }
    }
  );
  app2.post(
    "/api/groups/:groupId/opening-balances",
    requireAuth,
    requireSameGroup,
    requirePresident,
    async (req, res) => {
      try {
        const { groupId } = req.params;
        const openingBalances = req.body;
        const settings = await storage.getGroupSettings(groupId);
        settings.openingBalances = openingBalances;
        settings.setupProgress = {
          ...settings.setupProgress || {},
          openingBalances: true
        };
        const openingDateStr = openingBalances.openingDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const expiry = new Date(openingDateStr);
        expiry.setDate(expiry.getDate() + 30);
        settings.migrationWindowExpiry = expiry.toISOString();
        await storage.updateGroupSettings(groupId, settings);
        return res.json({ success: true, settings });
      } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Failed to save opening balances" });
      }
    }
  );
  app2.post(
    "/api/groups/:groupId/setup-progress",
    requireAuth,
    requireSameGroup,
    requirePresident,
    async (req, res) => {
      try {
        const { groupId } = req.params;
        const updates = req.body;
        const settings = await storage.getGroupSettings(groupId);
        settings.setupProgress = {
          ...settings.setupProgress || {},
          ...updates
        };
        await storage.updateGroupSettings(groupId, settings);
        return res.json({ success: true, settings });
      } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Failed to update setup progress" });
      }
    }
  );
  app2.post(
    "/api/auth/verify-password",
    requireAuth,
    async (req, res) => {
      const { password } = req.body;
      const isValid = req.currentUser.password === password;
      return res.json({ valid: isValid });
    }
  );
  app2.patch(
    "/api/groups/:groupId/treasurer",
    requireAuth,
    requirePresident,
    async (req, res) => {
      const { groupId } = req.params;
      if (req.currentUser.groupId !== groupId)
        return res.status(403).json({ error: "Access denied" });
      const { userId } = req.body;
      if (userId === null || userId === void 0) {
        const currentGroup2 = await storage.getGroupByGroupId(groupId);
        if (currentGroup2?.treasurerId) {
          await storage.updateUser(currentGroup2.treasurerId, {
            role: "member"
          });
        }
        const updated2 = await storage.updateGroup(groupId, {
          treasurerId: void 0
        });
        return res.json(updated2);
      }
      const target = await storage.getUserById(userId);
      if (!target || target.groupId !== groupId) {
        return res.status(404).json({ error: "User not found in this group" });
      }
      if (target.role === "president") {
        return res.status(400).json({ error: "Cannot assign president as treasurer" });
      }
      const currentGroup = await storage.getGroupByGroupId(groupId);
      if (currentGroup?.treasurerId && currentGroup.treasurerId !== userId) {
        await storage.updateUser(currentGroup.treasurerId, { role: "member" });
      }
      await storage.updateUser(userId, { role: "treasurer" });
      const updated = await storage.updateGroup(groupId, {
        treasurerId: userId
      });
      return res.json(updated);
    }
  );
  app2.get(
    "/api/groups/:groupId/members",
    requireAuth,
    async (req, res) => {
      const { groupId } = req.params;
      if (req.currentUser.groupId !== groupId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const members = await storage.getUsersByGroupId(groupId);
      const safe = members.map(({ password: _p, ...u }) => ({
        ...u,
        isRegistered: _p !== "password123"
      }));
      return res.json(safe);
    }
  );
  app2.patch(
    "/api/members/:memberId",
    requireAuth,
    requirePresident,
    async (req, res) => {
      const { memberId } = req.params;
      const { status, contributionStartMonth } = req.body;
      const target = await storage.getUserById(memberId);
      if (!target || target.groupId !== req.currentUser.groupId) {
        return res.status(404).json({ error: "Member not found" });
      }
      const updates = {};
      if (status !== void 0) {
        if (!["active", "left"].includes(status)) {
          return res.status(400).json({ error: "Invalid status" });
        }
        updates.status = status;
      }
      if (contributionStartMonth !== void 0) {
        updates.contributionStartMonth = contributionStartMonth;
      }
      const updated = await storage.updateUser(memberId, updates);
      const { password: _p, ...safe } = updated;
      return res.json(safe);
    }
  );
  app2.get(
    "/api/groups/:groupId/meetings",
    requireAuth,
    async (req, res) => {
      const { groupId } = req.params;
      if (req.currentUser.groupId !== groupId)
        return res.status(403).json({ error: "Access denied" });
      const meetings2 = await storage.getMeetingsByGroupId(groupId);
      return res.json(meetings2);
    }
  );
  app2.post(
    "/api/meetings",
    requireAuth,
    requirePresidentOrTreasurer,
    async (req, res) => {
      const { scheduledDate, agenda, groupId } = req.body;
      if (req.currentUser.groupId !== groupId)
        return res.status(403).json({ error: "Access denied" });
      const meeting = await storage.createMeeting({
        groupId,
        scheduledDate: new Date(scheduledDate),
        agenda,
        createdBy: req.currentUser.id,
        notes: "",
        status: "scheduled",
        createdAt: now(req)
      });
      return res.status(201).json(meeting);
    }
  );
  app2.delete(
    "/api/meetings/:meetingId",
    requireAuth,
    requirePresident,
    async (req, res) => {
      const { meetingId } = req.params;
      const meeting = await storage.getMeetingById(meetingId);
      if (!meeting || meeting.groupId !== req.currentUser.groupId) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      await storage.deleteMeeting(meetingId);
      return res.json({ ok: true });
    }
  );
  app2.patch(
    "/api/meetings/:meetingId",
    requireAuth,
    requirePresidentOrTreasurer,
    async (req, res) => {
      const { meetingId } = req.params;
      const meeting = await storage.getMeetingById(meetingId);
      if (!meeting || meeting.groupId !== req.currentUser.groupId) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      const allowed = [
        "scheduledDate",
        "agenda",
        "notes",
        "attendance",
        "status"
      ];
      const updates = {};
      for (const key of allowed) {
        if (req.body[key] !== void 0) {
          if (req.currentUser.role === "treasurer" && ["scheduledDate", "agenda", "status"].includes(key)) {
            return res.status(403).json({ error: "Treasurer cannot edit meeting details" });
          }
          updates[key] = req.body[key];
        }
      }
      const updated = await storage.updateMeeting(meetingId, updates);
      return res.json(updated);
    }
  );
  app2.get(
    "/api/groups/:groupId/payments",
    requireAuth,
    async (req, res) => {
      const { groupId } = req.params;
      if (req.currentUser.groupId !== groupId)
        return res.status(403).json({ error: "Access denied" });
      const user = req.currentUser;
      const payments2 = user.role === "member" ? await storage.getPaymentsForMember(groupId, user.id) : await storage.getPaymentsByGroupId(groupId);
      return res.json(payments2);
    }
  );
  app2.post(
    "/api/groups/:groupId/payments",
    requireAuth,
    requirePresidentOrTreasurer,
    async (req, res) => {
      const { groupId } = req.params;
      if (req.currentUser.groupId !== groupId)
        return res.status(403).json({ error: "Access denied" });
      const { memberId, amount, lateFee = 0, month, mode } = req.body;
      if (!amount || amount <= 0)
        return res.status(400).json({ error: "Valid amount required" });
      if (!Number.isInteger(Number(amount)) || !Number.isInteger(Number(lateFee)) || Number(lateFee) < 0) {
        return res.status(400).json({ error: "Amount and late fee must be whole, non-negative values" });
      }
      if (!memberId) return res.status(400).json({ error: "Member is required" });
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || "")) {
        return res.status(400).json({ error: "Valid payment month required" });
      }
      const [paymentYear] = month.split("-").map(Number);
      if (paymentYear < 1900 || paymentYear > 2100) {
        return res.status(400).json({ error: "Valid payment year required" });
      }
      const paymentMode = mode === "online" ? "online" : "cash";
      const user = req.currentUser;
      const member = await storage.getUserById(memberId);
      if (!member || member.groupId !== groupId || member.status !== "active") {
        return res.status(400).json({ error: "Selected member is not active in this group" });
      }
      const payment = await storage.createPayment({
        groupId,
        memberId: member.id,
        memberName: member.name,
        amount: Number(amount),
        expectedAmount: 0,
        lateFee: Number(lateFee),
        month,
        dueDate: null,
        date: now(req),
        mode: paymentMode,
        status: "confirmed",
        verifiedBy: user.id,
        verifiedAt: now(req)
      });
      return res.status(201).json(payment);
    }
  );
  app2.patch(
    "/api/payments/:paymentId",
    requireAuth,
    async (req, res) => {
      const { paymentId } = req.params;
      const { status, reason } = req.body;
      const user = req.currentUser;
      const payment = await storage.getPaymentById(paymentId);
      if (!payment) return res.status(404).json({ error: "Payment not found" });
      if (payment.groupId !== user.groupId)
        return res.status(403).json({ error: "Access denied" });
      const isOverride = payment.status === "confirmed" || payment.status === "rejected" || payment.status === "payment_not_received";
      if (isOverride) {
        if (user.role !== "president") {
          return res.status(403).json({ error: "Only President can override a verified payment" });
        }
      } else {
        if (payment.mode === "online") {
          if (user.role !== "treasurer" && user.role !== "president") {
            return res.status(403).json({ error: "Treasurer or President access required" });
          }
          if (!["confirmed", "payment_not_received"].includes(status)) {
            return res.status(400).json({ error: "Invalid status for online payment" });
          }
        } else {
          if (user.role !== "president" && user.role !== "treasurer") {
            return res.status(403).json({ error: "President or Treasurer access required" });
          }
          if (!["confirmed", "rejected"].includes(status)) {
            return res.status(400).json({ error: "Invalid status for cash payment" });
          }
        }
      }
      const updateData = {
        status
      };
      if (isOverride) {
        updateData.overriddenBy = user.id;
        updateData.overrideAt = now(req);
        if (reason) updateData.overrideReason = reason;
      } else {
        updateData.verifiedBy = user.id;
        updateData.verifiedAt = now(req);
        if (status === "rejected" || status === "payment_not_received") {
          if (reason) updateData.rejectionReason = reason;
          updateData.rejectedBy = user.id;
          updateData.rejectedAt = now(req);
        }
      }
      if (status === "confirmed") {
        updateData.verifiedBy = user.id;
        updateData.verifiedAt = now(req);
      }
      if (status === "confirmed" && payment.amount === 0) {
        updateData.amount = (payment.expectedAmount || 0) + (payment.lateFee || 0);
      }
      const updated = await storage.updatePayment(paymentId, updateData);
      return res.json(updated);
    }
  );
  app2.patch(
    "/api/payments/:paymentId/reopen",
    requireAuth,
    requirePresident,
    async (req, res) => {
      const { paymentId } = req.params;
      const user = req.currentUser;
      const payment = await storage.getPaymentById(paymentId);
      if (!payment) return res.status(404).json({ error: "Payment not found" });
      if (payment.groupId !== user.groupId)
        return res.status(403).json({ error: "Access denied" });
      if (payment.status !== "rejected" && payment.status !== "payment_not_received") {
        return res.status(400).json({ error: "Only rejected payments can be reopened" });
      }
      const updated = await storage.updatePayment(paymentId, {
        status: "pending",
        verifiedBy: null,
        verifiedAt: null,
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
        overriddenBy: user.id,
        overrideAt: /* @__PURE__ */ new Date(),
        overrideReason: "Payment reopened by President"
      });
      return res.json(updated);
    }
  );
  app2.delete(
    "/api/payments/:paymentId",
    requireAuth,
    requirePresident,
    async (req, res) => {
      const { paymentId } = req.params;
      const payment = await storage.getPaymentById(paymentId);
      if (!payment) return res.status(404).json({ error: "Payment not found" });
      if (payment.groupId !== req.currentUser.groupId)
        return res.status(403).json({ error: "Access denied" });
      await storage.deletePayment(paymentId);
      return res.json({ ok: true });
    }
  );
  app2.put(
    "/api/groups/:groupId/qr-code",
    requireAuth,
    async (req, res) => {
      const { groupId } = req.params;
      const user = req.currentUser;
      if (user.groupId !== groupId)
        return res.status(403).json({ error: "Access denied" });
      if (user.role !== "treasurer" && user.role !== "president") {
        return res.status(403).json({ error: "Treasurer or President access required" });
      }
      const { qrCode } = req.body;
      const updated = await storage.updateGroup(groupId, {
        qrCode: qrCode || void 0
      });
      if (!updated) return res.status(404).json({ error: "Group not found" });
      return res.json({ ok: true });
    }
  );
  app2.get(
    "/api/groups/:groupId/qr-code",
    requireAuth,
    async (req, res) => {
      const { groupId } = req.params;
      if (req.currentUser.groupId !== groupId)
        return res.status(403).json({ error: "Access denied" });
      const group = await storage.getGroupByGroupId(groupId);
      if (!group) return res.status(404).json({ error: "Group not found" });
      return res.json({ qrCode: group.qrCode || null });
    }
  );
  app2.get(
    "/api/groups/:groupId/banks",
    requireAuth,
    async (req, res) => {
      const { groupId } = req.params;
      if (req.currentUser.groupId !== groupId)
        return res.status(403).json({ error: "Access denied" });
      const banks = await storage.getBanksByGroupId(groupId);
      return res.json(banks);
    }
  );
  app2.post(
    "/api/groups/:groupId/banks",
    requireAuth,
    requirePresident,
    async (req, res) => {
      const { groupId } = req.params;
      if (req.currentUser.groupId !== groupId)
        return res.status(403).json({ error: "Access denied" });
      const { name, branch, ifscCode, contactPerson, contactNumber, notes } = req.body;
      if (!name || !name.trim())
        return res.status(400).json({ error: "Bank name is required" });
      const bank = await storage.createBank({
        groupId,
        name: name.trim(),
        branch: branch?.trim() || void 0,
        ifscCode: ifscCode?.trim() || void 0,
        contactPerson: contactPerson?.trim() || void 0,
        contactNumber: contactNumber?.trim() || void 0,
        notes: notes?.trim() || void 0,
        isActive: true,
        createdBy: req.currentUser.id,
        createdAt: now(req).toISOString()
      });
      return res.status(201).json(bank);
    }
  );
  app2.patch(
    "/api/banks/:bankId",
    requireAuth,
    requirePresident,
    async (req, res) => {
      const { bankId } = req.params;
      const bank = await storage.getBankById(bankId);
      if (!bank || bank.groupId !== req.currentUser.groupId)
        return res.status(404).json({ error: "Bank not found" });
      const { name, branch, ifscCode, contactPerson, contactNumber, notes, isActive } = req.body;
      const updates = {};
      if (name !== void 0) updates.name = name.trim();
      if (branch !== void 0) updates.branch = branch.trim() || null;
      if (ifscCode !== void 0) updates.ifscCode = ifscCode.trim() || null;
      if (contactPerson !== void 0) updates.contactPerson = contactPerson.trim() || null;
      if (contactNumber !== void 0) updates.contactNumber = contactNumber.trim() || null;
      if (notes !== void 0) updates.notes = notes.trim() || null;
      if (isActive !== void 0) updates.isActive = isActive;
      const updated = await storage.updateBank(bankId, updates);
      return res.json(updated);
    }
  );
  app2.delete(
    "/api/banks/:bankId",
    requireAuth,
    requirePresident,
    async (req, res) => {
      const { bankId } = req.params;
      const bank = await storage.getBankById(bankId);
      if (!bank || bank.groupId !== req.currentUser.groupId)
        return res.status(404).json({ error: "Bank not found" });
      await storage.updateBank(bankId, { isActive: false });
      return res.json({ ok: true });
    }
  );
  app2.get(
    "/api/groups/:groupId/loans",
    requireAuth,
    async (req, res) => {
      const { groupId } = req.params;
      if (req.currentUser.groupId !== groupId)
        return res.status(403).json({ error: "Access denied" });
      const user = req.currentUser;
      const loans2 = user.role === "member" ? await storage.getLoansForMember(groupId, user.id) : await storage.getLoansByGroupId(groupId);
      return res.json(loans2);
    }
  );
  app2.post(
    "/api/groups/:groupId/loans",
    requireAuth,
    async (req, res) => {
      const { groupId } = req.params;
      if (req.currentUser.groupId !== groupId)
        return res.status(403).json({ error: "Access denied" });
      const caller = req.currentUser;
      if (caller.role !== "president" && caller.role !== "treasurer")
        return res.status(403).json({ error: "Only the President or Treasurer can create loans" });
      const { amount, duration, memberId, memberName, startDate, isExisting, isCompleted, outstandingPrincipal, loanDate } = req.body;
      if (!amount || !duration)
        return res.status(400).json({ error: "Amount and duration required" });
      let targetMemberId = caller.id;
      let targetMemberName = caller.name;
      if (memberId) {
        const targetMember = await storage.getUserById(memberId);
        if (!targetMember || targetMember.groupId !== groupId)
          return res.status(400).json({ error: "Invalid member selected" });
        targetMemberId = targetMember.id;
        targetMemberName = memberName ?? targetMember.name;
      }
      const settings = await storage.getGroupSettings(groupId);
      if (isExisting) {
        const expiry = settings?.migrationWindowExpiry;
        if (!expiry || /* @__PURE__ */ new Date() > new Date(expiry)) {
          return res.status(403).json({ error: "migrationWindowExpired" });
        }
      }
      if (amount <= 0) return res.status(400).json({ error: "invalidAmount" });
      if (!isExisting && amount > settings.maxLoanAmount)
        return res.status(400).json({ error: "exceedsMaxLoan" });
      const sorted = [...settings.durationRules].sort(
        (a, b) => a.maxAmount - b.maxAmount
      );
      const rule = sorted.find((r) => amount <= r.maxAmount) || sorted[sorted.length - 1];
      if (duration < rule.minDuration)
        return res.status(400).json({ error: "durationTooShort" });
      if (duration > rule.maxDuration)
        return res.status(400).json({ error: "durationTooLong" });
      const group = await storage.getGroupByGroupId(groupId);
      let initialStatus = group?.treasurerId ? "pending_treasurer" : "pending_president";
      const principal = Number(amount);
      const rate = settings.interestRate;
      const dur = Number(duration);
      const totalInterest = Math.round(principal * (rate / 100) * dur);
      const totalRepayable = principal + totalInterest;
      const method = "reducing_balance";
      let remainingBal = method === "reducing_balance" ? principal : totalRepayable;
      let totalPrincipalAlreadyPaid = 0;
      if (isExisting) {
        initialStatus = "approved";
        if (isCompleted) {
          initialStatus = "completed";
          remainingBal = 0;
          totalPrincipalAlreadyPaid = principal;
        } else {
          remainingBal = Number(outstandingPrincipal) || principal;
          totalPrincipalAlreadyPaid = principal - remainingBal;
        }
      }
      const loan = await storage.createLoan({
        groupId,
        memberId: targetMemberId,
        memberName: targetMemberName,
        resolutionNo: isExisting ? "MIGRATED" : "",
        amount: principal,
        interest: rate,
        duration: dur,
        startDate: startDate ?? null,
        // Display-only; does not affect loan_ledger
        status: initialStatus,
        createdAt: isExisting && loanDate ? new Date(loanDate) : now(req),
        hasBankLoan: false,
        bankId: void 0,
        bankName: void 0,
        bankLoanAmount: void 0,
        bankInterestRate: void 0,
        bankDuration: void 0,
        bankRemainingBalance: void 0,
        bankLoanRemarks: void 0,
        calculationMethod: method,
        remainingBalance: remainingBal,
        totalPrincipalPaid: totalPrincipalAlreadyPaid,
        totalInterestPaid: 0,
        outstandingInterest: 0
      });
      return res.status(201).json(loan);
    }
  );
  app2.patch(
    "/api/loans/:loanId/treasurer-approve",
    requireAuth,
    async (req, res) => {
      const user = req.currentUser;
      if (user.role !== "treasurer")
        return res.status(403).json({ error: "Treasurer access required" });
      const { loanId } = req.params;
      const loan = await storage.getLoanById(loanId);
      if (!loan || loan.groupId !== user.groupId)
        return res.status(404).json({ error: "Loan not found" });
      if (loan.status !== "pending_treasurer")
        return res.status(400).json({ error: "Loan is not awaiting treasurer approval" });
      const updateData = {
        status: "pending_president",
        treasurerActionBy: user.id,
        treasurerActionAt: now(req)
      };
      if (req.body.hasBankLoan) {
        updateData.hasBankLoan = true;
        updateData.bankName = req.body.bankName;
        updateData.bankLoanAmount = Number(req.body.bankAmount);
        updateData.bankInterestRate = Number(req.body.bankInterestRate) || 0;
        updateData.bankDuration = Number(req.body.bankDuration);
        updateData.bankLoanRemarks = req.body.bankRemarks;
        const bRate = updateData.bankInterestRate;
        const bPrincipal = updateData.bankLoanAmount;
        const bDur = updateData.bankDuration;
        const bInterest = Math.round(bPrincipal * (bRate / 100) * bDur);
        updateData.bankRemainingBalance = bPrincipal + bInterest;
      } else if (req.body.hasBankLoan === false) {
        updateData.hasBankLoan = false;
        updateData.bankName = null;
        updateData.bankLoanAmount = null;
        updateData.bankInterestRate = null;
        updateData.bankDuration = null;
        updateData.bankLoanRemarks = null;
        updateData.bankRemainingBalance = null;
      }
      const updated = await storage.updateLoan(loanId, updateData);
      return res.json(updated);
    }
  );
  app2.patch(
    "/api/loans/:loanId/treasurer-reject",
    requireAuth,
    async (req, res) => {
      const user = req.currentUser;
      if (user.role !== "treasurer")
        return res.status(403).json({ error: "Treasurer access required" });
      const { loanId } = req.params;
      const { reason } = req.body;
      const loan = await storage.getLoanById(loanId);
      if (!loan || loan.groupId !== user.groupId)
        return res.status(404).json({ error: "Loan not found" });
      if (loan.status !== "pending_treasurer")
        return res.status(400).json({ error: "Loan is not awaiting treasurer approval" });
      const updateData = {
        status: "treasurer_rejected",
        treasurerActionBy: user.id,
        treasurerActionAt: now(req)
      };
      if (reason) updateData.rejectionReason = reason;
      updateData.rejectedBy = user.id;
      updateData.rejectedAt = now(req);
      const updated = await storage.updateLoan(loanId, updateData);
      return res.json(updated);
    }
  );
  app2.patch(
    "/api/loans/:loanId/approve",
    requireAuth,
    requirePresident,
    async (req, res) => {
      const { loanId } = req.params;
      const { resolutionNo, meetingId } = req.body;
      const loan = await storage.getLoanById(loanId);
      if (!loan || loan.groupId !== req.currentUser.groupId) {
        return res.status(404).json({ error: "Loan not found" });
      }
      if (loan.status !== "pending_president" && loan.status !== "pending_treasurer") {
        return res.status(400).json({ error: "Loan is not awaiting approval" });
      }
      const isOverride = loan.status === "pending_treasurer";
      const updateData = {
        status: "approved",
        resolutionNo: resolutionNo || "",
        meetingId,
        approvedBy: req.currentUser.id,
        approvedAt: now(req)
      };
      if (loan.calculationMethod === "reducing_balance") {
        updateData.remainingBalance = loan.amount;
      }
      if (isOverride) {
        updateData.presidentOverride = true;
        updateData.overrideAt = now(req);
        updateData.overrideReason = "Approved directly by President";
      }
      if (req.body.hasBankLoan) {
        updateData.hasBankLoan = true;
        updateData.bankName = req.body.bankName;
        updateData.bankLoanAmount = Number(req.body.bankAmount);
        updateData.bankInterestRate = Number(req.body.bankInterestRate) || 0;
        updateData.bankDuration = Number(req.body.bankDuration);
        updateData.bankLoanRemarks = req.body.bankRemarks;
        const bRate = updateData.bankInterestRate;
        const bPrincipal = updateData.bankLoanAmount;
        const bDur = updateData.bankDuration;
        const bInterest = Math.round(bPrincipal * (bRate / 100) * bDur);
        updateData.bankRemainingBalance = bPrincipal + bInterest;
      } else if (req.body.hasBankLoan === false) {
        updateData.hasBankLoan = false;
        updateData.bankName = null;
        updateData.bankLoanAmount = null;
        updateData.bankInterestRate = null;
        updateData.bankDuration = null;
        updateData.bankLoanRemarks = null;
        updateData.bankRemainingBalance = null;
      }
      const updated = await storage.updateLoan(loanId, updateData);
      if (updated.calculationMethod === "reducing_balance") {
        const db = getDb();
        const ledgerId = crypto.randomUUID();
        const receiptNo = `DISB-${loanId.substring(0, 8).toUpperCase()}`;
        await db.insert(loanLedger).values({
          id: ledgerId,
          loanId,
          receiptNo,
          openingPrincipal: 0,
          interestRateApplied: updated.interest,
          interestCharged: 0,
          interestPaid: 0,
          principalPaid: 0,
          paymentReceived: 0,
          closingPrincipal: updated.amount,
          outstandingInterest: 0,
          date: now(req),
          type: "disbursement",
          recordedBy: req.currentUser.id
        });
      }
      return res.json(updated);
    }
  );
  app2.patch(
    "/api/loans/:loanId/reject",
    requireAuth,
    requirePresident,
    async (req, res) => {
      const { loanId } = req.params;
      const { reason } = req.body;
      const loan = await storage.getLoanById(loanId);
      if (!loan || loan.groupId !== req.currentUser.groupId) {
        return res.status(404).json({ error: "Loan not found" });
      }
      if (loan.status !== "pending_president" && loan.status !== "pending_treasurer") {
        return res.status(400).json({ error: "Loan is not awaiting approval" });
      }
      const isOverride = loan.status === "pending_treasurer";
      const updateData = {
        status: "rejected",
        approvedBy: req.currentUser.id,
        approvedAt: now(req),
        rejectedBy: req.currentUser.id,
        rejectedAt: /* @__PURE__ */ new Date()
      };
      if (reason) updateData.rejectionReason = reason;
      if (isOverride) {
        updateData.presidentOverride = true;
        updateData.overrideAt = now(req);
        updateData.overrideReason = "Rejected directly by President";
      }
      const updated = await storage.updateLoan(loanId, updateData);
      return res.json(updated);
    }
  );
  app2.delete(
    "/api/loans/:loanId",
    requireAuth,
    requirePresident,
    async (req, res) => {
      const { loanId } = req.params;
      const loan = await storage.getLoanById(loanId);
      if (!loan || loan.groupId !== req.currentUser.groupId) {
        return res.status(404).json({ error: "Loan not found" });
      }
      await storage.deleteLoan(loanId);
      return res.json({ ok: true });
    }
  );
  app2.get(
    "/api/loans/:loanId/repayments",
    requireAuth,
    async (req, res) => {
      const { loanId } = req.params;
      const loan = await storage.getLoanById(loanId);
      if (!loan || loan.groupId !== req.currentUser.groupId) {
        return res.status(404).json({ error: "Loan not found" });
      }
      if (req.currentUser.role !== "president" && req.currentUser.role !== "treasurer" && loan.memberId !== req.currentUser.id) {
        return res.status(403).json({ error: "You are not authorized to view this loan." });
      }
      const repayments = await storage.getRepaymentsByLoanId(loanId);
      return res.json(repayments);
    }
  );
  app2.get(
    "/api/loans/:loanId/ledger",
    requireAuth,
    async (req, res) => {
      const { loanId } = req.params;
      const loan = await storage.getLoanById(loanId);
      if (!loan || loan.groupId !== req.currentUser.groupId) {
        return res.status(404).json({ error: "Loan not found" });
      }
      if (req.currentUser.role !== "president" && req.currentUser.role !== "treasurer" && loan.memberId !== req.currentUser.id) {
        return res.status(403).json({ error: "You are not authorized to view this loan." });
      }
      const ledger = await storage.getLoanLedger(loanId);
      return res.json(ledger);
    }
  );
  app2.get(
    "/api/groups/:groupId/loan-ledger",
    requireAuth,
    async (req, res) => {
      const { groupId } = req.params;
      if (req.currentUser.groupId !== groupId) {
        return res.status(403).json({ error: "Access denied" });
      }
      let ledger = await storage.getLoanLedgerByGroupId(groupId);
      if (req.currentUser.role !== "president" && req.currentUser.role !== "treasurer") {
        const userLoans = await storage.getLoansForMember(groupId, req.currentUser.id);
        const userLoanIds = userLoans.map((l) => l.id);
        ledger = ledger.filter((l) => userLoanIds.includes(l.loanId));
      }
      return res.json(ledger);
    }
  );
  app2.post(
    "/api/loans/:loanId/repayments",
    requireAuth,
    requirePresidentOrTreasurer,
    async (req, res) => {
      const { loanId } = req.params;
      const { amount, shgAmount, bankAmount, date, remarks } = req.body;
      const loan = await storage.getLoanById(loanId);
      if (!loan || loan.groupId !== req.currentUser.groupId) {
        return res.status(404).json({ error: "Loan not found" });
      }
      const shg = Number(shgAmount) || 0;
      const bank = Number(bankAmount) || 0;
      const total = Number(amount) || shg + bank;
      if (total <= 0)
        return res.status(400).json({ error: "Valid amount required" });
      if (shg < 0 || bank < 0)
        return res.status(400).json({ error: "Amounts cannot be negative" });
      if (!loan.hasBankLoan && bank > 0)
        return res.status(400).json({ error: "This loan does not have a bank component" });
      const repaymentDate = date ? new Date(date) : now(req);
      if (Number.isNaN(repaymentDate.getTime())) {
        return res.status(400).json({ error: "Valid repayment date required" });
      }
      let repayment;
      if (loan.calculationMethod === "reducing_balance") {
        const groupSettings2 = await storage.getGroupSettings(loan.groupId);
        const policy = groupSettings2.unpaidInterestPolicy || "due";
        const result = await storage.recordLoanRepayment(
          loanId,
          {
            amount: shg + bank,
            shgAmount: shg,
            bankAmount: bank,
            date: repaymentDate.toISOString(),
            recordedBy: req.currentUser.id,
            remarks: remarks?.trim() || void 0
          },
          policy
        );
        repayment = result.repayment;
      } else {
        repayment = await storage.createRepayment({
          loanId,
          amount: shg + bank,
          shgAmount: shg,
          bankAmount: bank,
          date: repaymentDate,
          recordedBy: req.currentUser.id,
          remarks: remarks?.trim() || void 0
        });
        if (shg > 0) {
          const allRepayments = await storage.getRepaymentsByLoanId(loanId);
          const totalShgRepaid = allRepayments.reduce((s, r) => s + resolveRepaymentAmounts(r).shgAmount, 0);
          const shgTotal = loan.amount + Math.round(loan.amount * (loan.interest / 100) * loan.duration);
          const newBalance = Math.max(0, shgTotal - totalShgRepaid);
          await storage.updateLoan(loanId, { remainingBalance: newBalance });
        }
        if (bank > 0 && loan.hasBankLoan) {
          const allRepayments = await storage.getRepaymentsByLoanId(loanId);
          const totalBankRepaid = allRepayments.reduce((s, r) => s + resolveRepaymentAmounts(r).bankAmount, 0);
          const bankTotal = (loan.bankLoanAmount || 0) + Math.round((loan.bankLoanAmount || 0) * ((loan.bankInterestRate || 0) / 100) * (loan.bankDuration || 0));
          const newBankBalance = Math.max(0, bankTotal - totalBankRepaid);
          await storage.updateLoan(loanId, { bankRemainingBalance: newBankBalance });
        }
      }
      const updatedLoan = await storage.getLoanById(loanId);
      return res.status(201).json({ success: true, loan: updatedLoan, repayment });
    }
  );
  app2.delete(
    "/api/repayments/:repaymentId",
    requireAuth,
    requirePresident,
    async (req, res) => {
      const { repaymentId } = req.params;
      const repayment = await storage.getRepaymentById(repaymentId);
      if (!repayment) {
        return res.status(404).json({ error: "Repayment not found" });
      }
      const loan = await storage.getLoanById(repayment.loanId);
      if (!loan || loan.groupId !== req.currentUser.groupId) {
        return res.status(404).json({ error: "Loan not found" });
      }
      if (loan.calculationMethod === "reducing_balance") {
        return res.status(400).json({ error: "Repayments for reducing balance loans are immutable and cannot be deleted." });
      }
      await storage.deleteRepayment(repaymentId);
      const allRepayments = await storage.getRepaymentsByLoanId(loan.id);
      const totalShgRepaid = allRepayments.reduce((s, r) => s + resolveRepaymentAmounts(r).shgAmount, 0);
      const shgTotal = loan.amount + Math.round(loan.amount * (loan.interest / 100) * loan.duration);
      const newBalance = Math.max(0, shgTotal - totalShgRepaid);
      const totalBankRepaid = allRepayments.reduce((s, r) => s + resolveRepaymentAmounts(r).bankAmount, 0);
      const bankTotal = (loan.bankLoanAmount || 0) + Math.round((loan.bankLoanAmount || 0) * ((loan.bankInterestRate || 0) / 100) * (loan.bankDuration || 0));
      const newBankBalance = loan.hasBankLoan ? Math.max(0, bankTotal - totalBankRepaid) : null;
      const updatedLoan = await storage.updateLoan(loan.id, {
        remainingBalance: newBalance,
        ...loan.hasBankLoan ? { bankRemainingBalance: newBankBalance } : {}
      });
      return res.json({ ok: true, loan: updatedLoan });
    }
  );
  app2.get(
    "/api/groups/:groupId/repayments",
    requireAuth,
    async (req, res) => {
      const { groupId } = req.params;
      if (req.currentUser.groupId !== groupId)
        return res.status(403).json({ error: "Access denied" });
      let repayments = await storage.getRepaymentsByGroupId(groupId);
      if (req.currentUser.role !== "president" && req.currentUser.role !== "treasurer") {
        const userLoans = await storage.getLoansForMember(groupId, req.currentUser.id);
        const userLoanIds = userLoans.map((l) => l.id);
        repayments = repayments.filter((r) => userLoanIds.includes(r.loanId));
      }
      return res.json(repayments);
    }
  );
  app2.get(
    "/api/groups/:groupId/settings",
    requireAuth,
    async (req, res) => {
      const { groupId } = req.params;
      if (req.currentUser.groupId !== groupId)
        return res.status(403).json({ error: "Access denied" });
      const settings = await storage.getGroupSettings(groupId);
      return res.json(settings);
    }
  );
  app2.put(
    "/api/groups/:groupId/settings",
    requireAuth,
    requirePresident,
    async (req, res) => {
      const { groupId } = req.params;
      if (req.currentUser.groupId !== groupId)
        return res.status(403).json({ error: "Access denied" });
      try {
        const existingSettings = await storage.getGroupSettings(groupId);
        const newSettings = { ...existingSettings, ...req.body };
        await storage.updateGroupSettings(groupId, newSettings);
        return res.json({ ok: true });
      } catch (e) {
        return res.status(500).json({ error: "Failed to update settings" });
      }
    }
  );
  app2.post("/api/auth/logout", (req, res) => {
    res.json({ success: true });
  });
  app2.patch("/api/users/language", requireAuth, async (req, res) => {
    try {
      const { preferredLanguage } = req.body;
      if (!preferredLanguage || !["en", "mr"].includes(preferredLanguage)) {
        return res.status(400).json({ error: "Invalid language" });
      }
      await storage.updateUser(req.currentUser.id, { preferredLanguage });
      return res.json({ success: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get(
    "/api/groups/:groupId/rules",
    requireAuth,
    async (req, res) => {
      const { groupId } = req.params;
      if (req.currentUser.groupId !== groupId)
        return res.status(403).json({ error: "Access denied" });
      const rules = await storage.getGroupRules(groupId);
      return res.json({ rules });
    }
  );
  app2.put(
    "/api/groups/:groupId/rules",
    requireAuth,
    requirePresident,
    async (req, res) => {
      const { groupId } = req.params;
      if (req.currentUser.groupId !== groupId)
        return res.status(403).json({ error: "Access denied" });
      const { rules } = req.body;
      await storage.updateGroupRules(groupId, rules || "");
      return res.json({ ok: true });
    }
  );
  app2.post(
    "/api/nlp/classify",
    requireAuth,
    async (req, res) => {
      try {
        const { transcript } = req.body;
        if (!transcript || typeof transcript !== "string" || transcript.trim().length === 0) {
          return res.status(400).json({ error: "transcript required" });
        }
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
          return res.status(503).json({ error: "NLP service not configured" });
        }
        const groq = new Groq({ apiKey });
        const prompt = `You are an assistant for a rural women's Self Help Group (SHG) app called "SHG Records".
The app has these screens: Dashboard, Meetings, Payments/Savings, Loans, Members, History, Rules, Loan Settings, Request Loan.

The user said (in Marathi or English): "${transcript.trim()}"

Classify their intent into exactly ONE of these actions:
- VIEW_DASHBOARD \u2014 home screen, dashboard, \u092E\u0941\u0916\u094D\u092F \u092A\u0943\u0937\u094D\u0920, total group savings, \u0917\u091F\u093E\u091A\u0940 \u090F\u0915\u0942\u0923 \u092C\u091A\u0924, group balance, \u0917\u091F\u093E\u091A\u0940 \u0936\u093F\u0932\u094D\u0932\u0915, monthly collection, \u091A\u093E\u0932\u0942 \u092E\u0939\u093F\u0928\u094D\u092F\u093E\u091A\u0940 \u0935\u0938\u0941\u0932\u0940
- VIEW_MEETINGS \u2014 meetings, \u092C\u0948\u0920\u0915, \u092C\u0948\u0920\u0915\u093E
- VIEW_PAYMENTS \u2014 payments, savings, \u092C\u091A\u0924, \u092D\u0930\u0923\u093E, \u092A\u0948\u0938\u0947, pending payments, \u0925\u0915\u0940\u0924 \u0926\u0947\u092F\u0915\u0947
- VIEW_LOANS \u2014 loans, \u0915\u0930\u094D\u091C, \u0915\u0930\u094D\u091C\u0947
- VIEW_MEMBERS \u2014 members, \u0938\u0926\u0938\u094D\u092F
- VIEW_HISTORY \u2014 history, \u0907\u0924\u093F\u0939\u093E\u0938, all records
- VIEW_RULES \u2014 rules, \u0928\u093F\u092F\u092E, \u0917\u091F\u093E\u091A\u0947 \u0928\u093F\u092F\u092E
- LOAN_SETTINGS \u2014 loan settings, \u0915\u0930\u094D\u091C \u0938\u0947\u091F\u093F\u0902\u0917\u094D\u091C, interest rate
- REQUEST_LOAN \u2014 request loan, \u0915\u0930\u094D\u091C \u092E\u093E\u0917\u0923\u0940, apply for loan
- VIEW_REPORTS \u2014 reports, \u0905\u0939\u0935\u093E\u0932, download report, savings report, loan report, generate savings report, \u092C\u091A\u0924 \u0905\u0939\u0935\u093E\u0932, generate loan report, \u0915\u0930\u094D\u091C \u0905\u0939\u0935\u093E\u0932, overdue members, \u0909\u0936\u093F\u0930\u093E\u0928\u0947 \u092D\u0930\u0932\u0947\u0932\u0947 \u0938\u0926\u0938\u094D\u092F
- UNKNOWN \u2014 cannot determine

Reply with ONLY a JSON object, no markdown, no explanation:
{"action":"ACTION_NAME","confidence":"high|medium|low","replyEn":"short friendly response in English","replyMr":"short friendly response in Marathi"}`;
        const completion = await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          temperature: 0,
          messages: [{ role: "user", content: prompt }]
        });
        const text2 = (completion.choices[0]?.message?.content || "").trim();
        let parsed;
        try {
          const jsonMatch = text2.match(/\{[\s\S]*\}/);
          parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text2);
        } catch {
          return res.json({
            action: "UNKNOWN",
            confidence: "low",
            replyEn: "Sorry, I didn't understand.",
            replyMr: "\u092E\u093E\u092B \u0915\u0930\u093E, \u092E\u0932\u093E \u0938\u092E\u091C\u0932\u0947 \u0928\u093E\u0939\u0940."
          });
        }
        const routeMap = {
          VIEW_DASHBOARD: "/(main)/",
          VIEW_MEETINGS: "/(main)/meetings",
          VIEW_PAYMENTS: "/(main)/payments",
          VIEW_LOANS: "/loans",
          VIEW_MEMBERS: "/members",
          VIEW_HISTORY: "/history",
          VIEW_RULES: "/rules",
          LOAN_SETTINGS: "/loan-settings",
          REQUEST_LOAN: "/create-loan",
          VIEW_REPORTS: "/reports"
        };
        return res.json({
          action: parsed.action || "UNKNOWN",
          route: routeMap[parsed.action] || null,
          confidence: parsed.confidence || "low",
          replyEn: parsed.replyEn || "Done!",
          replyMr: parsed.replyMr || "\u0920\u0940\u0915 \u0906\u0939\u0947!"
        });
      } catch (e) {
        console.error("NLP classify error:", e);
        return res.status(500).json({ error: "NLP service error" });
      }
    }
  );
  app2.get(
    "/api/groups/:groupId/bank-loans",
    requireAuth,
    async (req, res) => {
      const { groupId } = req.params;
      if (req.currentUser.groupId !== groupId)
        return res.status(403).json({ error: "Access denied" });
      const bankLoans = await storage.getGroupBankLoansByGroupId(groupId);
      return res.json(bankLoans);
    }
  );
  app2.post(
    "/api/groups/:groupId/bank-loans",
    requireAuth,
    requirePresidentOrTreasurer,
    async (req, res) => {
      const { groupId } = req.params;
      if (req.currentUser.groupId !== groupId)
        return res.status(403).json({ error: "Access denied" });
      const { bankName, branch, accountNumber, ifscCode, sanctionDate, repaymentStartDate, amount, annualInterestRate, durationMonths, remarks, isExisting, isCompleted } = req.body;
      if (!bankName || !amount || !annualInterestRate || !durationMonths || !sanctionDate) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      if (isExisting) {
        const gs = await storage.getGroupSettings(groupId);
        const expiry = gs?.migrationWindowExpiry;
        if (!expiry || /* @__PURE__ */ new Date() > new Date(expiry)) {
          return res.status(403).json({ error: "migrationWindowExpired" });
        }
      }
      const loanStatus = isExisting && isCompleted ? "completed" : "active";
      const loan = await storage.createGroupBankLoan({
        groupId,
        bankName,
        branch: branch || null,
        accountNumber: accountNumber || null,
        ifscCode: ifscCode || null,
        sanctionDate: new Date(sanctionDate),
        repaymentStartDate: repaymentStartDate ? new Date(repaymentStartDate) : null,
        amount: Number(amount),
        annualInterestRate: Number(annualInterestRate),
        durationMonths: Number(durationMonths),
        remarks: remarks || null,
        status: loanStatus,
        createdBy: req.currentUser.id
      });
      return res.status(201).json(loan);
    }
  );
  app2.patch(
    "/api/bank-loans/:id",
    requireAuth,
    requirePresidentOrTreasurer,
    async (req, res) => {
      const { id } = req.params;
      const bankLoan = await storage.getGroupBankLoanById(id);
      if (!bankLoan || bankLoan.groupId !== req.currentUser.groupId)
        return res.status(403).json({ error: "Access denied" });
      const updates = { ...req.body };
      if (updates.sanctionDate) updates.sanctionDate = new Date(updates.sanctionDate);
      if (updates.repaymentStartDate) updates.repaymentStartDate = new Date(updates.repaymentStartDate);
      const loan = await storage.updateGroupBankLoan(id, updates);
      return res.json(loan);
    }
  );
  app2.delete(
    "/api/bank-loans/:id",
    requireAuth,
    requirePresidentOrTreasurer,
    async (req, res) => {
      const { id } = req.params;
      const bankLoan = await storage.getGroupBankLoanById(id);
      if (!bankLoan || bankLoan.groupId !== req.currentUser.groupId)
        return res.status(403).json({ error: "Access denied" });
      await storage.deleteGroupBankLoan(id);
      return res.json({ ok: true });
    }
  );
  app2.patch(
    "/api/bank-loans/:id/close",
    requireAuth,
    requirePresident,
    async (req, res) => {
      const { id } = req.params;
      const bankLoan = await storage.getGroupBankLoanById(id);
      if (!bankLoan || bankLoan.groupId !== req.currentUser.groupId)
        return res.status(403).json({ error: "Access denied" });
      const allocations = await storage.getBankLoanAllocationsByLoanId(id);
      const hasOutstanding = allocations.some((a) => a.outstandingBalance > 0 || a.outstandingInterest > 0);
      if (hasOutstanding) {
        return res.status(400).json({ error: "Cannot close loan: some allocations still have outstanding balances." });
      }
      const loan = await storage.updateGroupBankLoan(id, { status: "completed" });
      return res.json(loan);
    }
  );
  app2.get(
    "/api/bank-loans/:id/allocations",
    requireAuth,
    async (req, res) => {
      const { id } = req.params;
      const bankLoan = await storage.getGroupBankLoanById(id);
      if (!bankLoan || bankLoan.groupId !== req.currentUser.groupId)
        return res.status(403).json({ error: "Access denied" });
      let allocations = await storage.getBankLoanAllocationsByLoanId(id);
      if (req.currentUser.role !== "president" && req.currentUser.role !== "treasurer") {
        allocations = allocations.filter((a) => a.memberId === req.currentUser.id);
      }
      return res.json(allocations);
    }
  );
  app2.post(
    "/api/bank-loans/:id/allocations",
    requireAuth,
    requirePresident,
    async (req, res) => {
      const { id } = req.params;
      const { allocations } = req.body;
      const bankLoan = await storage.getGroupBankLoanById(id);
      if (!bankLoan || bankLoan.groupId !== req.currentUser.groupId)
        return res.status(403).json({ error: "Access denied" });
      if (!Array.isArray(allocations) || allocations.length === 0)
        return res.status(400).json({ error: "Allocations array required" });
      const newTotal = allocations.reduce((sum, a) => sum + Number(a.allocatedPrincipal), 0);
      if (newTotal !== bankLoan.amount) {
        return res.status(400).json({ error: `Total allocations (${newTotal}) must exactly equal sanctioned amount (${bankLoan.amount})` });
      }
      const year = (/* @__PURE__ */ new Date()).getFullYear();
      const allocsToInsert = [];
      const ledgersToInsert = [];
      for (const a of allocations) {
        const alloc = {
          bankLoanId: id,
          memberId: a.memberId,
          allocatedPrincipal: Number(a.allocatedPrincipal),
          outstandingBalance: Number(a.allocatedPrincipal)
        };
        const disbReceiptSeq = await storage.getNextBankLoanReceiptSequence(year);
        const disbReceiptNo = `BLR-${year}-${String(disbReceiptSeq).padStart(6, "0")}`;
        const ledger = {
          receiptNo: disbReceiptNo,
          type: "disbursement",
          date: bankLoan.sanctionDate ? new Date(bankLoan.sanctionDate) : now(req),
          openingPrincipal: 0,
          interestRateApplied: bankLoan.annualInterestRate,
          interestCharged: 0,
          interestPaid: 0,
          principalPaid: 0,
          paymentReceived: 0,
          closingPrincipal: Number(a.allocatedPrincipal),
          outstandingInterest: 0,
          remarks: `Initial Disbursement \u2014 ${bankLoan.bankName}`,
          recordedBy: req.currentUser.id
        };
        allocsToInsert.push(alloc);
        ledgersToInsert.push(ledger);
      }
      await storage.allocateBankLoanFunds(allocsToInsert, ledgersToInsert);
      const allAllocations = await storage.getBankLoanAllocationsByLoanId(id);
      return res.status(201).json(allAllocations);
    }
  );
  app2.get(
    "/api/groups/:groupId/bank-loan-allocations",
    requireAuth,
    async (req, res) => {
      const { groupId } = req.params;
      if (req.currentUser.groupId !== groupId)
        return res.status(403).json({ error: "Access denied" });
      let allocations = await storage.getBankLoanAllocationsByGroupId(groupId);
      if (req.currentUser.role !== "president" && req.currentUser.role !== "treasurer") {
        allocations = allocations.filter((a) => a.memberId === req.currentUser.id);
      }
      return res.json(allocations);
    }
  );
  app2.get(
    "/api/bank-loan-allocations/:allocationId/ledger",
    requireAuth,
    async (req, res) => {
      const { allocationId } = req.params;
      const allocation = await storage.getBankLoanAllocationById(allocationId);
      if (!allocation) return res.status(404).json({ error: "Allocation not found" });
      const bankLoan = await storage.getGroupBankLoanById(allocation.bankLoanId);
      if (!bankLoan || bankLoan.groupId !== req.currentUser.groupId)
        return res.status(403).json({ error: "Access denied" });
      if (req.currentUser.role !== "president" && req.currentUser.role !== "treasurer" && allocation.memberId !== req.currentUser.id)
        return res.status(403).json({ error: "You are not authorized to view this allocation." });
      const ledger = await storage.getBankLoanLedger(allocationId);
      return res.json(ledger);
    }
  );
  app2.get(
    "/api/bank-loan-allocations/:allocationId/repayments",
    requireAuth,
    async (req, res) => {
      const { allocationId } = req.params;
      const allocation = await storage.getBankLoanAllocationById(allocationId);
      if (!allocation) return res.status(404).json({ error: "Allocation not found" });
      const bankLoan = await storage.getGroupBankLoanById(allocation.bankLoanId);
      if (!bankLoan || bankLoan.groupId !== req.currentUser.groupId)
        return res.status(403).json({ error: "Access denied" });
      if (req.currentUser.role !== "president" && req.currentUser.role !== "treasurer" && allocation.memberId !== req.currentUser.id)
        return res.status(403).json({ error: "You are not authorized to view this allocation." });
      const repayments = await storage.getBankLoanRepaymentsByAllocationId(allocationId);
      return res.json(repayments);
    }
  );
  app2.post(
    "/api/bank-loan-allocations/:allocationId/repayments",
    requireAuth,
    requirePresidentOrTreasurer,
    async (req, res) => {
      const { allocationId } = req.params;
      const { amount, date, remarks } = req.body;
      const allocation = await storage.getBankLoanAllocationById(allocationId);
      if (!allocation) return res.status(404).json({ error: "Allocation not found" });
      const bankLoan = await storage.getGroupBankLoanById(allocation.bankLoanId);
      if (!bankLoan || bankLoan.groupId !== req.currentUser.groupId)
        return res.status(403).json({ error: "Access denied" });
      const paymentAmt = Number(amount);
      if (!paymentAmt || paymentAmt <= 0) return res.status(400).json({ error: "Valid amount required" });
      const repaymentDate = date ? new Date(date) : now(req);
      if (Number.isNaN(repaymentDate.getTime())) {
        return res.status(400).json({ error: "Valid repayment date required" });
      }
      const year = repaymentDate.getFullYear();
      const seq = await storage.getNextBankLoanReceiptSequence(year);
      const receiptNo = generateBankLoanReceiptNo(year, seq);
      const ledgerResult = applyBankLoanRepayment(
        allocation.outstandingBalance,
        allocation.outstandingInterest,
        bankLoan.annualInterestRate,
        paymentAmt
      );
      const newOutstandingBalance = ledgerResult.closingPrincipal;
      const newOutstandingInterest = ledgerResult.outstandingInterest;
      const newTotalPrincipalPaid = allocation.totalPrincipalPaid + ledgerResult.principalPaid;
      const newTotalInterestPaid = allocation.totalInterestPaid + ledgerResult.interestPaid;
      const isCompleted = newOutstandingBalance <= 0 && newOutstandingInterest <= 0;
      const repayment = await storage.recordBankLoanRepayment(
        {
          allocationId,
          receiptNo,
          amount: paymentAmt,
          date: repaymentDate,
          recordedBy: req.currentUser.id,
          remarks: remarks || null
        },
        {
          allocationId,
          receiptNo,
          type: "repayment",
          date: repaymentDate,
          openingPrincipal: ledgerResult.openingPrincipal,
          interestRateApplied: bankLoan.annualInterestRate,
          interestCharged: ledgerResult.interestCharged,
          interestPaid: ledgerResult.interestPaid,
          principalPaid: ledgerResult.principalPaid,
          paymentReceived: paymentAmt,
          closingPrincipal: ledgerResult.closingPrincipal,
          outstandingInterest: ledgerResult.outstandingInterest,
          remarks: remarks || null,
          recordedBy: req.currentUser.id
        },
        {
          outstandingBalance: newOutstandingBalance,
          outstandingInterest: newOutstandingInterest,
          totalPrincipalPaid: newTotalPrincipalPaid,
          totalInterestPaid: newTotalInterestPaid,
          status: isCompleted ? "completed" : "active"
        }
      );
      if (isCompleted) {
        const allAllocations = await storage.getBankLoanAllocationsByLoanId(bankLoan.id);
        const allDone = allAllocations.every((a) => a.id === allocationId ? isCompleted : a.outstandingBalance <= 0 && a.outstandingInterest <= 0);
        if (allDone) {
          await storage.updateGroupBankLoan(bankLoan.id, { status: "completed" });
        }
      }
      const updatedAllocation = await storage.getBankLoanAllocationById(allocationId);
      return res.status(201).json({ repayment, allocation: updatedAllocation, receiptNo });
    }
  );
  app2.get(
    "/api/bank-loans/:id/summary",
    requireAuth,
    async (req, res) => {
      const { id } = req.params;
      const bankLoan = await storage.getGroupBankLoanById(id);
      if (!bankLoan || bankLoan.groupId !== req.currentUser.groupId)
        return res.status(403).json({ error: "Access denied" });
      if (req.currentUser.role !== "president" && req.currentUser.role !== "treasurer")
        return res.status(403).json({ error: "President or Treasurer access required" });
      const allocations = await storage.getBankLoanAllocationsByLoanId(id);
      const totalAllocated = allocations.reduce((s, a) => s + a.allocatedPrincipal, 0);
      const totalPrincipalCollected = allocations.reduce((s, a) => s + a.totalPrincipalPaid, 0);
      const totalInterestCollected = allocations.reduce((s, a) => s + a.totalInterestPaid, 0);
      const totalOutstandingPrincipal = allocations.reduce((s, a) => s + a.outstandingBalance, 0);
      const totalOutstandingInterest = allocations.reduce((s, a) => s + a.outstandingInterest, 0);
      const membersCompleted = allocations.filter((a) => a.status === "completed").length;
      return res.json({
        bankLoan,
        allocations,
        summary: {
          sanctionedAmount: bankLoan.amount,
          totalAllocated,
          remainingUnallocated: bankLoan.amount - totalAllocated,
          totalPrincipalCollected,
          totalInterestCollected,
          totalOutstandingPrincipal,
          totalOutstandingInterest,
          membersAllocated: allocations.length,
          membersCompleted
        }
      });
    }
  );
  app2.get(
    "/api/groups/:groupId/bank-loan-ledger",
    requireAuth,
    async (req, res) => {
      const { groupId } = req.params;
      if (req.currentUser.groupId !== groupId)
        return res.status(403).json({ error: "Access denied" });
      if (req.currentUser.role !== "president" && req.currentUser.role !== "treasurer")
        return res.status(403).json({ error: "President or Treasurer access required" });
      const ledgers = await storage.getGroupBankLoanLedgerByGroupId(groupId);
      return res.json(ledgers);
    }
  );
  const httpServer = createServer(app2);
  return httpServer;
}

// server/index.ts
import * as fs from "fs";
import * as path from "path";
var app = express();
var log = console.log;
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origins = /* @__PURE__ */ new Set();
    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }
    const origin = req.header("origin");
    const isLocalhost = origin?.startsWith("http://localhost:") || origin?.startsWith("http://127.0.0.1:");
    if (origin && (origins.has(origin) || isLocalhost)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.header("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(express.urlencoded({ extended: false }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path2 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path2.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function setupFrontendServing(app2) {
  const webBuildPath = path.resolve(process.cwd(), "web-build");
  const indexHtmlPath = path.join(webBuildPath, "index.html");
  if (fs.existsSync(indexHtmlPath)) {
    log("Serving static web build from web-build/");
    app2.use(express.static(webBuildPath));
    app2.use((req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      res.sendFile(indexHtmlPath);
    });
  } else {
    const EXPO_WEB_PORT = process.env.EXPO_WEB_PORT || "8081";
    const target = `http://localhost:${EXPO_WEB_PORT}`;
    log(`No static build found. Proxying frontend to Expo dev server at ${target}`);
    log("Run 'npm run build:web' to generate a static build.");
    const proxy = createProxyMiddleware({
      target,
      changeOrigin: true,
      ws: true,
      on: {
        error: (_err, _req, res) => {
          if (res && "writeHead" in res) {
            res.writeHead(502, { "Content-Type": "text/plain" });
            res.end(
              "Frontend dev server not ready yet. Please wait a moment and refresh."
            );
          }
        }
      }
    });
    app2.use((req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      return proxy(req, res, next);
    });
  }
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(status).json({ message });
  });
}
(async () => {
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);
  const server = await registerRoutes(app);
  setupFrontendServing(app);
  setupErrorHandler(app);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "127.0.0.1"
    },
    () => {
      log(`Server running on port ${port}`);
      log(`API: http://localhost:${port}/api`);
      log(`App: http://localhost:${port}`);
      Promise.resolve().then(() => (init_cron(), cron_exports)).then((cron) => {
        cron.startCronJobs();
      });
    }
  );
})();
