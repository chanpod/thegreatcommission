import { db } from "@/server/db/dbConnection";
import { events, usersToEvents, users, usersTochurchOrganization } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { PermissionsService } from "@/server/services/PermissionsService";
import { createAuthLoader } from "~/server/auth/authLoader";
import type { Route } from "../+types/root";

export const action = createAuthLoader(
    async ({ request, params, userContext }) => {
        try {
            const formData = await request.formData();
            const action = formData.get("action") as string;
            const eventId = params.eventId as string;
            const userId = formData.get("userId") as string;

            // Get the event to check permissions
            const event = await db
                .select()
                .from(events)
                .where(eq(events.id, eventId))
                .then((rows) => rows[0]);

            if (!event) {
                return { success: false, error: "Event not found" };
            }

            // Check if user has permission to manage organizers
            const permissionsService = new PermissionsService();
            const permissions = await permissionsService.getEventPermissions(
                userContext.user.id,
                event.churchOrganizationId
            );

            if (!permissions.canEdit) {
                return { success: false, error: "Permission denied" };
            }

            // Handle different actions
            switch (action) {
                case "addOrganizer": {
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
                        return {
                            success: false,
                            error: "User must be a member of the organization to be an organizer"
                        };
                    }

                    // Check if user is already an organizer
                    const isOrganizer = await db
                        .select()
                        .from(usersToEvents)
                        .where(
                            and(
                                eq(usersToEvents.userId, userId),
                                eq(usersToEvents.eventId, eventId),
                                eq(usersToEvents.role, "organizer")
                            )
                        )
                        .then((rows) => rows.length > 0);

                    if (isOrganizer) {
                        return { success: false, error: "User is already an organizer" };
                    }

                    // Add user as organizer
                    await db.insert(usersToEvents).values({
                        userId: userId,
                        eventId: eventId,
                        role: "organizer",
                        status: null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    } as any);

                    break;
                }
                case "removeOrganizer": {
                    // Remove user as organizer
                    await db
                        .delete(usersToEvents)
                        .where(
                            and(
                                eq(usersToEvents.userId, userId),
                                eq(usersToEvents.eventId, eventId),
                                eq(usersToEvents.role, "organizer")
                            )
                        );

                    break;
                }
                default:
                    return { success: false, error: "Invalid action" };
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
                        eq(usersToEvents.eventId, eventId),
                        eq(usersToEvents.role, "organizer")
                    )
                );

            return { success: true, organizers };
        } catch (error) {
            console.error("Error managing event organizers:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "An unknown error occurred"
            };
        }
    },
    true
);

// Empty loader to satisfy Remix
export const loader = createAuthLoader(
    async () => {
        return { message: "Use POST method to manage organizers" };
    },
    true
); 