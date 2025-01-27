import { pgTable, text, timestamp, boolean, integer, unique, serial, foreignKey, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { v4 as uuidv4 } from 'uuid';

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  email: text('email').unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),  
  middleName: text('middle_name'),  
  phone: text('phone'),  
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zip: text('zip'),
  country: text('country'),
  avatarUrl: text('avatar_url'),
  googleId: text('google_id').unique(),  
});

export const roles = pgTable('roles', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  name: text('name').notNull(),
});

export const usersToRoles = pgTable('users_to_roles', {
  userId: text('user_id').notNull().references(() => users.id),
  roleId: text('role_id').notNull().references(() => roles.id),
});

export const missions = pgTable('missions', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  title: text('title').notNull(),
  lat: integer('lat'),
  lng: integer('lng'),
  beginDate: timestamp('begin_date').notNull(),
  endDate: timestamp('end_date'),
  description: text('description'),
  sensitive: boolean('sensitive').default(false),
  volunteersNeeded: integer('volunteers_needed'),
  investment: integer('investment'),
  fundingRaised: integer('funding_raised'),
  photoUrls: text('photo_urls').array(),
  churchOrganizationId: text('church_organization_id').references(() => churchOrganization.id),
});

export const usersToMissions = pgTable('users_to_missions', {
  userId: text('user_id').notNull().references(() => users.id),
  missionId: text('mission_id').notNull().references(() => missions.id),
});

export const churchOrganization = pgTable('church_organizations', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdById: text('created_by_id').notNull().references(() => users.id),
  updatedAt: timestamp('updated_at').notNull(),
  name: text('name').notNull(),
  street: text('street'),
  city: text('city'),
  state: text('state'),
  zip: text('zip'),
  description: text('description'),
  churchBannerUrl: text('church_banner_url'),
  mainChurchWebsite: text('main_church_website'),
  email: text('email'),
  phone: text('phone'),
  parentOrganizationId: text('parent_organization_id').references((): AnyPgColumn => churchOrganization.id),
  avatarUrl: text('avatar_url'),
});

export const usersTochurchOrganization = pgTable('users_to_church_organizations', {
  userId: text('user_id').notNull().references(() => users.id),
  churchOrganizationId: text('church_organization_id').notNull().references(() => churchOrganization.id),
  isAdmin: boolean('is_admin').default(false).notNull(),
});

export const organizationMembershipRequest = pgTable('organization_membership_request', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  requestingChurchOrganizationId: text('requesting_church_organization_id').notNull().references(() => churchOrganization.id),
  parentOrganizationId: text('parent_organization_id').notNull().references(() => churchOrganization.id),
  status: text('status').default('pending').notNull(),
  type: text('type').default('organization').notNull(),
});

export const userPreferences = pgTable('user_preferences', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  userId: text('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  emailNotifications: boolean('email_notifications').default(true).notNull(),
  smsNotifications: boolean('sms_notifications').default(false).notNull(),
  phoneNotifications: boolean('phone_notifications').default(false).notNull(),
  emailFrequency: text('email_frequency').default('daily').notNull(), // daily, weekly, monthly
  smsFrequency: text('sms_frequency').default('daily').notNull(),
  phoneFrequency: text('phone_frequency').default('weekly').notNull(),
  notificationTypes: text('notification_types').array().default(['general']).notNull(), // general, events, missions, etc
});
