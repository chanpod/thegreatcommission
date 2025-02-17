import { teams as teamsTable, usersToTeams, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import {
	useActionData,
	useFetcher,
	useLoaderData,
	useNavigate,
	useSubmit,
} from "react-router";
import { db } from "~/server/dbConnection";
import { PageLayout } from "~/src/components/layout/PageLayout";
import { Button } from "~/components/ui/button";
import { PlusIcon, UsersIcon, PencilIcon, TrashIcon } from "lucide-react";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { Input } from "~/src/components/forms/input/Input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { DeleteConfirm } from "~/src/components/confirm/DeleteConfirm";
import { MembersList } from "~/src/components/listItems/components/MembersList";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { PermissionsService } from "@/server/services/PermissionsService";
import { TeamsDataService } from "@/server/dataServices/TeamsDataService";

type TeamWithMembers = {
	team: typeof teamsTable.$inferSelect;
	members: Array<{
		user: typeof users.$inferSelect;
		role: string;
	}>;
};

export const loader = async ({ request, params }) => {
	const user = await authenticator.isAuthenticated(request);
	if (!user) {
		throw new Error("Not authenticated");
	}

	// Initialize services
	const permissionsService = new PermissionsService();
	const teamsService = new TeamsDataService();

	// Get permissions and team data in parallel
	const [permissions, teams] = await Promise.all([
		permissionsService.getTeamPermissions(user.id, params.organization),
		teamsService.getOrganizationTeams(params.organization),
	]);

	console.log(teams);

	return {
		teams,
		permissions,
	};
};

export const action = async ({ request, params }) => {
	const formData = await request.formData();
	const action = formData.get("_action");
	const user = await authenticator.isAuthenticated(request);
	if (!user) {
		throw new Error("Not authenticated");
	}
	const permissionsService = new PermissionsService();
	const permissions = await permissionsService.getTeamPermissions(
		user.id,
		params.organization,
	);

	if (action === "create") {
		if (!permissions.canAdd) {
			return { error: "You are not authorized to create teams" };
		}
		const teamData = {
			name: formData.get("name"),
			description: formData.get("description"),
			type: formData.get("type"),
			color: formData.get("color"),
			churchOrganizationId: params.organization,
			updatedAt: new Date(),
		};

		await db.insert(teamsTable).values(teamData);
		return { success: true, message: "Team created successfully" };
	}

	if (action === "update") {
		if (!permissions.canEdit) {
			return { error: "You are not authorized to update teams" };
		}
		const teamId = formData.get("teamId");
		const teamData = {
			name: formData.get("name"),
			description: formData.get("description"),
			type: formData.get("type"),
			color: formData.get("color"),
			churchOrganizationId: params.organization,
			updatedAt: new Date(),
		};

		await db.update(teamsTable).set(teamData).where(eq(teamsTable.id, teamId));
		return { success: true, message: "Team updated successfully" };
	}

	if (action === "delete") {
		if (!permissions.canDelete) {
			return { error: "You are not authorized to delete teams" };
		}
		const teamId = formData.get("teamId");
		await db.delete(teamsTable).where(eq(teamsTable.id, teamId));
		return { success: true, message: "Team deleted successfully" };
	}

	return { error: "Invalid action" };
};

const TEAM_TYPES = [
	"ministry",
	"missions",
	"worship",
	"youth",
	"children",
	"admin",
	"other",
];

export default function TeamsList() {
	const { teams, permissions } = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();
	const navigate = useNavigate();
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [editingTeam, setEditingTeam] = useState<
		typeof teamsTable.$inferSelect | null
	>(null);
	const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		type: "",
		color: "#666666",
	});

	const selectedTeamWithMembers = teams.find(
		(t) => t.team.id === selectedTeamId,
	);
	useEffect(() => {
		if (actionData?.success) {
			toast.success(actionData.message);
			setShowCreateModal(false);
			setShowDeleteConfirm(false);
			setEditingTeam(null);
			setFormData({
				name: "",
				description: "",
				type: "",
				color: "#666666",
			});
		}
	}, [actionData]);

	const handleEdit = (team: typeof teamsTable.$inferSelect) => {
		setEditingTeam(team);
		setFormData({
			name: team.name,
			description: team.description || "",
			type: team.type,
			color: team.color || "#666666",
		});
		setShowCreateModal(true);
	};

	return (
		<PageLayout
			title="Teams"
			actions={
				permissions.canAdd && (
					<Button onClick={() => setShowCreateModal(true)}>
						<PlusIcon className="h-4 w-4 mr-2" />
						Create Team
					</Button>
				)
			}
		>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{teams.map((team) => (
					<Card key={team.team.id} className="p-4 space-y-4">
						<div className="flex items-start justify-between">
							<div>
								<h3 className="text-lg font-semibold">{team.team.name}</h3>
								<Badge
									style={{ backgroundColor: team.team.color || "#666" }}
									className="mt-1"
								>
									{team.team.type}
								</Badge>
							</div>
							{permissions.canEdit && (
								<div className="flex gap-2">
									<Button
										variant="ghost"
										size="icon"
										onClick={() => handleEdit(team.team)}
									>
										<PencilIcon className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => {
											setEditingTeam(team.team);
											setShowDeleteConfirm(true);
										}}
									>
										<TrashIcon className="h-4 w-4" />
									</Button>
								</div>
							)}
						</div>
						{team.team.description && (
							<p className="text-sm text-gray-600">{team.team.description}</p>
						)}
						<Button
							variant="ghost"
							className="flex items-center text-sm text-gray-500 hover:text-gray-700"
							onClick={() => setSelectedTeamId(team.team.id)}
						>
							<UsersIcon className="h-4 w-4 mr-1" />
							{team.members.length} members
						</Button>
					</Card>
				))}
			</div>

			<Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingTeam ? "Edit Team" : "Create New Team"}
						</DialogTitle>
					</DialogHeader>
					<form method="post" className="space-y-4">
						<input
							type="hidden"
							name="_action"
							value={editingTeam ? "update" : "create"}
						/>
						{editingTeam && (
							<input type="hidden" name="teamId" value={editingTeam.id} />
						)}
						<div>
							<Label>Name</Label>
							<Input
								name="name"
								value={formData.name}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, name: e.target.value }))
								}
								aria-required="true"
							/>
						</div>
						<div>
							<Label>Description</Label>
							<Input
								name="description"
								value={formData.description}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										description: e.target.value,
									}))
								}
							/>
						</div>
						<div>
							<Label>Type</Label>
							<Select
								name="type"
								value={formData.type}
								onValueChange={(value) =>
									setFormData((prev) => ({ ...prev, type: value }))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select team type" />
								</SelectTrigger>
								<SelectContent>
									{TEAM_TYPES.map((type) => (
										<SelectItem key={type} value={type}>
											{type.charAt(0).toUpperCase() + type.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>Color</Label>
							<Input
								type="color"
								name="color"
								value={formData.color}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, color: e.target.value }))
								}
							/>
						</div>
						<DialogFooter>
							<Button type="submit">
								{editingTeam ? "Update Team" : "Create Team"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<DeleteConfirm
				open={showDeleteConfirm}
				onOpenChange={setShowDeleteConfirm}
				onConfirm={() => {
					if (!editingTeam) return;
					const formData = new FormData();
					formData.append("_action", "delete");
					formData.append("teamId", editingTeam.id);
					const submitForm = useSubmit();
					submitForm(formData, { method: "post" });
				}}
				title="Delete Team"
				description="Are you sure you want to delete this team? This action cannot be undone."
			/>

			<MembersList
				title={`${selectedTeamWithMembers?.team.name || ""} Members`}
				members={selectedTeamWithMembers?.members || []}
				open={!!selectedTeamId}
				onOpenChange={(open) => !open && setSelectedTeamId(null)}
			/>
		</PageLayout>
	);
}
