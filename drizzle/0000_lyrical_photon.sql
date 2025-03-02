CREATE TABLE "church_organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by_id" text NOT NULL,
	"updated_at" timestamp NOT NULL,
	"name" text NOT NULL,
	"street" text,
	"city" text,
	"state" text,
	"zip" text,
	"description" text,
	"church_banner_url" text,
	"main_church_website" text,
	"live_stream_url" text,
	"email" text,
	"phone" text,
	"custom_domain" text,
	"parent_organization_id" text,
	"avatar_url" text,
	"logo_url" text,
	"theme_colors" text DEFAULT '{"primary":"#3b82f6","secondary":"#1e293b","accent":"#8b5cf6"}',
	CONSTRAINT "church_organizations_custom_domain_unique" UNIQUE("custom_domain")
);
--> statement-breakpoint
CREATE TABLE "event_photos" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"photo_url" text NOT NULL,
	"caption" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"all_day" boolean DEFAULT false,
	"type" text DEFAULT 'local' NOT NULL,
	"hero_image_url" text,
	"recurrence" text,
	"location" text,
	"lat" integer,
	"lng" integer,
	"volunteers_needed" integer,
	"investment" integer,
	"funding_raised" integer,
	"church_organization_id" text NOT NULL,
	"parent_event_id" text
);
--> statement-breakpoint
CREATE TABLE "form_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"church_organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"form_fields" text NOT NULL,
	"form_type" text NOT NULL,
	"redirect_url" text,
	"email_notifications" boolean DEFAULT true,
	"notification_emails" text,
	"confirmation_message" text,
	"active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "form_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"form_config_id" text NOT NULL,
	"church_organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"submission_data" text NOT NULL,
	"submitter_email" text,
	"submitter_name" text,
	"viewed" boolean DEFAULT false,
	"archived" boolean DEFAULT false,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "landing_page_config" (
	"id" text PRIMARY KEY NOT NULL,
	"church_organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"hero_image" text,
	"hero_headline" text,
	"hero_subheadline" text,
	"hero_image_position" text DEFAULT 'center',
	"hero_image_object_fit" text DEFAULT 'cover',
	"hero_overlay_opacity" text DEFAULT '0.5',
	"hero_height" text DEFAULT '500px',
	"about_title" text,
	"about_content" text,
	"about_subtitle" text,
	"about_logo_image" text,
	"about_buttons" text,
	"about_section" text,
	"custom_sections" text,
	"footer_content" text,
	"social_links" text,
	"contact_email" text,
	"contact_phone" text,
	"contact_address" text,
	"contact_form_enabled" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "message_tracker" (
	"id" text PRIMARY KEY NOT NULL,
	"church_organization_id" text NOT NULL,
	"message_type" text NOT NULL,
	"recipient_id" text,
	"recipient_phone" text,
	"recipient_email" text,
	"sent_by_user_id" text,
	"message_content" text,
	"message_subject" text,
	"message_length" integer,
	"call_duration" integer,
	"status" text DEFAULT 'sent' NOT NULL,
	"provider_message_id" text,
	"cost" integer,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_usage_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"church_organization_id" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"period" text NOT NULL,
	"email_count" integer DEFAULT 0,
	"sms_count" integer DEFAULT 0,
	"phone_count" integer DEFAULT 0,
	"total_cost" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "missions" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"title" text NOT NULL,
	"lat" integer,
	"lng" integer,
	"begin_date" timestamp NOT NULL,
	"end_date" timestamp,
	"description" text,
	"sensitive" boolean DEFAULT false,
	"volunteers_needed" integer,
	"investment" integer,
	"funding_raised" integer,
	"photo_urls" text[],
	"church_organization_id" text
);
--> statement-breakpoint
CREATE TABLE "organization_membership_request" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"requesting_church_organization_id" text NOT NULL,
	"parent_organization_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"type" text DEFAULT 'organization' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"church_organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"permissions" text[],
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"permissions" text[],
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" text PRIMARY KEY NOT NULL,
	"church_organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"color" text,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"email_notifications" boolean DEFAULT true NOT NULL,
	"sms_notifications" boolean DEFAULT false NOT NULL,
	"phone_notifications" boolean DEFAULT false NOT NULL,
	"email_frequency" text DEFAULT 'daily' NOT NULL,
	"sms_frequency" text DEFAULT 'daily' NOT NULL,
	"phone_frequency" text DEFAULT 'weekly' NOT NULL,
	"notification_types" text[] DEFAULT '{"general"}' NOT NULL,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text,
	"first_name" text,
	"last_name" text,
	"middle_name" text,
	"phone" text,
	"address" text,
	"city" text,
	"state" text,
	"zip" text,
	"country" text,
	"avatar_url" text,
	"google_id" text,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE "users_to_events" (
	"user_id" text NOT NULL,
	"event_id" text NOT NULL,
	"role" text DEFAULT 'attendee' NOT NULL,
	"status" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users_to_missions" (
	"user_id" text NOT NULL,
	"mission_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users_to_organization_roles" (
	"user_id" text NOT NULL,
	"organization_role_id" text NOT NULL,
	"church_organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users_to_roles" (
	"user_id" text NOT NULL,
	"role_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users_to_teams" (
	"user_id" text NOT NULL,
	"team_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users_to_church_organizations" (
	"user_id" text NOT NULL,
	"church_organization_id" text NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "church_organizations" ADD CONSTRAINT "church_organizations_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_organizations" ADD CONSTRAINT "church_organizations_parent_organization_id_church_organizations_id_fk" FOREIGN KEY ("parent_organization_id") REFERENCES "public"."church_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_photos" ADD CONSTRAINT "event_photos_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_church_organization_id_church_organizations_id_fk" FOREIGN KEY ("church_organization_id") REFERENCES "public"."church_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_parent_event_id_events_id_fk" FOREIGN KEY ("parent_event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_configs" ADD CONSTRAINT "form_configs_church_organization_id_church_organizations_id_fk" FOREIGN KEY ("church_organization_id") REFERENCES "public"."church_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_form_config_id_form_configs_id_fk" FOREIGN KEY ("form_config_id") REFERENCES "public"."form_configs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_church_organization_id_church_organizations_id_fk" FOREIGN KEY ("church_organization_id") REFERENCES "public"."church_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landing_page_config" ADD CONSTRAINT "landing_page_config_church_organization_id_church_organizations_id_fk" FOREIGN KEY ("church_organization_id") REFERENCES "public"."church_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_tracker" ADD CONSTRAINT "message_tracker_church_organization_id_church_organizations_id_fk" FOREIGN KEY ("church_organization_id") REFERENCES "public"."church_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_tracker" ADD CONSTRAINT "message_tracker_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_tracker" ADD CONSTRAINT "message_tracker_sent_by_user_id_users_id_fk" FOREIGN KEY ("sent_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_usage_reports" ADD CONSTRAINT "message_usage_reports_church_organization_id_church_organizations_id_fk" FOREIGN KEY ("church_organization_id") REFERENCES "public"."church_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_church_organization_id_church_organizations_id_fk" FOREIGN KEY ("church_organization_id") REFERENCES "public"."church_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_membership_request" ADD CONSTRAINT "organization_membership_request_requesting_church_organization_id_church_organizations_id_fk" FOREIGN KEY ("requesting_church_organization_id") REFERENCES "public"."church_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_membership_request" ADD CONSTRAINT "organization_membership_request_parent_organization_id_church_organizations_id_fk" FOREIGN KEY ("parent_organization_id") REFERENCES "public"."church_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_roles" ADD CONSTRAINT "organization_roles_church_organization_id_church_organizations_id_fk" FOREIGN KEY ("church_organization_id") REFERENCES "public"."church_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_church_organization_id_church_organizations_id_fk" FOREIGN KEY ("church_organization_id") REFERENCES "public"."church_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_events" ADD CONSTRAINT "users_to_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_events" ADD CONSTRAINT "users_to_events_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_missions" ADD CONSTRAINT "users_to_missions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_missions" ADD CONSTRAINT "users_to_missions_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_organization_roles" ADD CONSTRAINT "users_to_organization_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_organization_roles" ADD CONSTRAINT "users_to_organization_roles_organization_role_id_organization_roles_id_fk" FOREIGN KEY ("organization_role_id") REFERENCES "public"."organization_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_organization_roles" ADD CONSTRAINT "users_to_organization_roles_church_organization_id_church_organizations_id_fk" FOREIGN KEY ("church_organization_id") REFERENCES "public"."church_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_roles" ADD CONSTRAINT "users_to_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_roles" ADD CONSTRAINT "users_to_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_teams" ADD CONSTRAINT "users_to_teams_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_teams" ADD CONSTRAINT "users_to_teams_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_church_organizations" ADD CONSTRAINT "users_to_church_organizations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_church_organizations" ADD CONSTRAINT "users_to_church_organizations_church_organization_id_church_organizations_id_fk" FOREIGN KEY ("church_organization_id") REFERENCES "public"."church_organizations"("id") ON DELETE no action ON UPDATE no action;