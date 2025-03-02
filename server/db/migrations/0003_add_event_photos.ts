import { sql } from "drizzle-orm";
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export async function up(db: any) {
	await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "event_photos" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "event_id" uuid REFERENCES "events"("id") ON DELETE CASCADE,
      "photo_url" text NOT NULL,
      "caption" text,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );
  `);
}

export async function down(db: any) {
	await db.execute(sql`DROP TABLE IF EXISTS "event_photos";`);
}
