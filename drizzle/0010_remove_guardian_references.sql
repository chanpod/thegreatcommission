-- Remove guardianId column from message_tracker table
ALTER TABLE "message_tracker" DROP COLUMN IF EXISTS "guardian_id"; 