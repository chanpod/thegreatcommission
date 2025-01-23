import { eq } from "drizzle-orm";

import { roles, users, usersToRoles } from "server/db/schema";
import { db } from "~/server/dbConnection";

export class UserDataService {
   
    async getUser(email: string, includes: {roles: boolean, churches: boolean} = {roles: false, churches: false}): Promise<{users: typeof users, roles: typeof roles[]}> {
        let query = db.select().from(users).where(eq(users.email, email))

        if (includes.roles) {
            
            query.leftJoin(usersToRoles, eq(users.id, usersToRoles.userId))
            query.leftJoin(roles, eq(usersToRoles.roleId, roles.id))
        }

        return await query.then((result) => result[0]);
    }
}