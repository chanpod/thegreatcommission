import { db } from "@/server/db/dbConnection";
import { users, usersTochurchOrganization } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { createAuthLoader } from "~/server/auth/authLoader";
import type { Route } from "../+types/root";

export const loader = createAuthLoader(async ({ params, userContext }) => {
    const { organizationId } = params;

    if (!organizationId) {
        return new Response(JSON.stringify({ error: "Organization ID is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
        });
    }

    // Get all members of the organization
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
        .where(eq(usersTochurchOrganization.churchOrganizationId, organizationId));
    console.log("members", members);
    return { members }
}, true); 