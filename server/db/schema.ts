import {
	pgTable,
	text,
	timestamp,
	boolean,
	integer,
	unique,
	serial,
	foreignKey,
	type AnyPgColumn,
	numeric,
} from "drizzle-orm/pg-core";
import { v4 as uuidv4 } from "uuid";

export const users = pgTable("users", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => uuidv4()),
	email: text("email").unique(),
	firstName: text("first_name"),
	lastName: text("last_name"),
	middleName: text("middle_name"),
	phone: text("phone"),
	address: text("address"),
	city: text("city"),
	state: text("state"),
	zip: text("zip"),
	country: text("country"),
	avatarUrl: text("avatar_url"),
	googleId: text("google_id").unique(),
});

export const roles = pgTable("roles", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => uuidv4()),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	name: text("name").notNull(),
	description: text("description"),
	permissions: text("permissions").array(), // Array of site-wide permission strings
	isActive: boolean("is_active").default(true).notNull(),
});

export const usersToRoles = pgTable("users_to_roles", {
	userId: text("user_id")
		.notNull()
		.references(() => users.id),
	roleId: text("role_id")
		.notNull()
		.references(() => roles.id),
});

export const missions = pgTable("missions", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => uuidv4()),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	title: text("title").notNull(),
	lat: integer("lat"),
	lng: integer("lng"),
	beginDate: timestamp("begin_date").notNull(),
	endDate: timestamp("end_date"),
	description: text("description"),
	sensitive: boolean("sensitive").default(false),
	volunteersNeeded: integer("volunteers_needed"),
	investment: integer("investment"),
	fundingRaised: integer("funding_raised"),
	photoUrls: text("photo_urls").array(),
	churchOrganizationId: text("church_organization_id").references(
		() => churchOrganization.id,
	),
});

export const usersToMissions = pgTable("users_to_missions", {
	userId: text("user_id")
		.notNull()
		.references(() => users.id),
	missionId: text("mission_id")
		.notNull()
		.references(() => missions.id),
});

export const churchOrganization = pgTable("church_organizations", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => uuidv4()),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	createdById: text("created_by_id")
		.notNull()
		.references(() => users.id),
	updatedAt: timestamp("updated_at").notNull(),
	name: text("name").notNull(),
	street: text("street"),
	city: text("city"),
	state: text("state"),
	zip: text("zip"),
	description: text("description"),
	churchBannerUrl: text("church_banner_url"),
	mainChurchWebsite: text("main_church_website"),
	liveStreamUrl: text("live_stream_url"),
	email: text("email"),
	phone: text("phone"),
	customDomain: text("custom_domain").unique(), // Store the custom domain for the church's landing page
	parentOrganizationId: text("parent_organization_id").references(
		(): AnyPgColumn => churchOrganization.id,
	),
	avatarUrl: text("avatar_url"),
	// Logo
	logoUrl: text("logo_url"),
	themeColors: text("theme_colors").default(
		JSON.stringify({
			primary: "#3b82f6", // Blue
			secondary: "#1e293b", // Slate
			accent: "#8b5cf6", // Purple
		}),
	), // Stores JSON of color config
});

export const usersTochurchOrganization = pgTable(
	"users_to_church_organizations",
	{
		userId: text("user_id")
			.notNull()
			.references(() => users.id),
		churchOrganizationId: text("church_organization_id")
			.notNull()
			.references(() => churchOrganization.id),
		isAdmin: boolean("is_admin").default(false).notNull(),
	},
);

export const organizationMembershipRequest = pgTable(
	"organization_membership_request",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => uuidv4()),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").notNull(),
		requestingChurchOrganizationId: text("requesting_church_organization_id")
			.notNull()
			.references(() => churchOrganization.id),
		parentOrganizationId: text("parent_organization_id")
			.notNull()
			.references(() => churchOrganization.id),
		status: text("status").default("pending").notNull(),
		type: text("type").default("organization").notNull(),
	},
);

