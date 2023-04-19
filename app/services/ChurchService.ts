import { ChurchOrganization, User } from "@prisma/client";
import { IChurchFormData } from "~/src/components/forms/createChurch/CreateChurchForm";
import { UserService } from "./UserService";

export class ChurchService {
    currentChurch: ChurchOrganization | undefined;
    constructor(churchIn: ChurchOrganization | undefined = undefined) {
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

    userIsAdmin(user: User): boolean {
        const userService = new UserService(user);
        return this.currentChurch?.adminsIds.includes(user?.id) || userService.userIsAdmin() || false;
    }
}
