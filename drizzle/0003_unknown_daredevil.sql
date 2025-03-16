CREATE TABLE "authorized_pickup_persons" (
	"id" text PRIMARY KEY NOT NULL,
	"child_checkin_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"relationship" text NOT NULL,
	"photo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "child_checkins" (
	"id" text PRIMARY KEY NOT NULL,
	"child_id" text NOT NULL,
	"room_id" text NOT NULL,
	"checkin_time" timestamp DEFAULT now() NOT NULL,
	"checkout_time" timestamp,
	"checked_in_by_user_id" text NOT NULL,
	"checked_out_by_user_id" text,
	"checkin_notes" text,
	"secure_id" text NOT NULL,
	"status" text DEFAULT 'checked-in' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "children" (
	"id" text PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"date_of_birth" timestamp NOT NULL,
	"allergies" text,
	"special_notes" text,
	"photo_url" text,
	"family_id" text,
	"church_organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "families" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"church_organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text,
	"name" text NOT NULL,
	"min_age" integer,
	"max_age" integer,
	"capacity" integer DEFAULT 10,
	"church_organization_id" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users_to_families" (
	"user_id" text NOT NULL,
	"family_id" text NOT NULL,
	"relationship" text NOT NULL,
	"is_primary_guardian" boolean DEFAULT false,
	"can_pickup" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "message_tracker" ALTER COLUMN "sent_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "message_tracker" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "photo_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "church_organization_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "authorized_pickup_persons" ADD CONSTRAINT "authorized_pickup_persons_child_checkin_id_child_checkins_id_fk" FOREIGN KEY ("child_checkin_id") REFERENCES "public"."child_checkins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_checkins" ADD CONSTRAINT "child_checkins_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_checkins" ADD CONSTRAINT "child_checkins_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_checkins" ADD CONSTRAINT "child_checkins_checked_in_by_user_id_users_id_fk" FOREIGN KEY ("checked_in_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_checkins" ADD CONSTRAINT "child_checkins_checked_out_by_user_id_users_id_fk" FOREIGN KEY ("checked_out_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "children" ADD CONSTRAINT "children_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "children" ADD CONSTRAINT "children_church_organization_id_church_organizations_id_fk" FOREIGN KEY ("church_organization_id") REFERENCES "public"."church_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "families" ADD CONSTRAINT "families_church_organization_id_church_organizations_id_fk" FOREIGN KEY ("church_organization_id") REFERENCES "public"."church_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_church_organization_id_church_organizations_id_fk" FOREIGN KEY ("church_organization_id") REFERENCES "public"."church_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_families" ADD CONSTRAINT "users_to_families_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_families" ADD CONSTRAINT "users_to_families_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_church_organization_id_church_organizations_id_fk" FOREIGN KEY ("church_organization_id") REFERENCES "public"."church_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_tracker" DROP COLUMN "created_at";