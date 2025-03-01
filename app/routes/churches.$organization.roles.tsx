import {
	organizationRoles as rolesTable,
	users,
	usersToOrganizationRoles,
} from "@/server/db/schema";
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
import { Checkbox } from "~/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import {
	PERMISSIONS,
	getAllPermissions,
	getPermissionLabel,
} from "~/lib/permissions";
import { createAuthLoader } from "~/server/auth/authLoader";

import { db } from "@/server/db/dbConnection";
import { DeleteConfirm } from "~/src/components/confirm/DeleteConfirm";
import { Input } from "~/src/components/forms/input/Input";
import { PageLayout } from "~/src/components/layout/PageLayout";
import { MembersList } from "~/src/components/listItems/components/MembersList";

type RoleWithMembers = {
	role: typeof rolesTable.$inferSelect;
	members: Array<{
		userId: string;
		organizationRoleId: string;
		churchOrganizationId: string;
		user: typeof users.$inferSelect;
	}>;
};

export const loader = createAuthLoader(
	async ({ request, params, userContext }) => {
		const user = userContext?.user;

		// Initialize services
		const permissionsService = new PermissionsService();

		// Get permissions and roles data in parallel
		const [permissions, rolesList] = await Promise.all([
			permissionsService.getRolePermissions(user.id, params.organization),
			db
				.select({
					role: rolesTable,
					userId: usersToOrganizationRoles.userId,
					organizationRoleId: usersToOrganizationRoles.organizationRoleId,
					churchOrganizationId: usersToOrganizationRoles.churchOrganizationId,
					user: users,
				})
				.from(rolesTable)
				.where(eq(rolesTable.churchOrganizationId, params.organization))
				.leftJoin(
					usersToOrganizationRoles,
					eq(usersToOrganizationRoles.organizationRoleId, rolesTable.id),
				)
				.leftJoin(users, eq(usersToOrganizationRoles.userId, users.id)),
		]);

		// Check if admin role exists
		const adminRole = rolesList.find((r) => r.role.name === "Admin");

		// If admin role doesn't exist, create it and refetch the roles list
		if (!adminRole) {
			await db.insert(rolesTable).values({
				name: "Admin",
				description: "Full administrative control",
				permissions: getAllPermissions(),
				isDefault: false,
				isActive: true,
				churchOrganizationId: params.organization,
				updatedAt: new Date(),
			});

			// Refetch the roles list
			rolesList.length = 0;
			rolesList.push(
				...(await db
					.select({
						role: rolesTable,
						userId: usersToOrganizationRoles.userId,
						organizationRoleId: usersToOrganizationRoles.organizationRoleId,
						churchOrganizationId: usersToOrganizationRoles.churchOrganizationId,
						user: users,
					})
					.from(rolesTable)
					.where(eq(rolesTable.churchOrganizationId, params.organization))
					.leftJoin(
						usersToOrganizationRoles,
						eq(usersToOrganizationRoles.organizationRoleId, rolesTable.id),
					)
					.leftJoin(users, eq(usersToOrganizationRoles.userId, users.id))),
			);
		}

		// Group members by role
		const rolesWithMembers = rolesList.reduce((acc, curr) => {
			const existingRole = acc.find((r) => r.role.id === curr.role.id);
			if (existingRole) {
				if (curr.user) {
					existingRole.members.push({
						userId: curr.userId,
						organizationRoleId: curr.organizationRoleId,
						churchOrganizationId: curr.churchOrganizationId,
						user: curr.user,
					});
				}
				return acc;
			}
			acc.push({
				role: curr.role,
				members: curr.user
					? [
							{
								userId: curr.userId,
								organizationRoleId: curr.organizationRoleId,
								churchOrganizationId: curr.churchOrganizationId,
								user: curr.user,
							},
						]
					: [],
			});
			return acc;
		}, [] as RoleWithMembers[]);

		return {
			roles: rolesWithMembers,
			permissions,
		};
	},
	true,
);