export const userPreferences = pgTable("user_preferences", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => uuidv4()),
	userId: text("user_id")
		.notNull()
		.references(() => users.id)
		.unique(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	emailNotifications: boolean("email_notifications").default(true).notNull(),
	smsNotifications: boolean("sms_notifications").default(false).notNull(),
	phoneNotifications: boolean("phone_notifications").default(false).notNull(),
	emailFrequency: text("email_frequency").default("daily").notNull(), // daily, weekly, monthly
	smsFrequency: text("sms_frequency").default("daily").notNull(),
	phoneFrequency: text("phone_frequency").default("weekly").notNull(),
	notificationTypes: text("notification_types")
		.array()
		.default(["general"])
		.notNull(), // general, events, missions, etc
});

export const events = pgTable("events", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => uuidv4()),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	title: text("title").notNull(),
	description: text("description"),
	startDate: timestamp("start_date").notNull(),
	endDate: timestamp("end_date").notNull(),
	allDay: boolean("all_day").default(false),
	// Type can be: 'local' (one-time local event), 'recurring' (weekly service), 'mission' (mission trip)
	type: text("type").notNull().default("local"),
	heroImageUrl: text("hero_image_url"),
	// For recurring events
	recurrence: text("recurrence"), // JSON string containing recurrence rules
	// Location details
	location: text("location"),
	lat: integer("lat"),
	lng: integer("lng"),
	// For mission trips
	volunteersNeeded: integer("volunteers_needed"),
	investment: integer("investment"),
	fundingRaised: integer("funding_raised"),
	// Organization that owns this event
	churchOrganizationId: text("church_organization_id")
		.notNull()
		.references(() => churchOrganization.id),
	// Optional parent event (for series)
	parentEventId: text("parent_event_id").references(
		(): AnyPgColumn => events.id,
	),
});

