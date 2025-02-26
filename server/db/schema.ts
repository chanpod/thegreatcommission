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
		.references(() => churchOrganization.id)
		.unique(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	// Hero section
	heroImage: text("hero_image"),
	heroHeadline: text("hero_headline"),
	heroSubheadline: text("hero_subheadline"),

	// About section
	aboutTitle: text("about_title"),
	aboutContent: text("about_content"),
	// Footer
	footerContent: text("footer_content"),
	socialLinks: text("social_links"), // JSON string containing social media links
	// Contact information (override church organization default if needed)
	contactEmail: text("contact_email"),
	contactPhone: text("contact_phone"),
	contactAddress: text("contact_address"),
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
