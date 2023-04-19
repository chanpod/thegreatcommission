import { ChurchOrganization, Location, Missions, User } from "@prisma/client";
import { IChurchFormData } from "~/src/components/forms/createChurch/CreateChurchForm";
import { UserService } from "./UserService";
import { IMissionsFormData } from "~/routes/missions/create";

export class MissionsService {
    currentMission: IMissionsFormData | undefined;
    constructor(missionIn: IMissionsFormData | undefined = undefined) {
        this.currentMission = missionIn;
    }

    async getMissionsFormData(request: Request): Promise<Partial<Missions>> {
        const formData = await request.formData();
        const location: Location = {
            lat: parseFloat(formData.get("lat") as string),
            lng: parseFloat(formData.get("lng") as string),
        };

        console.log(formData.get("sensitive"));
        const missionFormData: Partial<Missions> = {
            title: formData.get("title") as string,
            description: formData.get("description") as string,
            beginDate: new Date(formData.get("beginDate") as string),
            endDate: new Date(formData.get("endDate") as string),
            churchOrganizationId: formData.get("churchOrganizationId") as string,
            location: location,
            volunteersNeeded: Number(formData.get("volunteersNeeded") ?? 0),
            fundingRaised: Number(formData.get("fundingRaised") ?? 0),
            sensitive: (formData.get("sensitive") as string) === "on",
            investment: Number(formData.get("investment") ?? 0),
        };

        return missionFormData;
    }
}
