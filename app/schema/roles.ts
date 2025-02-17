import { text, timestamp, boolean, pgTable } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const rolesTable = pgTable("roles", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	name: text("name").notNull(),
	description: text("description"),
	permissions: text("permissions").array(),
	isDefault: boolean("is_default").default(false),
	isActive: boolean("is_active").default(true),
	churchOrganizationId: text("church_organization_id").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export type Role = typeof rolesTable.$inferSelect;
export type NewRole = typeof rolesTable.$inferInsert;
