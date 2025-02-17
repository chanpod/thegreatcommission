import { db } from "~/server/dbConnection";
import type { DatabaseClient } from "./types";

export class DefaultDatabaseClient implements DatabaseClient {
	get db() {
		return db;
	}
}
