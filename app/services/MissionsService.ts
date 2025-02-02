import { isDate, parseISO } from "date-fns";
import type { missions } from "server/db/schema";
import type { IMissionsFormData } from "~/routes/missions.create";

export class MissionsService {
	currentMission: IMissionsFormData | undefined;
	constructor(missionIn: IMissionsFormData | undefined = undefined) {
		this.currentMission = missionIn;
	}

	async getMissionsFormData(
		formData: FormData,
	): Promise<Partial<typeof missions>> {
		const location: Location = {
			lat: parseFloat(formData.get("lat") as string),
			lng: parseFloat(formData.get("lng") as string),
		};

		const beginDate = new Date(formData.get("beginDate") as string);
		const endDate = new Date(formData.get("endDate") as string);

		const missionFormData: Partial<typeof missions> = {
			title: formData.get("title") as string,
			description: formData.get("description") as string,
			beginDate: beginDate,
			endDate: endDate,
			churchOrganizationId: formData.get("churchOrganizationId") as string,
			lat: location.lat,
			lng: location.lng,
			volunteersNeeded: Number(formData.get("volunteersNeeded") ?? 0),
			fundingRaised: Number(formData.get("fundingRaised") ?? 0),
			sensitive: (formData.get("sensitive") as string) === "on",
			investment: Number(formData.get("investment") ?? 0),
		};

		return missionFormData;
	}
}
