-- Create tables for child check-in system
CREATE TABLE IF NOT EXISTS "children" (
    "id" text PRIMARY KEY,
    "first_name" text NOT NULL,
    "last_name" text NOT NULL,
    "date_of_birth" timestamp,
    "allergies" text,
    "special_notes" text,
    "photo_url" text,
    "church_organization_id" text NOT NULL REFERENCES "church_organization"("id"),
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "guardians" (
    "id" text PRIMARY KEY,
    "first_name" text NOT NULL,
    "last_name" text NOT NULL,
    "phone" text,
    "email" text,
    "photo_url" text,
    "user_id" text REFERENCES "users"("id"),
    "church_organization_id" text NOT NULL REFERENCES "church_organization"("id"),
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "children_to_guardians" (
    "child_id" text NOT NULL REFERENCES "children"("id") ON DELETE CASCADE,
    "guardian_id" text NOT NULL REFERENCES "guardians"("id") ON DELETE CASCADE,
    "relationship" text NOT NULL,
    "is_primary_guardian" boolean DEFAULT false,
    "can_pickup" boolean DEFAULT true,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "checkin_sessions" (
    "id" text PRIMARY KEY,
    "event_id" text,
    "name" text NOT NULL,
    "church_organization_id" text NOT NULL REFERENCES "church_organization"("id"),
    "start_time" timestamp NOT NULL,
    "end_time" timestamp,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "child_checkins" (
    "id" text PRIMARY KEY,
    "child_id" text NOT NULL REFERENCES "children"("id"),
    "session_id" text NOT NULL REFERENCES "checkin_sessions"("id"),
    "checkin_time" timestamp DEFAULT now() NOT NULL,
    "checkout_time" timestamp,
    "checked_in_by_guardian_id" text NOT NULL REFERENCES "guardians"("id"),
    "checked_out_by_guardian_id" text REFERENCES "guardians"("id"),
    "checkin_notes" text,
    "secure_id" text NOT NULL,
    "status" text DEFAULT 'checked-in' NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "authorized_pickup_persons" (
    "id" text PRIMARY KEY,
    "child_checkin_id" text NOT NULL REFERENCES "child_checkins"("id") ON DELETE CASCADE,
    "first_name" text NOT NULL,
    "last_name" text NOT NULL,
    "relationship" text NOT NULL,
    "photo_url" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp NOT NULL
); 