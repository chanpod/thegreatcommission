import { Role, User } from "@prisma/client";
import { RolesEnum } from "~/src/types/roles.enum";

export class UserService {
    user: User;
    constructor(userIn: User) {
        this.user = userIn;
    }

    userIsSiteAdmin(): boolean {
        if (this.user?.roles) {
            return (
                (this.user.roles as Role[]).find((role: Role) => role.name.toUpperCase() === RolesEnum.SiteAdmin) !==
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
