import { text, timestamp, boolean, pgTable } from "drizzle-orm/pg-core";
import { v4 as uuidv4 } from "uuid";
import { users, churchOrganization } from "./schema";

// Table for storing children information
export const childrenTable = pgTable("children", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => uuidv4()),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	dateOfBirth: timestamp("date_of_birth"),
	allergies: text("allergies"),
	specialNotes: text("special_notes"),
	photoUrl: text("photo_url"),
	churchOrganizationId: text("church_organization_id")
		.notNull()
		.references(() => churchOrganization.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

// Table for storing parent/guardian information
export const guardiansTable = pgTable("guardians", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => uuidv4()),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	phone: text("phone"),
	email: text("email"),
	photoUrl: text("photo_url"),
	userId: text("user_id").references(() => users.id), // Optional link to user account
	churchOrganizationId: text("church_organization_id")
		.notNull()
		.references(() => churchOrganization.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

// Table for linking children to guardians
export const childrenToGuardiansTable = pgTable("children_to_guardians", {
	childId: text("child_id")
		.notNull()
		.references(() => childrenTable.id, { onDelete: "cascade" }),
	guardianId: text("guardian_id")
		.notNull()
		.references(() => guardiansTable.id, { onDelete: "cascade" }),
	relationship: text("relationship").notNull(), // parent, grandparent, aunt, uncle, etc.
	isPrimaryGuardian: boolean("is_primary_guardian").default(false),
	canPickup: boolean("can_pickup").default(true),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

// Table for storing checkin sessions
export const checkinSessionsTable = pgTable("checkin_sessions", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => uuidv4()),
	eventId: text("event_id"), // Optional link to an event
	name: text("name").notNull(), // Name of the session (e.g., "Sunday School - June 2, 2024")
	churchOrganizationId: text("church_organization_id")
		.notNull()
		.references(() => churchOrganization.id),
	startTime: timestamp("start_time").notNull(),
	endTime: timestamp("end_time"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

// Table for storing child checkins
export const childCheckinsTable = pgTable("child_checkins", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => uuidv4()),
	childId: text("child_id")
		.notNull()
		.references(() => childrenTable.id),
	sessionId: text("session_id")
		.notNull()
		.references(() => checkinSessionsTable.id),
	checkinTime: timestamp("checkin_time").defaultNow().notNull(),
	checkoutTime: timestamp("checkout_time"),
	checkedInByGuardianId: text("checked_in_by_guardian_id")
		.notNull()
		.references(() => guardiansTable.id),
	checkedOutByGuardianId: text("checked_out_by_guardian_id").references(
		() => guardiansTable.id,
	),
	checkinNotes: text("checkin_notes"),
	secureId: text("secure_id")
		.notNull()
		.$defaultFn(() => uuidv4()), // Unique ID for QR code generation
	status: text("status").default("checked-in").notNull(), // checked-in, checked-out, no-show
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

// Table for storing authorized pickup persons
export const authorizedPickupPersonsTable = pgTable(
	"authorized_pickup_persons",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => uuidv4()),
		childCheckinId: text("child_checkin_id")
			.notNull()
			.references(() => childCheckinsTable.id, { onDelete: "cascade" }),
		firstName: text("first_name").notNull(),
		lastName: text("last_name").notNull(),
		relationship: text("relationship").notNull(),
		photoUrl: text("photo_url"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").notNull(),
	},
);

export type Child = typeof childrenTable.$inferSelect;
export type NewChild = typeof childrenTable.$inferInsert;

export type Guardian = typeof guardiansTable.$inferSelect;
export type NewGuardian = typeof guardiansTable.$inferInsert;

export type ChildToGuardian = typeof childrenToGuardiansTable.$inferSelect;
export type NewChildToGuardian = typeof childrenToGuardiansTable.$inferInsert;

export type CheckinSession = typeof checkinSessionsTable.$inferSelect;
export type NewCheckinSession = typeof checkinSessionsTable.$inferInsert;

export type ChildCheckin = typeof childCheckinsTable.$inferSelect;
export type NewChildCheckin = typeof childCheckinsTable.$inferInsert;

export type AuthorizedPickupPerson =
	typeof authorizedPickupPersonsTable.$inferSelect;
export type NewAuthorizedPickupPerson =
	typeof authorizedPickupPersonsTable.$inferInsert;
