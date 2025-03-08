import { db } from "../../server/db";
import {
	childrenTable,
	users,
	familiesTable,
	usersToFamiliesTable,
	roomsTable,
	childCheckinsTable,
	authorizedPickupPersonsTable,
	type NewChild,
	type NewUser,
	type NewFamily,
	type NewUserToFamily,
	type NewRoom,
	type NewChildCheckin,
	type NewAuthorizedPickupPerson,
} from "../../server/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

export class ChildCheckinService {
	// Child management
	async createChild(childData: NewChild) {
		const child = await db
			.insert(childrenTable)
			.values({
				...childData,
				updatedAt: new Date(),
			})
			.returning();

		return child[0];
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

	async getChildrenByFamily(familyId: string) {
		const children = await db.query.childrenTable.findMany({
			where: eq(childrenTable.familyId, familyId),
		});
		return children;
	}

	// Family management
	async createFamily(familyData: NewFamily) {
		const [family] = await db
			.insert(familiesTable)
			.values(familyData)
			.returning();
		return family;
	}

	async getFamilyById(familyId: string) {
		const family = await db.query.familiesTable.findFirst({
			where: eq(familiesTable.id, familyId),
		});
		return family;
	}

	async getFamiliesByOrganization(churchOrganizationId: string) {
		const families = await db.query.familiesTable.findMany({
			where: eq(familiesTable.churchOrganizationId, churchOrganizationId),
		});
		return families;
	}

	// User management (formerly Guardian management)
	async createUser(userData: NewUser) {
		const [user] = await db.insert(users).values(userData).returning();
		return user;
	}

	async getUserById(userId: string) {
		const user = await db.query.users.findFirst({
			where: eq(users.id, userId),
		});
		return user;
	}

	async getUsersByOrganization(churchOrganizationId: string) {
		const guardians = await db.query.users.findMany({
			where: eq(users.churchOrganizationId, churchOrganizationId),
		});
		return guardians;
	}

	async getUserByPhone(phone: string) {
		const user = await db.query.users.findFirst({
			where: eq(users.phone, phone),
		});
		return user;
	}

	// User-Family relationship management
	async linkUserToFamily(relationData: NewUserToFamily) {
		const [relation] = await db
			.insert(usersToFamiliesTable)
			.values(relationData)
			.returning();
		return relation;
	}

	async getUsersForFamily(familyId: string) {
		const relations = await db
			.select()
			.from(usersToFamiliesTable)
			.innerJoin(users, eq(usersToFamiliesTable.userId, users.id))
			.where(eq(usersToFamiliesTable.familyId, familyId))
			.then((res) => res.map((r) => r.users));

		return relations;
	}

	async getFamiliesForUser(userId: string) {
		const relations = await db
			.select()
			.from(usersToFamiliesTable)
			.innerJoin(
				familiesTable,
				eq(usersToFamiliesTable.familyId, familiesTable.id),
			)
			.where(eq(usersToFamiliesTable.userId, userId))
			.then((res) => res.map((r) => r.families));

		return relations;
	}

	// Room management (formerly Checkin session management)
	async createRoom(roomData: NewRoom) {
		const [room] = await db.insert(roomsTable).values(roomData).returning();
		return room;
	}

	async getActiveRooms(churchOrganizationId: string) {
		const rooms = await db.query.roomsTable.findMany({
			where: and(
				eq(roomsTable.churchOrganizationId, churchOrganizationId),
				eq(roomsTable.isActive, true),
			),
		});
		return rooms;
	}

	async updateRoomName(roomId: string, newName: string) {
		const [updatedRoom] = await db
			.update(roomsTable)
			.set({
				name: newName,
				updatedAt: new Date(),
			})
			.where(eq(roomsTable.id, roomId))
			.returning();
		return updatedRoom;
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

	async getActiveCheckins(roomId: string) {
		const checkins = await db
			.select()
			.from(childCheckinsTable)
			.innerJoin(
				childrenTable,
				eq(childCheckinsTable.childId, childrenTable.id),
			)
			.where(
				and(
					eq(childCheckinsTable.roomId, roomId),
					isNull(childCheckinsTable.checkoutTime),
				),
			);

		// Transform the joined results to match expected format
		const formattedCheckins = checkins.map((row) => ({
			...row.child_checkins,
			child: row.children,
		}));

		return formattedCheckins;
	}

	async getCheckedOutChildrenToday(roomId: string) {
		// Create start of today date
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const checkins = await db
			.select()
			.from(childCheckinsTable)
			.innerJoin(
				childrenTable,
				eq(childCheckinsTable.childId, childrenTable.id),
			)
			.where(
				and(
					eq(childCheckinsTable.roomId, roomId),
					eq(childCheckinsTable.status, "checked-out"),
					// Only get checkins from today
					sql`${childCheckinsTable.checkoutTime} >= ${today}`,
				),
			);

		// Transform the joined results to match expected format
		const formattedCheckins = checkins.map((row) => ({
			...row.child_checkins,
			child: row.children,
		}));

		return formattedCheckins;
	}

	async getActiveCheckinsCount(roomId: string) {
		const count = await db
			.select({ count: sql`count(*)` })
			.from(childCheckinsTable)
			.where(
				and(
					eq(childCheckinsTable.roomId, roomId),
					isNull(childCheckinsTable.checkoutTime),
				),
			);

		return Number(count[0]?.count || 0);
	}

	async getTotalActiveCheckinsForOrganization(churchOrganizationId: string) {
		// First get all active rooms for this organization
		const activeRooms = await this.getActiveRooms(churchOrganizationId);

		// If no active rooms, return 0
		if (activeRooms.length === 0) {
			return 0;
		}

		// Get the count of active check-ins across all rooms
		const count = await db
			.select({ count: sql`count(*)` })
			.from(childCheckinsTable)
			.innerJoin(roomsTable, eq(childCheckinsTable.roomId, roomsTable.id))
			.where(
				and(
					eq(roomsTable.churchOrganizationId, churchOrganizationId),
					eq(roomsTable.isActive, true),
					isNull(childCheckinsTable.checkoutTime),
				),
			);

		return Number(count[0]?.count || 0);
	}

	async getWeeklyChildrenCount(churchOrganizationId: string) {
		// Create date for 7 days ago
		const weekAgo = new Date();
		weekAgo.setDate(weekAgo.getDate() - 7);

		// Get all check-ins from the past week (unique children)
		const result = await db
			.select({
				uniqueChildrenCount: sql`COUNT(DISTINCT ${childCheckinsTable.childId})`,
			})
			.from(childCheckinsTable)
			.innerJoin(roomsTable, eq(childCheckinsTable.roomId, roomsTable.id))
			.where(
				and(
					eq(roomsTable.churchOrganizationId, churchOrganizationId),
					sql`${childCheckinsTable.checkinTime} >= ${weekAgo}`,
				),
			);

		return Number(result[0]?.uniqueChildrenCount || 0);
	}

	async checkoutChild(checkinId: string, userId: string) {
		const [updatedCheckin] = await db
			.update(childCheckinsTable)
			.set({
				checkoutTime: new Date(),
				checkedOutByUserId: userId,
				status: "checked-out",
				updatedAt: new Date(),
			})
			.where(eq(childCheckinsTable.id, checkinId))
			.returning();
		return updatedCheckin;
	}

	// Authorized pickup persons
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
		});
		return checkin;
	}

	// Family check-in helpers
	async findFamilyByPhone(phone: string, churchOrganizationId: string) {
		// Find user by phone
		const user = await this.getUserByPhone(phone);

		if (!user) {
			return null;
		}

		// Get families for this user
		const families = await this.getFamiliesForUser(user.id);

		// Filter families by church organization
		const orgFamilies = families.filter(
			(family) => family.churchOrganizationId === churchOrganizationId,
		);

		if (orgFamilies.length === 0) {
			return null;
		}

		// Return the first family (most users will only have one family per church)
		return {
			user,
			family: orgFamilies[0],
		};
	}

	async getFamilyWithChildrenAndGuardians(familyId: string) {
		const family = await this.getFamilyById(familyId);

		if (!family) {
			return null;
		}

		const children = await this.getChildrenByFamily(familyId);
		const guardians = await this.getUsersForFamily(familyId);

		return {
			family,
			children,
			guardians,
		};
	}
}

export const childCheckinService = new ChildCheckinService();
