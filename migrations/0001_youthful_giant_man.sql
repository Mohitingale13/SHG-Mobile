CREATE TABLE "affiliated_banks" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" varchar(36) NOT NULL,
	"name" text NOT NULL,
	"branch" text,
	"ifsc_code" varchar(20),
	"contact_person" text,
	"contact_number" varchar(20),
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(36) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cron_locks" ALTER COLUMN "locked_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "cron_locks" ALTER COLUMN "locked_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "loan_repayments" ALTER COLUMN "date" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "loan_repayments" ALTER COLUMN "date" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "treasurer_action_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "approved_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "meetings" ALTER COLUMN "scheduled_date" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "meetings" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "meetings" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "due_date" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "date" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "date" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "verified_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "join_date" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "exit_date" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "village" text;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "taluka" text;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "district" text;--> statement-breakpoint
ALTER TABLE "loan_repayments" ADD COLUMN "shg_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "loan_repayments" ADD COLUMN "bank_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "loan_repayments" ADD COLUMN "remarks" text;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "rejected_by" varchar(36);--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "rejected_at" timestamp;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "president_override" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "override_reason" text;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "override_at" timestamp;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "has_bank_loan" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "bank_id" varchar(36);--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "bank_name" text;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "bank_loan_amount" integer;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "bank_interest_rate" real;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "bank_duration" integer;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "bank_remaining_balance" integer;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "bank_loan_start_date" timestamp;--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "bank_loan_remarks" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "rejected_by" varchar(36);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "rejected_at" timestamp;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "overridden_by" varchar(36);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "override_reason" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "override_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "contribution_start_month" varchar(7);--> statement-breakpoint
CREATE INDEX "bank_group_idx" ON "affiliated_banks" USING btree ("group_id");