import { ChurchOrganization } from "@prisma/client";
import { IChurchFormData } from "~/src/components/forms/createChurch/CreateChurchForm";

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
            zip: formData.get("zip") as string,
        } as IChurchFormData;

        return church;
    }
}
