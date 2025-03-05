import { db } from "@/server/db/dbConnection";
import { events, usersToEvents, users, usersTochurchOrganization } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { PermissionsService } from "@/server/services/PermissionsService";
import { createAuthHandler } from "@/server/api/createAuthHandler";

export default createAuthHandler({
  async POST({ req, res, userContext }) {
    try {
      const { eventId } = req.query;
      const { action, userId } = req.body;

      // Get the event to check permissions
      const event = await db
        .select()
        .from(events)
        .where(eq(events.id, eventId as string))
        .then((rows) => rows[0]);

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Check if user has permission to manage organizers
      const permissionsService = new PermissionsService();
      const permissions = await permissionsService.getEventPermissions(
        userContext.user.id,
        event.churchOrganizationId
      );

      if (!permissions.canEdit) {
        return res.status(403).json({ error: "Permission denied" });
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
            return res.status(400).json({ 
              error: "User must be a member of the organization to be an organizer" 
            });
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
            return res.status(400).json({ error: "User is already an organizer" });
          }

          // Add user as organizer
          await db.insert(usersToEvents).values({
            userId,
            eventId: eventId as string,
            role: "organizer",
            status: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          break;
        }
        case "removeOrganizer": {
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
        default:
          return res.status(400).json({ error: "Invalid action" });
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

      return res.status(200).json({ success: true, organizers });
    } catch (error) {
      console.error("Error managing event organizers:", error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : "An unknown error occurred" 
      });
    }
  }
}); 