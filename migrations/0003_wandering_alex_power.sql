CREATE TABLE "audit_logs" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"action" varchar(100) NOT NULL,
	"entity" varchar(50),
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "draft_bank_loans" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"migration_month_id" varchar(36) NOT NULL,
	"group_id" varchar(36) NOT NULL,
	"bank_name" text NOT NULL,
	"amount" integer NOT NULL,
	"annual_interest_rate" real NOT NULL,
	"duration_months" integer NOT NULL,
	"sanction_date" timestamp NOT NULL,
	"status" varchar(30) DEFAULT 'draft' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "draft_loan_repayments" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"migration_month_id" varchar(36) NOT NULL,
	"loan_id" varchar(36) NOT NULL,
	"amount" integer NOT NULL,
	"shg_amount" integer DEFAULT 0 NOT NULL,
	"bank_amount" integer DEFAULT 0 NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"status" varchar(30) DEFAULT 'draft' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "draft_loans" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"migration_month_id" varchar(36) NOT NULL,
	"group_id" varchar(36) NOT NULL,
	"member_id" varchar(36) NOT NULL,
	"member_name" text NOT NULL,
	"amount" integer NOT NULL,
	"interest" real NOT NULL,
	"duration" integer NOT NULL,
	"status" varchar(30) DEFAULT 'draft' NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "draft_meetings" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"migration_month_id" varchar(36) NOT NULL,
	"group_id" varchar(36) NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"attendance" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" varchar(30) DEFAULT 'draft' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "draft_payments" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"migration_month_id" varchar(36) NOT NULL,
	"group_id" varchar(36) NOT NULL,
	"member_id" varchar(36) NOT NULL,
	"member_name" text NOT NULL,
	"amount" integer NOT NULL,
	"late_fee" integer DEFAULT 0 NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"mode" varchar(20) DEFAULT 'cash' NOT NULL,
	"status" varchar(30) DEFAULT 'draft' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "migration_months" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" varchar(36) NOT NULL,
	"month_year" varchar(7) NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"locked_at" timestamp,
	"locked_by" varchar(36),
	"verified_at" timestamp,
	"verified_by" varchar(36),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bank_loan_ledger" ADD COLUMN "type" varchar(20) DEFAULT 'repayment' NOT NULL;--> statement-breakpoint
ALTER TABLE "group_bank_loans" ADD COLUMN "ifsc_code" varchar(20);--> statement-breakpoint
ALTER TABLE "group_bank_loans" ADD COLUMN "created_by" varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE "loan_ledger" ADD COLUMN "type" varchar(20) DEFAULT 'repayment' NOT NULL;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "fixed_principal_installment" integer;--> statement-breakpoint
CREATE INDEX "migration_month_group_idx" ON "migration_months" USING btree ("group_id","month_year");