export const action = async ({ request, params }) => {
	const formData = await request.formData();
	const action = formData.get("_action");

	if (action === "create") {
		const roleData = {
			name: formData.get("name"),
			description: formData.get("description"),
			permissions: formData.getAll("permissions"),
			isDefault: formData.get("isDefault") === "true",
			churchOrganizationId: params.organization,
			updatedAt: new Date(),
		};

		await db.insert(rolesTable).values(roleData);
		return { success: true, message: "Role created successfully" };
	}

	if (action === "update") {
		const roleId = formData.get("roleId");
		const role = await db
			.select()
			.from(rolesTable)
			.where(eq(rolesTable.id, roleId))
			.then((rows) => rows[0]);

		// Prevent modifying Admin role's permissions
		if (role.name === "Admin") {
			const roleData = {
				description: formData.get("description"),
				isDefault: formData.get("isDefault") === "true",
				churchOrganizationId: params.organization,
				updatedAt: new Date(),
			};
			await db
				.update(rolesTable)
				.set(roleData)
				.where(eq(rolesTable.id, roleId));
		} else {
			const roleData = {
				name: formData.get("name"),
				description: formData.get("description"),
				permissions: formData.getAll("permissions"),
				isDefault: formData.get("isDefault") === "true",
				churchOrganizationId: params.organization,
				updatedAt: new Date(),
			};
			await db
				.update(rolesTable)
				.set(roleData)
				.where(eq(rolesTable.id, roleId));
		}
		return { success: true, message: "Role updated successfully" };
	}

	if (action === "delete") {
		const roleId = formData.get("roleId");
		const role = await db
			.select()
			.from(rolesTable)
			.where(eq(rolesTable.id, roleId))
			.then((rows) => rows[0]);

		// Prevent deleting Admin role
		if (role.name === "Admin") {
			return { error: "Cannot delete the Admin role" };
		}

		await db.delete(rolesTable).where(eq(rolesTable.id, roleId));
		return { success: true, message: "Role deleted successfully" };
	}

	return { error: "Invalid action" };
};

