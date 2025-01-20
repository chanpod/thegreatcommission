import type { IChurchFormData } from "~/src/components/forms/createChurch/CreateChurchForm";
import { UserService } from "./UserService";
import type { churchOrganization, users } from "server/db/schema";

export class ChurchService {
    currentChurch: typeof churchOrganization | undefined;
    constructor(churchIn: typeof churchOrganization | undefined = undefined) {
        this.currentChurch = churchIn;
    }

    async getChurchFormDataFromRequest(request: Request): Promise<IChurchFormData> {
        const formData = await request.formData();
        const church: IChurchFormData = {
            name: formData.get("name") as string,
            city: formData.get("city") as string,
            state: formData.get("state") as string,
            street: formData.get("street") as string,
            zip: formData.get("zip") as string, 
            churchBannerUrl: formData.get("churchBannerUrl") as string,
            mainChurchWebsite: formData.get("mainChurchWebsite") as string,
        } as IChurchFormData;

        return church;
    }

    userIsAdmin(user: typeof users): boolean {
        const userService = new UserService(user);
        // return this.currentChurch?.adminsIds.includes(user?.id) || userService.userIsAdmin() || false;
        return false;
    }
}
