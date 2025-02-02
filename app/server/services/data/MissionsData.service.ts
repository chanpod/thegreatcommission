import { eq } from "drizzle-orm";
import { missions } from "server/db/schema";
import { db } from "~/server/dbConnection";

export async function getMissionById(id: string) {
	const mission = await db.select().from(missions).where(eq(missions.id, id));
	return mission;
}

export async function getAllMissions() {
	const allMissions = await db.select().from(missions);
	return allMissions;
}

export async function createMission(formData: Partial<typeof missions>) {
	const missionData = {
		...formData,
		updatedAt: new Date(),
	};

	const newMission = await db.insert(missions).values(missionData);
	return newMission;
}

export async function updateMission(id: string, formData: FormData) {
	const missionData = {
		title: formData.get("title") as string,
		description: formData.get("description") as string,
		beginDate: new Date(formData.get("beginDate") as string),
		endDate: new Date(formData.get("endDate") as string),
		churchOrganizationId: formData.get("churchOrganizationId") as string,
		lat: Number.parseFloat(formData.get("lat") as string),
		lng: Number.parseFloat(formData.get("lng") as string),
		volunteersNeeded: Number(formData.get("volunteersNeeded") ?? 0),
		fundingRaised: Number(formData.get("fundingRaised") ?? 0),
		sensitive: (formData.get("sensitive") as string) === "on",
		investment: Number(formData.get("investment") ?? 0),
	};

	const updatedMission = await db
		.update(missions)
		.set(missionData)
		.where(eq(missions.id, id));
	return updatedMission;
}

export async function deleteMission(id: string) {
	const deletedMission = await db.delete(missions).where(eq(missions.id, id));
	return deletedMission;
}
