
import { RolesEnum } from "~/src/types/roles.enum";
import type { users } from "server/db/schema";

export class UserService {
    user: typeof users;
    constructor(userIn: typeof users) {
        this.user = userIn;
    }

    userIsSiteAdmin(): boolean {
        // if (this.user?) {
        //     return (
        //         (this.user.roles as typeof roles[]).find((role: typeof roles) => role.name.toUpperCase() === RolesEnum.SiteAdmin) !==
        //             undefined || false
        //     );
        // }

        return false;
    }

    userIsAdmin(): boolean {
        let isAdmin = false;
        // if (this.user?.roles) {
        //     isAdmin =
        //         (this.user.roles as Role[]).find((role: Role) => role.name.toUpperCase() === RolesEnum.ADMIN) !==
        //         undefined;
        // }

        return isAdmin || this.userIsSiteAdmin();
    }
}
