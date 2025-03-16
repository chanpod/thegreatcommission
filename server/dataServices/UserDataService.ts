import { aliasedTable, eq, or } from "drizzle-orm";

import {
	churchOrganization,
	roles as rolesSchema,
	users as usersSchema,
	usersToRoles,
} from "server/db/schema";
import { db } from "@/server/db/dbConnection";

export async function updateUser(userId: string, user: typeof usersSchema) {
	return await db
		.update(usersSchema)
		.set({
			...user,
		})
		.where(eq(usersSchema.id, userId));
}

type GetUser = {
	users: typeof usersSchema.$inferSelect;
	roles: (typeof rolesSchema.$inferSelect)[];
};

export async function getUser(
	{
		email,
		userId,
	}: {
		email?: string;
		userId?: string;
	},
	includes: { roles: boolean; churches: boolean } = {
		roles: false,
		churches: false,
	},
): Promise<GetUser> {
	let query = db.select().from(usersSchema).where(or(eq(usersSchema.email, email), eq(usersSchema.id, userId)));
	let users;
	let roles = [];

	if (includes.roles) {
		const rolesAlias = aliasedTable(rolesSchema, "roles");
		query.leftJoin(usersToRoles, eq(usersSchema.id, usersToRoles.userId));
		query.leftJoin(rolesAlias, eq(usersToRoles.roleId, rolesAlias.id));

		const result = await query.then((result) => result[0]) as GetUser;

		if (result) {
			users = result.users as typeof usersSchema.$inferSelect;
			roles = result.roles as (typeof rolesSchema.$inferSelect)[];
		}
	} else {
		const result = await query.then((result) => result[0]);
		if (result) {
			users = result as typeof users;
		}
	}

	return {
		users,
		roles,
	};
}
