import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../db/schema";

export type Database = NodePgDatabase<typeof schema>;

export interface DatabaseClient {
	db: Database;
}
