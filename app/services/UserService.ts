
import { RolesEnum } from "~/src/types/roles.enum";
import type { roles, users } from "server/db/schema";

export class UserService {
    user: typeof users;
    roles: typeof roles;
    constructor(userIn: typeof users, rolesIn: typeof roles) {
        this.user = userIn;
        this.roles = rolesIn;
    }

    userIsSiteAdmin(): boolean {
        if (this.user?.roles) {
            return (
                (this.user.roles as typeof roles[]).find((role: typeof roles) => role.name.toUpperCase() === RolesEnum.SiteAdmin) !==
                undefined || false
            );
        }

        return false;
    }

    userIsAdmin(): boolean {
        let isAdmin = false;
        if (this.user?.roles) {
            isAdmin =
                (this.user.roles as Role[]).find((role: Role) => role.name.toUpperCase() === RolesEnum.ADMIN) !==
                undefined;
        }

        return isAdmin || this.userIsSiteAdmin();
    }
}
