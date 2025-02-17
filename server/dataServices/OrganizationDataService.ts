import { eq, inArray } from "drizzle-orm";
import {
	churchOrganization,
	userPreferences,
	users,
	usersTochurchOrganization,
	usersToOrganizationRoles,
	usersToTeams,
} from "../db/schema";
import type { DatabaseClient } from "./types";
import { DefaultDatabaseClient } from "./DefaultDatabaseClient";

export class OrganizationDataService {
	constructor(private readonly dbClient: DatabaseClient = undefined) {
		this.dbClient = dbClient || new DefaultDatabaseClient();
	}

	/**
	 * Get an organization by ID
	 */
	async getOrganization(organizationId: string) {
		return this.dbClient.db
			.select()
			.from(churchOrganization)
			.where(eq(churchOrganization.id, organizationId))
			.then((res) => res[0]);
	}

	/**
	 * Get all organizations a user is a member of
	 */
	async getUserOrganizations(userId: string) {
		return this.dbClient.db
			.select({
				organization: churchOrganization,
				isAdmin: usersTochurchOrganization.isAdmin,
			})
			.from(usersTochurchOrganization)
			.innerJoin(
				churchOrganization,
				eq(
					churchOrganization.id,
					usersTochurchOrganization.churchOrganizationId,
				),
			)
			.where(eq(usersTochurchOrganization.userId, userId));
	}

	/**
	 * Check if a user is a member of an organization
	 */
	async isUserMember(userId: string, organizationId: string) {
		const membership = await this.dbClient.db
			.select()
			.from(usersTochurchOrganization)
			.where(eq(usersTochurchOrganization.userId, userId))
			.where(eq(usersTochurchOrganization.churchOrganizationId, organizationId))
			.then((res) => res[0]);

		return !!membership;
	}

	/**
	 * Check if a user is an admin of an organization
	 */
	async isUserAdmin(userId: string, organizationId: string) {
		const membership = await this.dbClient.db
			.select()
			.from(usersTochurchOrganization)
			.where(eq(usersTochurchOrganization.userId, userId))
			.where(eq(usersTochurchOrganization.churchOrganizationId, organizationId))
			.then((res) => res[0]);

		return membership?.isAdmin ?? false;
	}

	/**
	 * Get all members of an organization
	 */
	async getOrganizationMembers(organizationId: string) {
		const members = await this.dbClient.db
			.select({
				user: users,
				isAdmin: usersTochurchOrganization.isAdmin,
				preferences: userPreferences,
			})
			.from(usersTochurchOrganization)
			.where(eq(usersTochurchOrganization.churchOrganizationId, organizationId))
			.innerJoin(users, eq(users.id, usersTochurchOrganization.userId))
			.leftJoin(userPreferences, eq(userPreferences.userId, users.id));

		const teamsAndRoles = await this.dbClient.db
			.select({
				userId: users.id,
				teams: usersToTeams,
				roles: usersToOrganizationRoles,
			})
			.from(users)
			.where(
				inArray(
					users.id,
					members.map((m) => m.user.id),
				),
			)
			.leftJoin(usersToTeams, eq(users.id, usersToTeams.userId))
			.leftJoin(
				usersToOrganizationRoles,
				eq(users.id, usersToOrganizationRoles.userId),
			);

		const userTeamsAndRoles = teamsAndRoles.reduce(
			(acc, curr) => {
				if (!acc[curr.userId]) {
					acc[curr.userId] = { teams: [], roles: [] };
				}
				if (curr.teams) acc[curr.userId].teams.push(curr.teams);
				if (curr.roles) acc[curr.userId].roles.push(curr.roles);
				return acc;
			},
			{} as Record<string, { teams: any[]; roles: any[] }>,
		);

		return members.map((member) => ({
			...member,
			teams: userTeamsAndRoles[member.user.id]?.teams || [],
			roles: userTeamsAndRoles[member.user.id]?.roles || [],
		}));
	}

	/**
	 * Add a user to an organization
	 */
	async addMember(
		userId: string,
		organizationId: string,
		isAdmin: boolean = false,
	) {
		return this.dbClient.db.insert(usersTochurchOrganization).values({
			userId,
			churchOrganizationId: organizationId,
			isAdmin,
		});
	}

	/**
	 * Remove a user from an organization
	 */
	async removeMember(userId: string, organizationId: string) {
		return this.dbClient.db
			.delete(usersTochurchOrganization)
			.where(eq(usersTochurchOrganization.userId, userId))
			.where(
				eq(usersTochurchOrganization.churchOrganizationId, organizationId),
			);
	}

	/**
	 * Update a user's admin status in an organization
	 */
	async updateMemberAdminStatus(
		userId: string,
		organizationId: string,
		isAdmin: boolean,
	) {
		return this.dbClient.db
			.update(usersTochurchOrganization)
			.set({ isAdmin })
			.where(eq(usersTochurchOrganization.userId, userId))
			.where(
				eq(usersTochurchOrganization.churchOrganizationId, organizationId),
			);
	}
}
