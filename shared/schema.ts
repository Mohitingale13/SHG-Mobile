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
  boolean,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  password: text("password").notNull(),
  village: text("village").notNull(),
  joinDate: timestamp("join_date").notNull(),
  exitDate: timestamp("exit_date"),
  role: varchar("role", { length: 20 }).notNull().default("member"),
  preferredLanguage: varchar("preferred_language", { length: 10 }),
  groupId: varchar("group_id", { length: 36 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  contributionStartMonth: varchar("contribution_start_month", { length: 7 }),
});

export const groups = pgTable("groups", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
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
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const invitationCodes = pgTable("invitation_codes", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 10 }).notNull().unique(),
  groupId: varchar("group_id", { length: 36 }).notNull(),
  active: boolean("active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  maxUses: integer("max_uses").notNull().default(1),
  currentUses: integer("current_uses").notNull().default(0),
  createdBy: varchar("created_by", { length: 36 }).notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const invitationCodeUsage = pgTable("invitation_code_usage", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  invitationCodeId: varchar("invitation_code_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  usedAt: timestamp("used_at").notNull().default(sql`now()`),
});

export const sessions = pgTable("sessions", {
  token: varchar("token", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const meetings = pgTable("meetings", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  groupId: varchar("group_id", { length: 36 }).notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  agenda: text("agenda").notNull().default(""),
  notes: text("notes").notNull().default(""),
  attendance: jsonb("attendance").notNull().default(sql`'[]'::jsonb`),
  status: varchar("status", { length: 20 }).notNull().default("scheduled"),
  createdBy: varchar("created_by", { length: 36 }).notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const payments = pgTable("payments", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
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
  overrideAt: timestamp("override_at"),
}, (t) => ({
  paymentGroupMemberMonthIdx: index("payment_group_member_month_idx").on(t.groupId, t.memberId, t.month),
}));

export const affiliatedBanks = pgTable("affiliated_banks", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  groupId: varchar("group_id", { length: 36 }).notNull(),
  name: text("name").notNull(),
  branch: text("branch"),
  ifscCode: varchar("ifsc_code", { length: 20 }),
  contactPerson: text("contact_person"),
  contactNumber: varchar("contact_number", { length: 20 }),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by", { length: 36 }).notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (t) => ({
  bankGroupIdx: index("bank_group_idx").on(t.groupId),
}));

export const loans = pgTable("loans", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
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
}, (t) => ({
  loanMemberIdx: index("loan_member_idx").on(t.memberId),
}));

export const loanRepayments = pgTable("loan_repayments", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  loanId: varchar("loan_id", { length: 36 }).notNull(),
  amount: integer("amount").notNull(),
  shgAmount: integer("shg_amount").notNull().default(0),
  bankAmount: integer("bank_amount").notNull().default(0),
  date: timestamp("date").notNull().default(sql`now()`),
  recordedBy: varchar("recorded_by", { length: 36 }).notNull(),
  remarks: text("remarks"),
});

export const groupSettings = pgTable("group_settings", {
  groupId: varchar("group_id", { length: 36 }).primaryKey(),
  settings: jsonb("settings").notNull(),
});

export const groupRules = pgTable("group_rules", {
  groupId: varchar("group_id", { length: 36 }).primaryKey(),
  rules: text("rules").notNull().default(""),
});

export const cronLocks = pgTable("cron_locks", {
  jobName: varchar("job_name", { length: 50 }).primaryKey(),
  lockedAt: timestamp("locked_at").notNull().default(sql`now()`),
});

export type InvitationCode = typeof invitationCodes.$inferSelect;
export type InvitationCodeUsage = typeof invitationCodeUsage.$inferSelect;
export type AffiliatedBank = typeof affiliatedBanks.$inferSelect;

