-- Add guardianId column to message_tracker table
ALTER TABLE "message_tracker" 
ADD COLUMN "guardian_id" text REFERENCES "guardians"("id"); 