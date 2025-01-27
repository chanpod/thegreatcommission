import { eq } from "drizzle-orm";
import { missions } from "server/db/schema";
import { db } from "~/server/dbConnection";

export class MissionsDataService {
    async getMissionById(id: string) {
        const mission = await db.select().from(missions).where(eq(missions.id, id));
        return mission;
    }

    async getAllMissions() {
        const allMissions = await db.select().from(missions);
        return allMissions;
    }

    async createMission(formData: Partial<typeof missions>) {
        const missionData = {
            ...formData,
            updatedAt: new Date(),
        };

        const newMission = await db.insert(missions).values(missionData);
        return newMission;
    }

    async updateMission(id: string, formData: FormData) {
        const missionData = {
            title: formData.get("title") as string,
            description: formData.get("description") as string,
            beginDate: new Date(formData.get("beginDate") as string),
            endDate: new Date(formData.get("endDate") as string),
            churchOrganizationId: formData.get("churchOrganizationId") as string,
            lat: parseFloat(formData.get("lat") as string),
            lng: parseFloat(formData.get("lng") as string),
            volunteersNeeded: Number(formData.get("volunteersNeeded") ?? 0),
            fundingRaised: Number(formData.get("fundingRaised") ?? 0),
            sensitive: (formData.get("sensitive") as string) === "on",
            investment: Number(formData.get("investment") ?? 0),
        };

        const updatedMission = await db.update(missions)
            .set(missionData)
            .where(eq(missions.id, id));
        return updatedMission;
    }

    async deleteMission(id: string) {
        const deletedMission = await db.delete(missions)
            .where(eq(missions.id, id));
        return deletedMission;
    }
}