export default function RolesList() {
	const { roles, permissions } = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();
	const navigate = useNavigate();
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [selectedRole, setSelectedRole] = useState<
		typeof rolesTable.$inferSelect | null
	>(null);
	const [showMembersList, setShowMembersList] = useState(false);
	const [selectedRoleForMembers, setSelectedRoleForMembers] =
		useState<RoleWithMembers | null>(null);
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		permissions: [] as string[],
		isDefault: false,
	});

	useEffect(() => {
		if (actionData?.success) {
			toast.success(actionData.message);
			setShowCreateModal(false);
			setShowDeleteConfirm(false);
			setSelectedRole(null);
			setFormData({
				name: "",
				description: "",
				permissions: [],
				isDefault: false,
			});
		}
	}, [actionData]);

	const handleEdit = (role: typeof rolesTable.$inferSelect) => {
		setSelectedRole(role);
		console.log("role", role);
		setFormData({
			name: role.name,
			description: role.description || "",
			permissions: (role.permissions as string[]) || [],
			isDefault: role.isDefault,
		});
		setShowCreateModal(true);
	};

	const handleShowMembers = (role: RoleWithMembers) => {
		setSelectedRoleForMembers(role);
		setShowMembersList(true);
	};

	return (
		<PageLayout
			title="Roles"
			actions={
				permissions.canAdd && (
					<Button onClick={() => setShowCreateModal(true)}>
						<PlusIcon className="h-4 w-4 mr-2" />
						Create Role
					</Button>
				)
			}
		>
			<div className="grid grid-cols-1 mt-4 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{roles.map((role) => (
					<Card key={role.role.id} className="p-4 rounded-lg space-y-4">
						<div className="flex items-start justify-between">
							<div>
								<h3 className="text-lg font-semibold flex items-center gap-2">
									{role.role.name}
									{role.role.isDefault && (
										<Badge variant="secondary">Default</Badge>
									)}
								</h3>
								{role.role.description && (
									<p className="text-sm text-gray-600 mt-1">
										{role.role.description}
									</p>
								)}
							</div>
							{permissions.canEdit && (
								<div className="flex gap-2">
									<Button
										variant="ghost"
										size="icon"
										onClick={() => handleEdit(role.role)}
									>
										<PencilIcon className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => {
											setSelectedRole(role.role);
											setShowDeleteConfirm(true);
										}}
									>
										<TrashIcon className="h-4 w-4" />
									</Button>
								</div>
							)}
						</div>
						<div className="flex flex-wrap gap-1">
							{(role.role.permissions as string[])?.map((permission) => (
								<Badge key={permission} variant="outline">
									{getPermissionLabel(permission)}
								</Badge>
							))}
						</div>
						<Button
							variant="ghost"
							className="flex items-center text-sm text-gray-500 hover:text-gray-700 w-full justify-start"
							onClick={() => handleShowMembers(role)}
						>
							<UsersIcon className="h-4 w-4 mr-1" />
							{role.members.length} members
						</Button>
					</Card>
				))}
			</div>

			<Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{selectedRole ? "Edit Role" : "Create New Role"}
						</DialogTitle>
					</DialogHeader>
					<form method="post" className="space-y-6">
						<input
							type="hidden"
							name="_action"
							value={selectedRole ? "update" : "create"}
						/>
						{selectedRole && (
							<input type="hidden" name="roleId" value={selectedRole.id} />
						)}
						<div className="space-y-4">
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
								<Label className="mb-2 block">Permissions</Label>
								<div className="space-y-6">
									{Object.entries(PERMISSIONS).map(([category, perms]) => (
										<div key={category} className="space-y-2">
											<h4 className="font-medium capitalize">{category}</h4>
											<div className="grid grid-cols-2 gap-2">
												{Object.entries(perms).map(([key, label]) => {
													const permissionId = `${category}.${key}`;
													return (
														<div
															key={permissionId}
															className="flex items-center space-x-2"
														>
															<Checkbox
																id={permissionId}
																name="permissions"
																value={permissionId}
																checked={formData.permissions.includes(
																	permissionId,
																)}
																onCheckedChange={(checked) => {
																	setFormData((prev) => ({
																		...prev,
																		permissions: checked
																			? [...prev.permissions, permissionId]
																			: prev.permissions.filter(
																					(p) => p !== permissionId,
																				),
																	}));
																}}
															/>
															<Label htmlFor={permissionId} className="text-sm">
																{label}
															</Label>
														</div>
													);
												})}
											</div>
										</div>
									))}
								</div>
							</div>
							<div className="flex items-center space-x-2">
								<Checkbox
									id="isDefault"
									name="isDefault"
									checked={formData.isDefault}
									onCheckedChange={(checked) => {
										setFormData((prev) => ({
											...prev,
											isDefault: checked as boolean,
										}));
									}}
								/>
								<Label htmlFor="isDefault">
									Assign this role to new members by default
								</Label>
							</div>
						</div>
						<DialogFooter>
							<Button type="submit">
								{selectedRole ? "Update Role" : "Create Role"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<DeleteConfirm
				open={showDeleteConfirm}
				onOpenChange={setShowDeleteConfirm}
				onConfirm={() => {
					if (!selectedRole) return;
					const formData = new FormData();
					formData.append("_action", "delete");
					formData.append("roleId", selectedRole.id);
					const submitForm = useSubmit();
					submitForm(formData, { method: "post" });
				}}
				title="Delete Role"
				description="Are you sure you want to delete this role? This action cannot be undone and will remove this role from all members who have it."
			/>

			<MembersList
				title={`${selectedRoleForMembers?.role.name || ""} Members`}
				members={
					selectedRoleForMembers?.members.map((member) => ({
						user: member.user,
						role: "Member", // or any other role information you want to display
					})) || []
				}
				open={showMembersList}
				onOpenChange={setShowMembersList}
			/>
		</PageLayout>
	);
}
