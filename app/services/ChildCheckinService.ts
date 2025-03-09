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

// Extend NewChild to include allergies and specialNotes for TypeScript
export interface ExtendedNewChild extends NewChild {
	allergies?: string;
	specialNotes?: string;
	familyId?: string;
}

// Define interface for the result of findFamilyByPhone
export interface FamilySearchResult {
	user: any;
	family: {
		id: string;
		name: string;
		churchOrganizationId: string;
		createdAt: Date;
		updatedAt: Date;
	};
}

export class ChildCheckinService {
	// Child management
	async createChild(childData: ExtendedNewChild) {
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
		const result = await db.insert(users).values(userData).returning();

		return result[0];
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
			// Join with users table to get the person who checked out the child
			.leftJoin(users, eq(childCheckinsTable.checkedOutByUserId, users.id))
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
			// Add information about who checked out the child
			checkedOutBy: row.users
				? {
						id: row.users.id,
						firstName: row.users.firstName,
						lastName: row.users.lastName,
					}
				: null,
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
		try {
			// First, check if the child is already checked out
			const existingCheckin = await db.query.childCheckinsTable.findFirst({
				where: eq(childCheckinsTable.id, checkinId),
			});

			if (!existingCheckin) {
				return { success: false, message: "Check-in record not found" };
			}

			if (existingCheckin.checkoutTime) {
				return {
					success: false,
					message: "Child is already checked out",
				};
			}

			// Update the checkin record
			const result = await db
				.update(childCheckinsTable)
				.set({
					// Use type assertion to work around the schema mismatch
					checkoutTime: new Date() as any,
					checkedOutByUserId: userId as any,
					status: "checked-out" as any,
					updatedAt: new Date(),
				})
				.where(eq(childCheckinsTable.id, checkinId))
				.returning();

			return {
				success: true,
				checkin: result[0],
			};
		} catch (error) {
			console.error("Error checking out child:", error);
			return { success: false, message: "Error checking out child" };
		}
	}

