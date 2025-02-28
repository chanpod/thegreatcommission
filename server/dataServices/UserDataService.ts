import { aliasedTable, eq } from "drizzle-orm";

import {
	churchOrganization,
	roles as rolesSchema,
	users as usersSchema,
	usersToRoles,
} from "server/db/schema";
import { db } from "~/server/dbConnection";

export async function updateUser(userId: string, user: typeof usersSchema) {
	return await db
		.update(usersSchema)
		.set({
			...user,
		})
		.where(eq(usersSchema.id, userId));
}

export async function getUser(
	email: string,
	includes: { roles: boolean; churches: boolean } = {
		roles: false,
		churches: false,
	},
): Promise<{
	users: typeof usersSchema | null;
	roles: (typeof rolesSchema)[];
}> {
	let query = db.select().from(usersSchema).where(eq(usersSchema.email, email));
	let users;
	let roles = [];

	if (includes.roles) {
		const rolesAlias = aliasedTable(rolesSchema, "roles");
		query.leftJoin(usersToRoles, eq(usersSchema.id, usersToRoles.userId));
		query.leftJoin(rolesAlias, eq(usersToRoles.roleId, rolesAlias.id));

		const result = await query.then((result) => result[0]);

		if (result) {
			users = result.users as typeof users;
			roles = result.roles as (typeof roles)[];
		}
	} else {
		const result = await query.then((result) => result[0]);
		users = result as typeof users;
	}

	return {
		users,
		roles,
	};
}
