import { eq } from "drizzle-orm";
import { teams, usersToTeams, users } from "../db/schema";
import type { DatabaseClient } from "./types";
import { DefaultDatabaseClient } from "./DefaultDatabaseClient";

export class TeamsDataService {
	constructor(
		private readonly dbClient: DatabaseClient | undefined = undefined,
	) {
		this.dbClient = dbClient || new DefaultDatabaseClient();
	}

	/**
	 * Get all teams for an organization, optionally including member data
	 */
	async getOrganizationTeams(
		organizationId: string,
		includeMembers: boolean = true,
	) {
		if (!includeMembers) {
			return this.dbClient.db
				.select()
				.from(teams)
				.where(eq(teams.churchOrganizationId, organizationId));
		}

		const teamsWithMembers = await this.dbClient.db
			.select({
				team: teams,
				userId: usersToTeams.userId,
				role: usersToTeams.role,
				user: users,
			})
			.from(teams)
			.where(eq(teams.churchOrganizationId, organizationId))
			.leftJoin(usersToTeams, eq(usersToTeams.teamId, teams.id))
			.leftJoin(users, eq(users.id, usersToTeams.userId));

		// Group members by team
		return teamsWithMembers.reduce(
			(acc, curr) => {
				const existingTeam = acc.find((t) => t.team.id === curr.team.id);
				if (existingTeam) {
					if (curr.user) {
						existingTeam.members.push({
							user: curr.user,
							role: curr.role,
						});
					}
					return acc;
				}
				acc.push({
					team: curr.team,
					members: curr.user
						? [
								{
									user: curr.user,
									role: curr.role,
								},
							]
						: [],
				});
				return acc;
			},
			[] as Array<{
				team: typeof teams.$inferSelect;
				members: Array<{
					user: typeof users.$inferSelect;
					role: string;
				}>;
			}>,
		);
	}

	/**
	 * Get a single team by ID, optionally including member data
	 */
	async getTeam(teamId: string, includeMembers: boolean = true) {
		if (!includeMembers) {
			return this.dbClient.db
				.select()
				.from(teams)
				.where(eq(teams.id, teamId))
				.then((rows) => rows[0]);
		}

		const teamWithMembers = await this.dbClient.db
			.select({
				team: teams,
				userId: usersToTeams.userId,
				role: usersToTeams.role,
				user: users,
			})
			.from(teams)
			.where(eq(teams.id, teamId))
			.leftJoin(usersToTeams, eq(usersToTeams.teamId, teams.id))
			.leftJoin(users, eq(users.id, usersToTeams.userId));

		if (!teamWithMembers.length) return null;

		return {
			team: teamWithMembers[0].team,
			members: teamWithMembers
				.filter((row) => row.user)
				.map((row) => ({
					user: row.user,
					role: row.role,
				})),
		};
	}

	/**
	 * Get all teams a user is a member of in an organization
	 */
	async getUserTeams(userId: string, organizationId: string) {
		return this.dbClient.db
			.select({
				team: teams,
				role: usersToTeams.role,
			})
			.from(usersToTeams)
			.innerJoin(teams, eq(teams.id, usersToTeams.teamId))
			.where(eq(usersToTeams.userId, userId))
			.where(eq(teams.churchOrganizationId, organizationId));
	}

	/**
	 * Add a member to a team
	 */
	async addMember(teamId: string, userId: string, role: string = "member") {
		return this.dbClient.db.insert(usersToTeams).values({
			teamId,
			userId,
			role,
			updatedAt: new Date(),
		});
	}

	/**
	 * Remove a member from a team
	 */
	async removeMember(teamId: string, userId: string) {
		return this.dbClient.db
			.delete(usersToTeams)
			.where(eq(usersToTeams.teamId, teamId))
			.where(eq(usersToTeams.userId, userId));
	}

	/**
	 * Update a team member's role
	 */
	async updateMemberRole(teamId: string, userId: string, role: string) {
		return this.dbClient.db
			.update(usersToTeams)
			.set({ role, updatedAt: new Date() })
			.where(eq(usersToTeams.teamId, teamId))
			.where(eq(usersToTeams.userId, userId));
	}

	/**
	 * Create a new team
	 */
	async createTeam(data: {
		name: string;
		description?: string;
		type: string;
		color?: string;
		churchOrganizationId: string;
	}) {
		return this.dbClient.db
			.insert(teams)
			.values({
				...data,
				updatedAt: new Date(),
				isActive: true,
			})
			.returning();
	}

	/**
	 * Update a team
	 */
	async updateTeam(
		teamId: string,
		data: Partial<{
			name: string;
			description: string;
			type: string;
			color: string;
			isActive: boolean;
		}>,
	) {
		return this.dbClient.db
			.update(teams)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(teams.id, teamId))
			.returning();
	}

	/**
	 * Delete a team
	 */
	async deleteTeam(teamId: string) {
		return this.dbClient.db.delete(teams).where(eq(teams.id, teamId));
	}
}