export const loanLedger = pgTable("loan_ledger", {
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
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (t) => ({
  ledgerLoanIdx: index("ledger_loan_idx").on(t.loanId),
}));

export const groupBankLoans = pgTable("group_bank_loans", {
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
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const bankLoanAllocations = pgTable("bank_loan_allocations", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  bankLoanId: varchar("bank_loan_id", { length: 36 }).notNull(),
  memberId: varchar("member_id", { length: 36 }).notNull(),
  allocatedPrincipal: integer("allocated_principal").notNull(),
  totalPrincipalPaid: integer("total_principal_paid").notNull().default(0),
  totalInterestPaid: integer("total_interest_paid").notNull().default(0),
  outstandingBalance: integer("outstanding_balance").notNull(),
  outstandingInterest: integer("outstanding_interest").notNull().default(0),
  status: varchar("status", { length: 30 }).notNull().default("active"),
}, (t) => ({
  allocationBankIdx: index("allocation_bank_idx").on(t.bankLoanId),
  allocationMemberIdx: index("allocation_member_idx").on(t.memberId),
}));

export const bankLoanRepayments = pgTable("bank_loan_repayments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  allocationId: varchar("allocation_id", { length: 36 }).notNull(),
  receiptNo: varchar("receipt_no", { length: 50 }).notNull(),
  amount: integer("amount").notNull(),
  date: timestamp("date").notNull().default(sql`now()`),
  recordedBy: varchar("recorded_by", { length: 36 }).notNull(),
  remarks: text("remarks"),
});

export const bankLoanLedger = pgTable("bank_loan_ledger", {
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
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (t) => ({
  bankLedgerAllocIdx: index("bank_ledger_alloc_idx").on(t.allocationId),
}));

export type GroupBankLoan = typeof groupBankLoans.$inferSelect;
export type BankLoanAllocation = typeof bankLoanAllocations.$inferSelect;
export type BankLoanRepayment = typeof bankLoanRepayments.$inferSelect;
export type BankLoanLedgerEntry = typeof bankLoanLedger.$inferSelect;
export type LoanLedgerEntry = typeof loanLedger.$inferSelect;

export const migrationMonths = pgTable("migration_months", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id", { length: 36 }).notNull(),
  monthYear: varchar("month_year", { length: 7 }).notNull(), // e.g. "2024-01"
  status: varchar("status", { length: 20 }).notNull().default("open"), // open, verified, locked
  lockedAt: timestamp("locked_at"),
  lockedBy: varchar("locked_by", { length: 36 }),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: varchar("verified_by", { length: 36 }),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (t) => ({
  migrationMonthGroupIdx: index("migration_month_group_idx").on(t.groupId, t.monthYear),
}));

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(), // e.g. "UNLOCK_MONTH"
  entity: varchar("entity", { length: 50 }),
  details: text("details"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const draftPayments = pgTable("draft_payments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  migrationMonthId: varchar("migration_month_id", { length: 36 }).notNull(),
  groupId: varchar("group_id", { length: 36 }).notNull(),
  memberId: varchar("member_id", { length: 36 }).notNull(),
  memberName: text("member_name").notNull(),
  amount: integer("amount").notNull(),
  lateFee: integer("late_fee").notNull().default(0),
  date: timestamp("date").notNull().default(sql`now()`),
  mode: varchar("mode", { length: 20 }).notNull().default("cash"),
  status: varchar("status", { length: 30 }).notNull().default("draft"),
});

export const draftLoans = pgTable("draft_loans", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  migrationMonthId: varchar("migration_month_id", { length: 36 }).notNull(),
  groupId: varchar("group_id", { length: 36 }).notNull(),
  memberId: varchar("member_id", { length: 36 }).notNull(),
  memberName: text("member_name").notNull(),
  amount: integer("amount").notNull(),
  interest: real("interest").notNull(),
  duration: integer("duration").notNull(),
  status: varchar("status", { length: 30 }).notNull().default("draft"),
  date: timestamp("date").notNull().default(sql`now()`),
});

export const draftLoanRepayments = pgTable("draft_loan_repayments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  migrationMonthId: varchar("migration_month_id", { length: 36 }).notNull(),
  loanId: varchar("loan_id", { length: 36 }).notNull(),
  amount: integer("amount").notNull(),
  shgAmount: integer("shg_amount").notNull().default(0),
  bankAmount: integer("bank_amount").notNull().default(0),
  date: timestamp("date").notNull().default(sql`now()`),
  status: varchar("status", { length: 30 }).notNull().default("draft"),
});

export const draftBankLoans = pgTable("draft_bank_loans", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  migrationMonthId: varchar("migration_month_id", { length: 36 }).notNull(),
  groupId: varchar("group_id", { length: 36 }).notNull(),
  bankName: text("bank_name").notNull(),
  amount: integer("amount").notNull(),
  annualInterestRate: real("annual_interest_rate").notNull(),
  durationMonths: integer("duration_months").notNull(),
  sanctionDate: timestamp("sanction_date").notNull(),
  status: varchar("status", { length: 30 }).notNull().default("draft"),
});

export const draftMeetings = pgTable("draft_meetings", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  migrationMonthId: varchar("migration_month_id", { length: 36 }).notNull(),
  groupId: varchar("group_id", { length: 36 }).notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  attendance: jsonb("attendance").notNull().default(sql`'[]'::jsonb`),
  status: varchar("status", { length: 30 }).notNull().default("draft"),
});

export type MigrationMonth = typeof migrationMonths.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type DraftPayment = typeof draftPayments.$inferSelect;
export type DraftLoan = typeof draftLoans.$inferSelect;
export type DraftLoanRepayment = typeof draftLoanRepayments.$inferSelect;
export type DraftBankLoan = typeof draftBankLoans.$inferSelect;
export type DraftMeeting = typeof draftMeetings.$inferSelect;



