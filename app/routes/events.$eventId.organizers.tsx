
import { db } from "@/server/db/dbConnection";
import { events, usersToEvents, users, usersTochurchOrganization } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { createAuthLoader } from "~/server/auth/authLoader";
import { PermissionsService } from "@/server/services/PermissionsService";
import { MessagingService } from "@/server/services/MessagingService";
import type { Route } from "../+types/root";
import { EventOrganizers } from "~/components/events/EventOrganizers";
import { data, useLoaderData } from "react-router";

export const loader = createAuthLoader(async ({ params, userContext }) => {
    const { eventId } = params;

    // Get the event
    const event = await db
        .select()
        .from(events)
        .where(eq(events.id, eventId as string))
        .then((rows) => rows[0]);

    if (!event) {
        throw new Response("Event not found", { status: 404 });
    }

    // Get organizers for this event
    const organizers = await db
        .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            avatarUrl: users.avatarUrl,
        })
        .from(usersToEvents)
        .innerJoin(users, eq(usersToEvents.userId, users.id))
        .where(
            and(
                eq(usersToEvents.eventId, eventId as string),
                eq(usersToEvents.role, "organizer")
            )
        );

    // Check if user is admin of the organization
    const isAdmin = await db
        .select()
        .from(usersTochurchOrganization)
        .where(
            and(
                eq(usersTochurchOrganization.userId, userContext?.user?.id || ""),
                eq(usersTochurchOrganization.churchOrganizationId, event.churchOrganizationId),
                eq(usersTochurchOrganization.isAdmin, true)
            )
        )
        .then((rows) => rows.length > 0);

    // Get organization members for adding organizers
    const members = await db
        .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            avatarUrl: users.avatarUrl,
        })
        .from(usersTochurchOrganization)
        .innerJoin(users, eq(usersTochurchOrganization.userId, users.id))
        .where(
            eq(usersTochurchOrganization.churchOrganizationId, event.churchOrganizationId)
        );

    return {
        event,
        organizers,
        isAdmin,
        members,
    };
}, true);

export const action = createAuthLoader(async ({ request, params, userContext }) => {
    const { eventId } = params;
    const formData = await request.formData();
    const actionType = formData.get("action") as string;

    // Get the event
    const event = await db
        .select()
        .from(events)
        .where(eq(events.id, eventId as string))
        .then((rows) => rows[0]);

    if (!event) {
        return data({ error: "Event not found" }, { status: 404 });
    }

    // Check permissions for admin actions
    if (actionType === "addOrganizer" || actionType === "removeOrganizer") {
        const permissionsService = new PermissionsService();
        const permissions = await permissionsService.getEventPermissions(
            userContext.user.id,
            event.churchOrganizationId
        );

        if (!permissions.canEdit) {
            return data({ error: "Permission denied" }, { status: 403 });
        }
    }

    switch (actionType) {
        case "addOrganizer": {
            const userId = formData.get("userId") as string;

            // Check if user is a member of the organization
            const isMember = await db
                .select()
                .from(usersTochurchOrganization)
                .where(
                    and(
                        eq(usersTochurchOrganization.userId, userId),
                        eq(usersTochurchOrganization.churchOrganizationId, event.churchOrganizationId)
                    )
                )
                .then((rows) => rows.length > 0);

            if (!isMember) {
                return data({
                    error: "User must be a member of the organization to be an organizer"
                }, { status: 400 });
            }

            // Check if user is already an organizer
            const isOrganizer = await db
                .select()
                .from(usersToEvents)
                .where(
                    and(
                        eq(usersToEvents.userId, userId),
                        eq(usersToEvents.eventId, eventId as string),
                        eq(usersToEvents.role, "organizer")
                    )
                )
                .then((rows) => rows.length > 0);

            if (isOrganizer) {
                return data({ error: "User is already an organizer" }, { status: 400 });
            }

            // Add user as organizer
            await db.insert(usersToEvents).values({
                userId,
                eventId: eventId as string,
                role: "organizer",
                status: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any); // Using 'as any' to bypass type checking for now

            break;
        }

        case "removeOrganizer": {
            const userId = formData.get("userId") as string;

            // Remove user as organizer
            await db
                .delete(usersToEvents)
                .where(
                    and(
                        eq(usersToEvents.userId, userId),
                        eq(usersToEvents.eventId, eventId as string),
                        eq(usersToEvents.role, "organizer")
                    )
                );

            break;
        }

        case "messageOrganizers": {
            const name = formData.get("name") as string;
            const email = formData.get("email") as string;
            const subject = formData.get("subject") as string;
            const message = formData.get("message") as string;

            if (!name || !email || !message) {
                return data({ error: "Missing required fields" }, { status: 400 });
            }

            // Get all organizers for this event
            const organizers = await db
                .select({
                    id: users.id,
                    email: users.email,
                    firstName: users.firstName,
                    lastName: users.lastName,
                })
                .from(usersToEvents)
                .innerJoin(users, eq(usersToEvents.userId, users.id))
                .where(
                    and(
                        eq(usersToEvents.eventId, eventId as string),
                        eq(usersToEvents.role, "organizer")
                    )
                );

            if (organizers.length === 0) {
                return data({ error: "No organizers found for this event" }, { status: 400 });
            }

            // Send email to each organizer
            const emailPromises = organizers.map(organizer => {
                return MessagingService.sendEmail(
                    {
                        churchOrganizationId: event.churchOrganizationId,
                        messageType: "email",
                        subject: `[Event Message] ${subject || event.title}`,
                        message: `
              <p>Message from: ${name} (${email})</p>
              <p>Regarding event: ${event.title}</p>
              <hr />
              <p>${message}</p>
            `,
                        format: { html: true },
                    },
                    {
                        email: organizer.email || "",
                        userId: organizer.id,
                        firstName: organizer.firstName || "",
                        lastName: organizer.lastName || "",
                    }
                );
            });

            await Promise.all(emailPromises);

            break;
        }

        default:
            return data({ error: "Invalid action" }, { status: 400 });
    }

    // Get updated list of organizers
    const organizers = await db
        .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            avatarUrl: users.avatarUrl,
        })
        .from(usersToEvents)
        .innerJoin(users, eq(usersToEvents.userId, users.id))
        .where(
            and(
                eq(usersToEvents.eventId, eventId as string),
                eq(usersToEvents.role, "organizer")
            )
        );

    return data({ success: true, organizers });
}, true);

interface LoaderData {
    event: typeof events.$inferSelect;
    organizers: Array<{
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        avatarUrl: string | null;
    }>;
    isAdmin: boolean;
    members: Array<{
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        avatarUrl: string | null;
    }>;
}

export default function EventOrganizersPage() {
    const { event, organizers, isAdmin } = useLoaderData<LoaderData>();

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">Organizers for {event.title}</h1>
            <EventOrganizers
                eventId={event.id}
                churchOrganizationId={event.churchOrganizationId}
                organizers={organizers}
                isAdmin={isAdmin}
            />
        </div>
    );
} 