import { pgTable, text, timestamp, boolean, integer, unique, serial, foreignKey, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { v4 as uuidv4 } from 'uuid';

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  email: text('email').unique().notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  googleId: text('google_id').unique(),
  avatarUrl: text('avatar_url'),
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

export const missionaries = pgTable('missionaries', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  userId: text('user_id').references(() => users.id),
  firstName: text('first_name'),
  middleName: text('middle_name'),
  lastName: text('last_name'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zip: text('zip'),
  country: text('country'),
  avatarUrl: text('avatar_url'),
});

export const missionariesToMissions = pgTable('missionaries_to_missions', {
  missionaryId: text('missionary_id').notNull().references(() => missionaries.id),
  missionId: text('mission_id').notNull().references(() => missions.id),
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