// ============================================================================
// MIGRATION WIZARD WORKSPACE
// ============================================================================

export const migrationWizardWorkspaces = pgTable("migration_wizard_workspaces", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id", { length: 36 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("in_progress"),
  currentStep: integer("current_step").notNull().default(1),
  
  // Group Verification
  bankName: text("bank_name"),
  branchName: text("branch_name"),
  ifscCode: varchar("ifsc_code", { length: 20 }),
  accountNumber: varchar("account_number", { length: 50 }),
  formationDate: timestamp("formation_date"),
  
  // Opening Snapshot
  snapshotDate: timestamp("snapshot_date"),
  cashInHand: integer("cash_in_hand").notNull().default(0),
  bankBalance: integer("bank_balance").notNull().default(0),
  totalSavings: integer("total_savings").notNull().default(0),
  outstandingInternalPrincipal: integer("outstanding_internal_principal").notNull().default(0),
  outstandingInternalInterest: integer("outstanding_internal_interest").notNull().default(0),
  outstandingBankPrincipal: integer("outstanding_bank_principal").notNull().default(0),
  outstandingBankInterest: integer("outstanding_bank_interest").notNull().default(0),
  
  // Progress Flags
  groupVerificationCompleted: boolean("group_verification_completed").notNull().default(false),
  openingSnapshotCompleted: boolean("opening_snapshot_completed").notNull().default(false),
  membersCompleted: boolean("members_completed").notNull().default(false),
  internalLoansCompleted: boolean("internal_loans_completed").notNull().default(false),
  bankLoansCompleted: boolean("bank_loans_completed").notNull().default(false),
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (t) => ({
  wizardWorkspaceGroupIdx: index("wizard_workspace_group_idx").on(t.groupId),
}));

export const migrationWizardMembers = pgTable("migration_wizard_members", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id", { length: 36 }).notNull(),
  name: text("name").notNull(),
  mobile: varchar("mobile", { length: 20 }),
  role: varchar("role", { length: 30 }).notNull().default("member"),
  joinedAt: timestamp("joined_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const migrationWizardLoans = pgTable("migration_wizard_loans", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id", { length: 36 }).notNull(),
  draftMemberId: varchar("draft_member_id", { length: 36 }).notNull(),
  draftMemberName: text("draft_member_name").notNull(),
  amount: integer("amount").notNull(),
  outstandingPrincipal: integer("outstanding_principal").notNull(),
  outstandingInterest: integer("outstanding_interest").notNull(),
  interestRate: real("interest_rate").notNull(),
  durationMonths: integer("duration_months").notNull(),
  remainingMonths: integer("remaining_months").notNull(),
  startDate: timestamp("start_date").notNull(),
  resolutionNo: text("resolution_no").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const migrationWizardBankLoans = pgTable("migration_wizard_bank_loans", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id", { length: 36 }).notNull(),
  bankName: text("bank_name").notNull(),
  sanctionAmount: integer("sanction_amount").notNull(),
  outstandingPrincipal: integer("outstanding_principal").notNull(),
  interestRate: real("interest_rate").notNull(),
  durationMonths: integer("duration_months").notNull(),
  remainingMonths: integer("remaining_months").notNull(),
  startDate: timestamp("start_date").notNull(),
  sanctionNo: text("sanction_no").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const migrationCompletionRecords = pgTable("migration_completion_records", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id", { length: 36 }).notNull(),
  completedAt: timestamp("completed_at").notNull().default(sql`now()`),
  completedBy: varchar("completed_by", { length: 36 }).notNull(),
  migrationType: varchar("migration_type", { length: 50 }).notNull(), // 'snapshot_only' or 'full'
  openingSnapshotDate: timestamp("opening_snapshot_date").notNull(),
  membersImported: integer("members_imported").notNull(),
  internalLoansImported: integer("internal_loans_imported").notNull(),
  bankLoansImported: integer("bank_loans_imported").notNull(),
  historicalMonthsImported: integer("historical_months_imported").notNull().default(0),
  openingCashBalance: integer("opening_cash_balance").notNull(),
  openingBankBalance: integer("opening_bank_balance").notNull(),
  outstandingInternalBalance: integer("outstanding_internal_balance").notNull(),
  outstandingBankBalance: integer("outstanding_bank_balance").notNull(),
  verificationStatus: varchar("verification_status", { length: 50 }),
});

export type MigrationWizardWorkspace = typeof migrationWizardWorkspaces.$inferSelect;
export type MigrationWizardMember = typeof migrationWizardMembers.$inferSelect;
export type MigrationWizardLoan = typeof migrationWizardLoans.$inferSelect;
export type MigrationWizardBankLoan = typeof migrationWizardBankLoans.$inferSelect;
export type MigrationCompletionRecord = typeof migrationCompletionRecords.$inferSelect;