	// Method to change a child's room assignment
	async updateChildRoom(checkinId: string, newRoomId: string) {
		try {
			// Check if the check-in record exists and hasn't been checked out
			const existingCheckin = await db.query.childCheckinsTable.findFirst({
				where: eq(childCheckinsTable.id, checkinId),
			});

			if (!existingCheckin) {
				return { success: false, message: "Check-in record not found" };
			}

			if (existingCheckin.checkoutTime) {
				return {
					success: false,
					message: "Cannot move checked-out child to another room",
				};
			}

			// Update the room assignment
			const result = await db
				.update(childCheckinsTable)
				.set({
					roomId: newRoomId,
					updatedAt: new Date(),
				})
				.where(eq(childCheckinsTable.id, checkinId))
				.returning();

			return {
				success: true,
				checkin: result[0],
			};
		} catch (error) {
			console.error("Error updating child room:", error);
			return { success: false, message: "Error updating child room" };
		}
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
	async findFamilyByPhone(
		phone: string,
		churchOrganizationId: string,
	): Promise<FamilySearchResult | null> {
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

	async updateChild(childId: string, childData: Partial<ExtendedNewChild>) {
		const [updatedChild] = await db
			.update(childrenTable)
			.set({
				...childData,
				updatedAt: new Date(),
			})
			.where(eq(childrenTable.id, childId))
			.returning();
		return updatedChild;
	}

	async removeChild(childId: string) {
		// First check if there are any active check-ins for this child
		const activeCheckins = await db.query.childCheckinsTable.findMany({
			where: and(
				eq(childCheckinsTable.childId, childId),
				isNull(childCheckinsTable.checkoutTime),
			),
		});

		// If there are active check-ins, don't allow deletion
		if (activeCheckins.length > 0) {
			return {
				success: false,
				message: "Cannot remove a child with active check-ins",
			};
		}

		// Delete the child
		await db.delete(childrenTable).where(eq(childrenTable.id, childId));
		return { success: true };
	}

	async removeGuardian(userId: string, familyId: string) {
		// First check if this is the last guardian for the family
		const guardians = await this.getUsersForFamily(familyId);

		if (guardians.length <= 1) {
			return {
				success: false,
				message: "Cannot remove the last guardian from a family",
			};
		}

		// Remove the guardian from the family
		await db
			.delete(usersToFamiliesTable)
			.where(
				and(
					eq(usersToFamiliesTable.userId, userId),
					eq(usersToFamiliesTable.familyId, familyId),
				),
			);

		return { success: true };
	}

	async handlePhoneSearch(
		phone: string,
		organizationId: string,
	): Promise<{
		success: boolean;
		message?: string;
		family?: FamilySearchResult["family"];
	}> {
		try {
			// First try to find a user with this phone number
			const user = await this.getUserByPhone(phone);

			if (!user) {
				return {
					success: false,
					message: "No user found with this phone number",
				};
			}

			// Now get the families for this user
			const familyResult = await this.findFamilyByPhone(phone, organizationId);

			if (!familyResult) {
				return { success: false, message: "No family found for this user" };
			}

			// Return the family
			return { success: true, family: familyResult.family };
		} catch (error) {
			console.error("Error in handlePhoneSearch:", error);
			return { success: false, message: "Error searching for phone number" };
		}
	}

	// Check if a child is already checked in somewhere (doesn't have a checkout time)
	async isChildCheckedIn(childId: string) {
		const activeCheckin = await db.query.childCheckinsTable.findFirst({
			where: and(
				eq(childCheckinsTable.childId, childId),
				isNull(childCheckinsTable.checkoutTime),
			),
		});

		return !!activeCheckin;
	}

	// Get the active check-in with room information for a specific child
	async getActiveChildCheckin(childId: string) {
		const checkin = await db
			.select()
			.from(childCheckinsTable)
			.innerJoin(roomsTable, eq(childCheckinsTable.roomId, roomsTable.id))
			.where(
				and(
					eq(childCheckinsTable.childId, childId),
					isNull(childCheckinsTable.checkoutTime),
				),
			)
			.limit(1);

		if (!checkin || checkin.length === 0) {
			return null;
		}

		// Transform the joined results to match expected format
		return {
			...checkin[0].child_checkins,
			room: checkin[0].rooms,
		};
	}

	async processCheckin(
		childId: string,
		roomId: string,
		guardianId: string,
		organizationId: string,
	) {
		try {
			// First check if the child is already checked in
			const isAlreadyCheckedIn = await this.isChildCheckedIn(childId);

			if (isAlreadyCheckedIn) {
				return {
					success: false,
					message:
						"This child is already checked in. Please check them out first.",
				};
			}

			// Create the checkin record using type assertion to work around schema mismatch
			const checkin = await this.checkinChild({
				childId,
				roomId,
				checkinTime: new Date() as any,
				checkedInByUserId: guardianId as any,
				status: "checked-in" as any,
				secureId: crypto.randomUUID() as any,
				churchOrganizationId: organizationId,
				updatedAt: new Date(),
			});

			return { success: true, checkin };
		} catch (error) {
			console.error("Error in processCheckin:", error);
			return { success: false, message: "Error checking in child" };
		}
	}

	// Find the best room for a child based on age
	async findBestRoomForChild(
		childId: string,
		churchOrganizationId: string,
	): Promise<Room | null> {
		try {
			// First, get the child to determine their age
			const child = await db.query.childrenTable.findFirst({
				where: eq(childrenTable.id, childId),
			});

			if (!child || !child.dateOfBirth) {
				return null;
			}

			// Calculate age in months
			const dob = new Date(child.dateOfBirth);
			const today = new Date();
			const ageInMonths =
				(today.getFullYear() - dob.getFullYear()) * 12 +
				(today.getMonth() - dob.getMonth());

			// Get all active rooms for this organization
			const rooms = await this.getActiveRooms(churchOrganizationId);

			if (rooms.length === 0) {
				return null;
			}

			// First try to find a room with matching min and max age
			let bestRoom = rooms.find((room) => {
				// If both min and max age are specified
				if (room.minAge !== null && room.maxAge !== null) {
					return ageInMonths >= room.minAge && ageInMonths <= room.maxAge;
				}
				// If only min age is specified
				else if (room.minAge !== null && room.maxAge === null) {
					return ageInMonths >= room.minAge;
				}
				// If only max age is specified
				else if (room.minAge === null && room.maxAge !== null) {
					return ageInMonths <= room.maxAge;
				}
				return false;
			});

			// If we found an exact match, return it
			if (bestRoom) {
				return bestRoom;
			}

			// If no exact match, find a room with no age restrictions
			bestRoom = rooms.find(
				(room) => room.minAge === null && room.maxAge === null,
			);

			if (bestRoom) {
				return bestRoom;
			}

			// If all else fails, return the first room
			return rooms[0];
		} catch (error) {
			console.error("Error finding best room for child:", error);
			return null;
		}
	}
}

export const childCheckinService = new ChildCheckinService();
