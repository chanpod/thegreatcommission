import { users } from "server/db/schema";
import type { Route } from "./+types";
import { db } from "~/server/dbConnection";
import { eq } from "drizzle-orm";

export const action = async ({ request, params }: Route.ActionArgs) => {
    const form = await request.formData();

    const user = JSON.parse(form.get("user") as string) as typeof users.$inferInsert;

    const response = await db.delete(users).where(eq(users.id, user.id));

    return {
        response: response,
    };
};
