-- Add message_usage_reports table
CREATE TABLE IF NOT EXISTS "message_usage_reports" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "church_organization_id" TEXT NOT NULL REFERENCES "church_organizations"("id"),
  "start_date" TIMESTAMP NOT NULL,
  "end_date" TIMESTAMP NOT NULL,
  "period" TEXT NOT NULL,
  "email_count" INTEGER DEFAULT 0,
  "sms_count" INTEGER DEFAULT 0,
  "phone_count" INTEGER DEFAULT 0,
  "total_cost" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create index for faster querying
CREATE INDEX IF NOT EXISTS "message_usage_reports_church_organization_id_idx" 
ON "message_usage_reports"("church_organization_id"); 