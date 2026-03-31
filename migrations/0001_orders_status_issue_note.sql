-- Add status column with default 'Ordered'
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'Ordered' NOT NULL;
--> statement-breakpoint
-- Add optional issue_note for customer complaints
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "issue_note" text;
