import { sql } from "drizzle-orm";

export async function up(db: any) {
	await db.execute(sql`
    ALTER TABLE "church_organizations"
    ADD COLUMN IF NOT EXISTS "custom_domain" text UNIQUE;
  `);
}

export async function down(db: any) {
	await db.execute(sql`
    ALTER TABLE "church_organizations"
    DROP COLUMN IF EXISTS "custom_domain";
  `);
}
