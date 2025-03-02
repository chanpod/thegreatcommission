import { db } from "../../server/db";
import {
	childrenTable,
	guardiansTable,
	childrenToGuardiansTable,
	checkinSessionsTable,
	childCheckinsTable,
	authorizedPickupPersonsTable,
	type NewChild,
	type NewGuardian,
	type NewChildToGuardian,
	type NewCheckinSession,
	type NewChildCheckin,
	type NewAuthorizedPickupPerson,
} from "../../server/db/childCheckin";
import { eq, and, isNull } from "drizzle-orm";

export class ChildCheckinService {
	// Child management
	async createChild(childData: NewChild) {
		const [child] = await db
			.insert(childrenTable)
			.values(childData)
			.returning();
		return child;
	}

	async getChildById(childId: string) {
		const child = await db.query.childrenTable.findFirst({
			where: eq(childrenTable.id, childId),
		});
		return child;
	}

	async getChildrenByOrganization(churchOrganizationId: string) {
		const children = await db.query.childrenTable.findMany({
			where: eq(childrenTable.churchOrganizationId, churchOrganizationId),
		});
		return children;
	}

	// Guardian management
	async createGuardian(guardianData: NewGuardian) {
		const [guardian] = await db
			.insert(guardiansTable)
			.values(guardianData)
			.returning();
		return guardian;
	}

	async getGuardianById(guardianId: string) {
		const guardian = await db.query.guardiansTable.findFirst({
			where: eq(guardiansTable.id, guardianId),
		});
		return guardian;
	}

	async getGuardiansByOrganization(churchOrganizationId: string) {
		const guardians = await db.query.guardiansTable.findMany({
			where: eq(guardiansTable.churchOrganizationId, churchOrganizationId),
		});
		return guardians;
	}

	// Child-Guardian relationship management
	async linkChildToGuardian(relationData: NewChildToGuardian) {
		const [relation] = await db
			.insert(childrenToGuardiansTable)
			.values(relationData)
			.returning();
		return relation;
	}

	async getGuardiansForChild(childId: string) {
		const relations = await db.query.childrenToGuardiansTable.findMany({
			where: eq(childrenToGuardiansTable.childId, childId),
			with: {
				guardian: true,
			},
		});
		return relations;
	}

	async getChildrenForGuardian(guardianId: string) {
		const relations = await db.query.childrenToGuardiansTable.findMany({
			where: eq(childrenToGuardiansTable.guardianId, guardianId),
			with: {
				child: true,
			},
		});
		return relations;
	}

	// Checkin session management
	async createCheckinSession(sessionData: NewCheckinSession) {
		const [session] = await db
			.insert(checkinSessionsTable)
			.values(sessionData)
			.returning();
		return session;
	}

	async getActiveCheckinSessions(churchOrganizationId: string) {
		const sessions = await db.query.checkinSessionsTable.findMany({
			where: and(
				eq(checkinSessionsTable.churchOrganizationId, churchOrganizationId),
				eq(checkinSessionsTable.isActive, true),
			),
		});
		return sessions;
	}

	// Child checkin management
	async checkinChild(checkinData: NewChildCheckin) {
		const [checkin] = await db
			.insert(childCheckinsTable)
			.values({
				...checkinData,
				updatedAt: new Date(),
			})
			.returning();
		return checkin;
	}

	async getActiveCheckins(sessionId: string) {
		const checkins = await db.query.childCheckinsTable.findMany({
			where: and(
				eq(childCheckinsTable.sessionId, sessionId),
				isNull(childCheckinsTable.checkoutTime),
			),
			with: {
				child: true,
			},
		});
		return checkins;
	}

	async checkoutChild(checkinId: string, guardianId: string) {
		const [updatedCheckin] = await db
			.update(childCheckinsTable)
			.set({
				checkoutTime: new Date(),
				checkedOutByGuardianId: guardianId,
				status: "checked-out",
				updatedAt: new Date(),
			})
			.where(eq(childCheckinsTable.id, checkinId))
			.returning();
		return updatedCheckin;
	}

	// Authorized pickup persons management
	async addAuthorizedPickupPerson(pickupPersonData: NewAuthorizedPickupPerson) {
		const [pickupPerson] = await db
			.insert(authorizedPickupPersonsTable)
			.values(pickupPersonData)
			.returning();
		return pickupPerson;
	}

	async getAuthorizedPickupPersons(childCheckinId: string) {
		const pickupPersons = await db.query.authorizedPickupPersonsTable.findMany({
			where: eq(authorizedPickupPersonsTable.childCheckinId, childCheckinId),
		});
		return pickupPersons;
	}

	// QR code verification
	async verifyCheckinBySecureId(secureId: string) {
		const checkin = await db.query.childCheckinsTable.findFirst({
			where: eq(childCheckinsTable.secureId, secureId),
			with: {
				child: true,
			},
		});
		return checkin;
	}
}

export const childCheckinService = new ChildCheckinService();