// Table for users attending/participating in events
export const usersToEvents = pgTable("users_to_events", {
	userId: text("user_id")
		.notNull()
		.references(() => users.id),
	eventId: text("event_id")
		.notNull()
		.references(() => events.id),
	// Role can be: 'attendee', 'organizer', 'volunteer'
	role: text("role").notNull().default("attendee"),
	// For mission trips: status can be 'interested', 'confirmed', 'declined'
	status: text("status"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const landingPageConfig = pgTable("landing_page_config", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => uuidv4()),
	churchOrganizationId: text("church_organization_id")
		.notNull()
		.references(() => churchOrganization.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").notNull(),

	// Hero section
	heroImage: text("hero_image"),
	heroHeadline: text("hero_headline"),
	heroSubheadline: text("hero_subheadline"),
	heroImagePosition: text("hero_image_position").default("center"),
	heroImageObjectFit: text("hero_image_object_fit").default("cover"),
	heroOverlayOpacity: text("hero_overlay_opacity").default("0.5"),
	heroHeight: text("hero_height").default("500px"),

	// About section
	aboutTitle: text("about_title"),
	aboutContent: text("about_content"),
	aboutSubtitle: text("about_subtitle"),
	aboutLogoImage: text("about_logo_image"),
	aboutButtons: text("about_buttons"), // JSON string containing button config
	aboutSection: text("about_section"), // JSON string containing complete about section config

	// Custom sections
	customSections: text("custom_sections"), // JSON string containing all custom sections

	// Footer
	footerContent: text("footer_content"),
	socialLinks: text("social_links"), // JSON string containing social media links

	// Contact information (override church organization default if needed)
	contactEmail: text("contact_email"),
	contactPhone: text("contact_phone"),
	contactAddress: text("contact_address"),
	contactFormEnabled: boolean("contact_form_enabled").default(false),
});

export const teams = pgTable("teams", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => uuidv4()),
	churchOrganizationId: text("church_organization_id")
		.notNull()
		.references(() => churchOrganization.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	name: text("name").notNull(),
	description: text("description"),
	type: text("type").notNull(), // ministry, missions, worship, etc.
	color: text("color"), // For UI display
	isActive: boolean("is_active").default(true).notNull(),
});

export const usersToTeams = pgTable("users_to_teams", {
	userId: text("user_id")
		.notNull()
		.references(() => users.id),
	teamId: text("team_id")
		.notNull()
		.references(() => teams.id),
	role: text("role").notNull().default("member"), // leader, member
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

// Enhance roles table with organization context and permissions
export const organizationRoles = pgTable("organization_roles", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => uuidv4()),
	churchOrganizationId: text("church_organization_id")
		.notNull()
		.references(() => churchOrganization.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	name: text("name").notNull(),
	description: text("description"),
	permissions: text("permissions").array(), // Array of permission strings
	isDefault: boolean("is_default").default(false).notNull(), // For auto-assignment to new members
	isActive: boolean("is_active").default(true).notNull(),
});

export const usersToOrganizationRoles = pgTable("users_to_organization_roles", {
	userId: text("user_id")
		.notNull()
		.references(() => users.id),
	organizationRoleId: text("organization_role_id")
		.notNull()
		.references(() => organizationRoles.id),
	churchOrganizationId: text("church_organization_id")
		.notNull()
		.references(() => churchOrganization.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

// Add event_photos table after the events table
export const eventPhotos = pgTable("event_photos", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => uuidv4()),
	eventId: text("event_id")
		.notNull()
		.references(() => events.id, {
			onDelete: "cascade",
		}),
	photoUrl: text("photo_url").notNull(),
	caption: text("caption"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Table for tracking message usage for billing purposes
export const messageTracker = pgTable("message_tracker", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => uuidv4()),
	churchOrganizationId: text("church_organization_id")
		.notNull()
		.references(() => churchOrganization.id),
	messageType: text("message_type").notNull(), // "sms", "phone", "email"
	recipientId: text("recipient_id").references(() => users.id),
	guardianId: text("guardian_id").references(() => guardiansTable.id),
	recipientPhone: text("recipient_phone"),
	recipientEmail: text("recipient_email"),
	sentByUserId: text("sent_by_user_id").references(() => users.id),
	messageContent: text("message_content"), // Optional for compliance/auditing
	messageSubject: text("message_subject"), // For email messages
	messageLength: integer("message_length"), // Character count for SMS
	callDuration: integer("call_duration"), // Duration in seconds for phone calls
	status: text("status").notNull().default("sent"), // sent, delivered, failed
	providerMessageId: text("provider_message_id"), // ID returned by Twilio/SendGrid
	cost: integer("cost"), // Cost in cents
	sentAt: timestamp("sent_at").defaultNow().notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

// Saved message usage reports
export const messageUsageReports = pgTable("message_usage_reports", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => uuidv4()),
	name: text("name").notNull(),
	churchOrganizationId: text("church_organization_id")
		.notNull()
		.references(() => churchOrganization.id),
	startDate: timestamp("start_date").notNull(),
	endDate: timestamp("end_date").notNull(),
	period: text("period").notNull(), // week, month, year
	emailCount: integer("email_count").default(0),
	smsCount: integer("sms_count").default(0),
	phoneCount: integer("phone_count").default(0),
	totalCost: integer("total_cost").default(0), // Stored in cents
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Form configuration schema
export const formConfig = pgTable("form_configs", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => uuidv4()),
	churchOrganizationId: text("church_organization_id")
		.notNull()
		.references(() => churchOrganization.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
	name: text("name").notNull(),
	formFields: text("form_fields").notNull(), // JSON string of form fields
	formType: text("form_type").notNull(), // contact, prayer, first-time, etc.
	redirectUrl: text("redirect_url"), // URL to redirect to after submission
	emailNotifications: boolean("email_notifications").default(true),
	notificationEmails: text("notification_emails"), // comma-separated list of emails
	confirmationMessage: text("confirmation_message"), // Message to show after submission
	active: boolean("active").default(true),
});

// Form submissions schema
export const formSubmission = pgTable("form_submissions", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => uuidv4()),
	formConfigId: text("form_config_id")
		.notNull()
		.references(() => formConfig.id),
	churchOrganizationId: text("church_organization_id")
		.notNull()
		.references(() => churchOrganization.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	submissionData: text("submission_data").notNull(), // JSON string of form data
	submitterEmail: text("submitter_email"),
	submitterName: text("submitter_name"),
	viewed: boolean("viewed").default(false),
	archived: boolean("archived").default(false),
	notes: text("notes"),
});

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
