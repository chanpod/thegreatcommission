import { TeamsDataService } from "@/server/dataServices/TeamsDataService";
import { teams as teamsTable, users } from "@/server/db/schema";
import { PermissionsService } from "@/server/services/PermissionsService";
import { eq } from "drizzle-orm";
import { PencilIcon, PlusIcon, TrashIcon, UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
	useActionData,
	useLoaderData,
	useNavigate,
	useSubmit,
} from "react-router";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { createAuthLoader } from "~/server/auth/authLoader";
import { db } from "@/server/db/dbConnection";
import { DeleteConfirm } from "~/src/components/confirm/DeleteConfirm";
import { Input } from "~/src/components/forms/input/Input";
import { PageLayout } from "~/src/components/layout/PageLayout";
import { MembersList } from "~/src/components/listItems/components/MembersList";
import { PeopleNavigation } from "~/components/PeopleNavigation";

type TeamWithMembers = {
	team: typeof teamsTable.$inferSelect;
	members: Array<{
		user: typeof users.$inferSelect;
		role: string;
	}>;
};

export const loader = createAuthLoader(
	async ({ request, params, userContext }) => {
		const user = userContext?.user;

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
	},
	true,
);

export const action = createAuthLoader(
	async ({ request, params, userContext }) => {
		const formData = await request.formData();
		const action = formData.get("_action");
		const user = userContext.user;

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

			await db
				.update(teamsTable)
				.set(teamData)
				.where(eq(teamsTable.id, teamId));
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
	},
	true,
);

const TEAM_TYPES = [
	"ministry",
	"missions",
	"worship",
	"youth",
	"children",
	"admin",
	"other",
];

interface TeamCardProps {
	team: TeamWithMembers;
	permissions: {
		canEdit: boolean;
	};
	onEdit: (team: typeof teamsTable.$inferSelect) => void;
	onDelete: (team: typeof teamsTable.$inferSelect) => void;
	onMembersClick: (teamId: string) => void;
}

function TeamCard({
	team,
	permissions,
	onEdit,
	onDelete,
	onMembersClick,
}: TeamCardProps) {
	return (
		<Card className="p-4 space-y-4 shadow-xl">
			<div className="flex items-start justify-between">
				<div>
					<h3 className="text-lg font-semibold text-foreground">
						{team.team.name}
					</h3>
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
							onClick={() => onEdit(team.team)}
						>
							<PencilIcon className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => onDelete(team.team)}
						>
							<TrashIcon className="h-4 w-4" />
						</Button>
					</div>
				)}
			</div>
			{team.team.description && (
				<p className="text-foreground/90">{team.team.description}</p>
			)}
			<Button
				variant="ghost"
				className="flex items-center text-foreground/90 hover:text-foreground"
				onClick={() => onMembersClick(team.team.id)}
			>
				<UsersIcon className="h-4 w-4 mr-1" />
				{team.members.length} members
			</Button>
		</Card>
	);
}

export default function TeamsPage() {
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
			title="Organization Teams"
			description="Manage your organization's teams"
			actions={
				permissions.canAdd && (
					<Button
						onClick={() => setShowCreateModal(true)}
						className="flex items-center gap-2"
					>
						<PlusIcon className="h-4 w-4" />
						Create Team
					</Button>
				)
			}
		>
			<PeopleNavigation />

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{teams.map((team) => (
					<TeamCard
						key={team.team.id}
						team={team}
						permissions={permissions}
						onEdit={handleEdit}
						onDelete={(team) => {
							setEditingTeam(team);
							setShowDeleteConfirm(true);
						}}
						onMembersClick={setSelectedTeamId}
					/>
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
