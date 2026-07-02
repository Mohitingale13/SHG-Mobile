import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  real,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  password: text("password").notNull(),
  village: text("village").notNull(),
  joinDate: text("join_date").notNull(),
  exitDate: text("exit_date"),
  role: varchar("role", { length: 20 }).notNull().default("member"),
  groupId: varchar("group_id", { length: 36 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
});

export const groups = pgTable("groups", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  groupId: varchar("group_id", { length: 100 }).notNull().unique(),
  name: text("name").notNull(),
  presidentId: varchar("president_id", { length: 36 }).notNull(),
  treasurerId: varchar("treasurer_id", { length: 36 }),
  qrCode: text("qr_code"),
  createdAt: text("created_at").notNull(),
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
  scheduledDate: text("scheduled_date").notNull(),
  agenda: text("agenda").notNull().default(""),
  notes: text("notes").notNull().default(""),
  attendance: jsonb("attendance").notNull().default(sql`'[]'::jsonb`),
  status: varchar("status", { length: 20 }).notNull().default("scheduled"),
  createdBy: varchar("created_by", { length: 36 }).notNull(),
  createdAt: text("created_at").notNull(),
});

export const payments = pgTable("payments", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  groupId: varchar("group_id", { length: 36 }).notNull(),
  memberId: varchar("member_id", { length: 36 }).notNull(),
  memberName: text("member_name").notNull(),
  amount: integer("amount").notNull(),
  date: text("date").notNull(),
  mode: varchar("mode", { length: 20 }).notNull().default("cash"),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  verifiedBy: varchar("verified_by", { length: 36 }),
  verifiedAt: text("verified_at"),
});

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
  treasurerActionAt: text("treasurer_action_at"),
  approvedBy: varchar("approved_by", { length: 36 }),
  approvedAt: text("approved_at"),
  meetingId: varchar("meeting_id", { length: 36 }),
  createdAt: text("created_at").notNull(),
});

export const loanRepayments = pgTable("loan_repayments", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  loanId: varchar("loan_id", { length: 36 }).notNull(),
  amount: integer("amount").notNull(),
  date: text("date").notNull(),
  recordedBy: varchar("recorded_by", { length: 36 }).notNull(),
});

export const groupSettings = pgTable("group_settings", {
  groupId: varchar("group_id", { length: 36 }).primaryKey(),
  settings: jsonb("settings").notNull(),
});

export const groupRules = pgTable("group_rules", {
  groupId: varchar("group_id", { length: 36 }).primaryKey(),
  rules: text("rules").notNull().default(""),
});
