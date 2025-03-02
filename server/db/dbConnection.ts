import { drizzle } from "drizzle-orm/node-postgres";
import pgpkg from "pg";
import * as schema from "./schema";
import * as childCheckinSchema from "../../app/schema/childCheckin";
const { Pool } = pgpkg;
// Create a PostgreSQL connection pool
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});

// Create a Drizzle instance with the schema
export const db = drizzle(pool, {
	schema: { ...schema, ...childCheckinSchema },
});
