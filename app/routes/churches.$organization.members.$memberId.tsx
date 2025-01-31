import { usersTochurchOrganization } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { data } from "react-router";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { db } from "~/server/dbConnection";

export const action = async ({ request, params }) => {


    if (request.method === "DELETE") {
        const authUser = await authenticator.isAuthenticated(request);
        if (!authUser) return data({ message: "Not Authenticated" }, { status: 401 });

        const response = await db.delete(usersTochurchOrganization).where(eq(usersTochurchOrganization.userId, params.memberId));
        return {
            success: true,
        };
    }

    throw new Error("Invalid request method");
}
