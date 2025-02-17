import {
	useNavigate,
	useLoaderData,
	useParams,
	useSubmit,
	useActionData,
} from "react-router";
import { db } from "~/server/dbConnection";
import {
	users,
	teams,
	usersToTeams,
	organizationRoles,
	usersToOrganizationRoles,
} from "server/db/schema";
import { eq } from "drizzle-orm";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "~/components/ui/sheet";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Badge } from "~/components/ui/badge";
import { Checkbox } from "~/components/ui/checkbox";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Route } from "../+types";

export const loader = async ({ params }: Route.LoaderArgs) => {
	const { organization, memberId } = params;
	if (!organization || !memberId)
		throw new Error("Missing required parameters");

	// Get member details
	const member = await db
		.select()
		.from(users)
		.where(eq(users.id, memberId))
		.then((rows) => rows[0]);

	if (!member) throw new Error("Member not found");

	// Get all teams for the organization
	const orgTeams = await db
		.select()
		.from(teams)
		.where(eq(teams.churchOrganizationId, organization));

	// Get member's current team assignments
	const memberTeams = await db
		.select()
		.from(usersToTeams)
		.where(eq(usersToTeams.userId, memberId));

	// Get all roles for the organization
	const orgRoles = await db
		.select()
		.from(organizationRoles)
		.where(eq(organizationRoles.churchOrganizationId, organization));

	// Get member's current role assignments
	const memberRoles = await db
		.select()
		.from(usersToOrganizationRoles)
		.where(eq(usersToOrganizationRoles.userId, memberId));

	return {
		member,
		teams: orgTeams,
		memberTeams: memberTeams.map((mt) => mt.teamId),
		roles: orgRoles,
		memberRoles: memberRoles.map((mr) => mr.organizationRoleId),
	};
};

export const action = async ({ request, params }: Route.ActionArgs) => {
	const { organization, memberId } = params;
	if (!organization || !memberId)
		throw new Error("Missing required parameters");

	const formData = await request.formData();
	const teamIds = formData.getAll("teams");
	const roleIds = formData.getAll("roles");

	// Begin transaction
	await db.transaction(async (tx) => {
		// Update team assignments
		await tx.delete(usersToTeams).where(eq(usersToTeams.userId, memberId));

		if (teamIds.length > 0) {
			await tx.insert(usersToTeams).values(
				teamIds.map((teamId) => ({
					userId: memberId,
					teamId: teamId as string,
					updatedAt: new Date(),
				})),
			);
		}

		// Update role assignments
		await tx
			.delete(usersToOrganizationRoles)
			.where(eq(usersToOrganizationRoles.userId, memberId));

		if (roleIds.length > 0) {
			await tx.insert(usersToOrganizationRoles).values(
				roleIds.map((roleId) => ({
					userId: memberId,
					organizationRoleId: roleId as string,
					churchOrganizationId: organization,
					updatedAt: new Date(),
				})),
			);
		}
	});

	return { success: true };
};

export default function AssignTeamsAndRoles() {
	const { member, teams, memberTeams, roles, memberRoles } =
		useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();
	const navigate = useNavigate();
	const params = useParams();
	const submit = useSubmit();
	const [selectedTeams, setSelectedTeams] = useState<string[]>(memberTeams);
	const [selectedRoles, setSelectedRoles] = useState<string[]>(memberRoles);
	const [isDirty, setIsDirty] = useState(false);

	useEffect(() => {
		setSelectedTeams(memberTeams);
		setSelectedRoles(memberRoles);
	}, [memberTeams, memberRoles]);

	useEffect(() => {
		if (actionData?.success) {
			toast.success("Changes saved successfully");
			navigate(`/churches/${params.organization}/members`);
		}
	}, [actionData, navigate, params.organization]);

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		submit(formData, { method: "post" });
	};

	const handleClose = () => {
		if (isDirty) {
			if (
				confirm("You have unsaved changes. Are you sure you want to close?")
			) {
				navigate(`/churches/${params.organization}/members`);
			}
		} else {
			navigate(`/churches/${params.organization}/members`);
		}
	};

	return (
		<Sheet open={true} onOpenChange={handleClose}>
			<SheetContent className="w-full sm:max-w-xl overflow-y-auto">
				<SheetHeader>
					<SheetTitle>
						Assign Teams & Roles - {member.firstName} {member.lastName}
					</SheetTitle>
				</SheetHeader>

				<form onSubmit={handleSubmit} className="space-y-6 mt-6">
					<div className="space-y-4">
						<div>
							<Label className="text-lg font-semibold">Teams</Label>
							<div className="mt-4 space-y-3">
								{teams.map((team) => (
									<div key={team.id} className="flex items-center space-x-2">
										<Checkbox
											id={`team-${team.id}`}
											name="teams"
											value={team.id}
											checked={selectedTeams.includes(team.id)}
											onCheckedChange={(checked) => {
												setIsDirty(true);
												setSelectedTeams((prev) =>
													checked
														? [...prev, team.id]
														: prev.filter((id) => id !== team.id),
												);
											}}
										/>
										<Label
											htmlFor={`team-${team.id}`}
											className="flex items-center"
										>
											{team.name}
											<Badge
												variant="secondary"
												className="ml-2"
												style={{ backgroundColor: team.color || undefined }}
											>
												{team.type}
											</Badge>
										</Label>
									</div>
								))}
							</div>
						</div>

						<Separator className="my-6" />

						<div>
							<Label className="text-lg font-semibold">Roles</Label>
							<div className="mt-4 space-y-3">
								{roles.map((role) => (
									<div key={role.id} className="flex items-center space-x-2">
										<Checkbox
											id={`role-${role.id}`}
											name="roles"
											value={role.id}
											checked={selectedRoles.includes(role.id)}
											onCheckedChange={(checked) => {
												setIsDirty(true);
												setSelectedRoles((prev) =>
													checked
														? [...prev, role.id]
														: prev.filter((id) => id !== role.id),
												);
											}}
										/>
										<Label
											htmlFor={`role-${role.id}`}
											className="flex flex-col"
										>
											<span>{role.name}</span>
											{role.description && (
												<span className="text-sm text-gray-500">
													{role.description}
												</span>
											)}
										</Label>
									</div>
								))}
							</div>
						</div>
					</div>

					<div className="flex justify-end gap-3 mt-6">
						<Button type="button" variant="outline" onClick={handleClose}>
							Cancel
						</Button>
						<Button type="submit" disabled={!isDirty}>
							Save Changes
						</Button>
					</div>
				</form>
			</SheetContent>
		</Sheet>
	);
}
