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
	type Permission,
} from "~/lib/permissions";
import { createAuthLoader } from "~/server/auth/authLoader";

import { db } from "@/server/db/dbConnection";
import { DeleteConfirm } from "~/src/components/confirm/DeleteConfirm";
import { Input } from "~/src/components/forms/input/Input";
import { PageLayout } from "~/src/components/layout/PageLayout";
import { MembersList } from "~/src/components/listItems/components/MembersList";
import { PeopleNavigation } from "~/components/PeopleNavigation";
import {
	PERMISSION_GROUPS,
	getPermissionsFromGroups,
	getSelectedGroups,
	type PermissionGroupKey,
} from "~/lib/permissionGroups";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "~/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
	ROLE_TEMPLATES,
	getTemplateById,
	type RoleTemplate,
} from "~/lib/roleTemplates";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";

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

		// Group roles by role ID
		const rolesMap = new Map<string, RoleWithMembers>();

		for (const item of rolesList) {
			if (!rolesMap.has(item.role.id)) {
				rolesMap.set(item.role.id, {
					role: item.role,
					members: [],
				});
			}

			if (item.userId) {
				rolesMap.get(item.role.id)?.members.push({
					userId: item.userId,
					organizationRoleId: item.organizationRoleId,
					churchOrganizationId: item.churchOrganizationId,
					user: item.user,
				});
			}
		}

		// Convert map to array
		const roles = Array.from(rolesMap.values());

		return {
			roles,
			permissions,
		};
	},
	true,
);

export const action = async ({ request, params }) => {
	if (request.method !== "POST") {
		return { error: "Method not allowed" };
	}

	const formData = await request.formData();
	const action = formData.get("_action");

	if (action === "create") {
		const name = formData.get("name");
		const description = formData.get("description");
		const permissions = formData.getAll("permissions");
		const isDefault = formData.get("isDefault") === "on";

		if (!name) {
			return { error: "Name is required" };
		}

		const role = await db
			.insert(rolesTable)
			.values({
				name: name.toString(),
				description: description?.toString() || "",
				permissions: permissions.map((p) => p.toString()),
				isDefault,
				isActive: true,
				churchOrganizationId: params.organization,
				updatedAt: new Date(),
			})
			.returning();

		return { success: true, message: "Role created successfully", role };
	}

	if (action === "update") {
		const roleId = formData.get("roleId");
		const name = formData.get("name");
		const description = formData.get("description");
		const permissions = formData.getAll("permissions");
		const isDefault = formData.get("isDefault") === "on";

		if (!roleId || !name) {
			return { error: "Role ID and name are required" };
		}

		const role = await db
			.update(rolesTable)
			.set({
				name: name.toString(),
				description: description?.toString() || "",
				permissions: permissions.map((p) => p.toString()),
				isDefault,
				updatedAt: new Date(),
			})
			.where(eq(rolesTable.id, roleId.toString()))
			.returning();

		return { success: true, message: "Role updated successfully", role };
	}

	if (action === "delete") {
		const roleId = formData.get("roleId");

		if (!roleId) {
			return { error: "Role ID is required" };
		}

		await db.delete(rolesTable).where(eq(rolesTable.id, roleId.toString()));

		return { success: true, message: "Role deleted successfully" };
	}

	return { error: "Invalid action" };
};

// Helper function to get a summary of permissions for display
const getPermissionSummary = (permissions: string[]) => {
	// Get the permission groups that are fully satisfied by these permissions
	const groups = getSelectedGroups(permissions as Permission[]);

	if (groups.length === 0) {
		return permissions.length > 0
			? `${permissions.length} individual permissions`
			: "No permissions";
	}

	// Group by category
	const categories = new Set(groups.map((g) => g.split(" - ")[0]));
	const summary = Array.from(categories).map((category) => {
		const categoryGroups = groups.filter((g) => g.startsWith(category));
		const accessLevel = categoryGroups.some((g) => g.includes("Edit"))
			? "Manage"
			: categoryGroups.some((g) => g.includes("View"))
				? "View"
				: "";

		return accessLevel ? `${category} (${accessLevel})` : category;
	});

	return summary.join(", ");
};

export default function RolesPage() {
	const { roles, permissions } = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();
	const navigate = useNavigate();
	const submit = useSubmit();
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
		permissions: [] as Permission[],
		isDefault: false,
	});
	const [selectedGroups, setSelectedGroups] = useState<PermissionGroupKey[]>(
		[],
	);
	const [permissionView, setPermissionView] = useState<"simple" | "advanced">(
		"simple",
	);
	const [selectedTemplate, setSelectedTemplate] = useState<string>("custom");

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
			setSelectedGroups([]);
			setSelectedTemplate("custom");
		}
	}, [actionData]);

	useEffect(() => {
		// When editing a role, determine which permission groups are selected
		if (formData.permissions.length > 0) {
			setSelectedGroups(
				getSelectedGroups(formData.permissions as Permission[]),
			);
		}
	}, [formData.permissions]);

	const handleEdit = (role: typeof rolesTable.$inferSelect) => {
		setSelectedRole(role);
		setFormData({
			name: role.name,
			description: role.description || "",
			permissions: role.permissions as string[] as Permission[],
			isDefault: role.isDefault,
		});
		setSelectedTemplate("custom"); // Default to custom when editing
		setShowCreateModal(true);
	};

	const handleShowMembers = (role: RoleWithMembers) => {
		setSelectedRoleForMembers(role);
		setShowMembersList(true);
	};

	const handleGroupChange = (group: PermissionGroupKey, checked: boolean) => {
		// Update selected groups
		const newSelectedGroups = checked
			? [...selectedGroups, group]
			: selectedGroups.filter((g) => g !== group);

		setSelectedGroups(newSelectedGroups);

		// Update permissions based on selected groups
		const newPermissions = getPermissionsFromGroups(newSelectedGroups);
		setFormData((prev) => ({
			...prev,
			permissions: newPermissions,
		}));

		// If groups are manually changed, set template to custom
		setSelectedTemplate("custom");
	};

	const handleTemplateChange = (templateId: string) => {
		setSelectedTemplate(templateId);

		const template = getTemplateById(templateId);
		if (!template) return;

		if (templateId === "custom") {
			// Don't change anything for custom template
			return;
		}

		// Apply template settings
		const newGroups = [...template.permissionGroups];
		setSelectedGroups(newGroups);

		// Update permissions based on selected groups
		const newPermissions = getPermissionsFromGroups(newGroups);

		// Update form data
		setFormData((prev) => ({
			...prev,
			name: selectedRole ? prev.name : template.name,
			description: selectedRole ? prev.description : template.description,
			permissions: newPermissions,
			isDefault: template.isDefault || false,
		}));
	};

	const handleDelete = () => {
		if (!selectedRole) return;
		const formData = new FormData();
		formData.append("_action", "delete");
		formData.append("roleId", selectedRole.id);
		submit(formData, { method: "post" });
	};

	return (
		<PageLayout
			title="Organization Roles"
			description="Manage your organization's roles and permissions"
			actions={
				permissions.canAdd && (
					<Button
						onClick={() => setShowCreateModal(true)}
						className="flex items-center gap-2"
					>
						<PlusIcon className="h-4 w-4" />
						Create Role
					</Button>
				)
			}
		>
			<PeopleNavigation />

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{roles.map((role) => (
					<Card
						key={role.role.id}
						className="p-4 rounded-lg space-y-4 shadow-xl"
					>
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

						<div className="text-sm text-gray-600">
							<p className="font-medium mb-1">Access:</p>
							<p>{getPermissionSummary(role.role.permissions as string[])}</p>
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
				<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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

						{!selectedRole && (
							<div className="space-y-2">
								<Label>Role Template</Label>
								<Select
									value={selectedTemplate}
									onValueChange={handleTemplateChange}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select a template" />
									</SelectTrigger>
									<SelectContent>
										{ROLE_TEMPLATES.map((template) => (
											<SelectItem key={template.id} value={template.id}>
												{template.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{selectedTemplate !== "custom" && (
									<p className="text-sm text-muted-foreground">
										{getTemplateById(selectedTemplate)?.description}
									</p>
								)}
							</div>
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
								<div className="flex justify-between items-center mb-4">
									<Label className="text-lg">Permissions</Label>
									<Tabs
										value={permissionView}
										onValueChange={(v) =>
											setPermissionView(v as "simple" | "advanced")
										}
									>
										<TabsList>
											<TabsTrigger value="simple">Simple View</TabsTrigger>
											<TabsTrigger value="advanced">Advanced View</TabsTrigger>
										</TabsList>
									</Tabs>
								</div>

								<Tabs value={permissionView} className="mt-0">
									<TabsContent value="simple">
										<div className="space-y-4 border rounded-md p-4">
											<p className="text-sm text-muted-foreground">
												Select permission groups to grant access to different
												areas of the application.
											</p>

											<Accordion type="multiple" className="w-full">
												{/* People Management */}
												<AccordionItem value="people">
													<AccordionTrigger className="text-md font-medium">
														People Management
													</AccordionTrigger>
													<AccordionContent>
														<div className="space-y-3 pl-2">
															{Object.entries(PERMISSION_GROUPS)
																.filter(([key]) => key.startsWith("People"))
																.map(([key, group]) => (
																	<div
																		key={key}
																		className="flex items-start space-x-3 p-2 rounded hover:bg-muted"
																	>
																		<Checkbox
																			id={key}
																			checked={selectedGroups.includes(
																				key as PermissionGroupKey,
																			)}
																			onCheckedChange={(checked) =>
																				handleGroupChange(
																					key as PermissionGroupKey,
																					!!checked,
																				)
																			}
																		/>
																		<div>
																			<Label
																				htmlFor={key}
																				className="font-medium"
																			>
																				{group.label}
																			</Label>
																			<p className="text-sm text-muted-foreground">
																				{group.description}
																			</p>
																		</div>
																	</div>
																))}
														</div>
													</AccordionContent>
												</AccordionItem>

												{/* Events Management */}
												<AccordionItem value="events">
													<AccordionTrigger className="text-md font-medium">
														Events Management
													</AccordionTrigger>
													<AccordionContent>
														<div className="space-y-3 pl-2">
															{Object.entries(PERMISSION_GROUPS)
																.filter(([key]) => key.startsWith("Events"))
																.map(([key, group]) => (
																	<div
																		key={key}
																		className="flex items-start space-x-3 p-2 rounded hover:bg-muted"
																	>
																		<Checkbox
																			id={key}
																			checked={selectedGroups.includes(
																				key as PermissionGroupKey,
																			)}
																			onCheckedChange={(checked) =>
																				handleGroupChange(
																					key as PermissionGroupKey,
																					!!checked,
																				)
																			}
																		/>
																		<div>
																			<Label
																				htmlFor={key}
																				className="font-medium"
																			>
																				{group.label}
																			</Label>
																			<p className="text-sm text-muted-foreground">
																				{group.description}
																			</p>
																		</div>
																	</div>
																))}
														</div>
													</AccordionContent>
												</AccordionItem>

												{/* Missions Management */}
												<AccordionItem value="missions">
													<AccordionTrigger className="text-md font-medium">
														Missions Management
													</AccordionTrigger>
													<AccordionContent>
														<div className="space-y-3 pl-2">
															{Object.entries(PERMISSION_GROUPS)
																.filter(([key]) => key.startsWith("Missions"))
																.map(([key, group]) => (
																	<div
																		key={key}
																		className="flex items-start space-x-3 p-2 rounded hover:bg-muted"
																	>
																		<Checkbox
																			id={key}
																			checked={selectedGroups.includes(
																				key as PermissionGroupKey,
																			)}
																			onCheckedChange={(checked) =>
																				handleGroupChange(
																					key as PermissionGroupKey,
																					!!checked,
																				)
																			}
																		/>
																		<div>
																			<Label
																				htmlFor={key}
																				className="font-medium"
																			>
																				{group.label}
																			</Label>
																			<p className="text-sm text-muted-foreground">
																				{group.description}
																			</p>
																		</div>
																	</div>
																))}
														</div>
													</AccordionContent>
												</AccordionItem>

												{/* Organization Management */}
												<AccordionItem value="organization">
													<AccordionTrigger className="text-md font-medium">
														Organization Management
													</AccordionTrigger>
													<AccordionContent>
														<div className="space-y-3 pl-2">
															{Object.entries(PERMISSION_GROUPS)
																.filter(([key]) =>
																	key.startsWith("Organization"),
																)
																.map(([key, group]) => (
																	<div
																		key={key}
																		className="flex items-start space-x-3 p-2 rounded hover:bg-muted"
																	>
																		<Checkbox
																			id={key}
																			checked={selectedGroups.includes(
																				key as PermissionGroupKey,
																			)}
																			onCheckedChange={(checked) =>
																				handleGroupChange(
																					key as PermissionGroupKey,
																					!!checked,
																				)
																			}
																		/>
																		<div>
																			<Label
																				htmlFor={key}
																				className="font-medium"
																			>
																				{group.label}
																			</Label>
																			<p className="text-sm text-muted-foreground">
																				{group.description}
																			</p>
																		</div>
																	</div>
																))}
														</div>
													</AccordionContent>
												</AccordionItem>

												{/* Childcare Management */}
												<AccordionItem value="childcare">
													<AccordionTrigger className="text-md font-medium">
														Childcare Management
													</AccordionTrigger>
													<AccordionContent>
														<div className="space-y-3 pl-2">
															{Object.entries(PERMISSION_GROUPS)
																.filter(([key]) => key.startsWith("Childcare"))
																.map(([key, group]) => (
																	<div
																		key={key}
																		className="flex items-start space-x-3 p-2 rounded hover:bg-muted"
																	>
																		<Checkbox
																			id={key}
																			checked={selectedGroups.includes(
																				key as PermissionGroupKey,
																			)}
																			onCheckedChange={(checked) =>
																				handleGroupChange(
																					key as PermissionGroupKey,
																					!!checked,
																				)
																			}
																		/>
																		<div>
																			<Label
																				htmlFor={key}
																				className="font-medium"
																			>
																				{group.label}
																			</Label>
																			<p className="text-sm text-muted-foreground">
																				{group.description}
																			</p>
																		</div>
																	</div>
																))}
														</div>
													</AccordionContent>
												</AccordionItem>
											</Accordion>
										</div>
									</TabsContent>

									<TabsContent value="advanced">
										<div className="space-y-6 border rounded-md p-4">
											<p className="text-sm text-muted-foreground">
												Advanced view allows you to select individual
												permissions. Most users should use the Simple View.
											</p>

											{Object.entries(PERMISSIONS).map(([category, perms]) => (
												<div key={category} className="space-y-2">
													<h4 className="font-medium capitalize">{category}</h4>
													<div className="grid grid-cols-2 gap-2">
														{Object.entries(perms).map(([key, label]) => {
															const permissionId =
																`${category}.${key}` as Permission;
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

																			// If individual permissions are changed, set template to custom
																			setSelectedTemplate("custom");
																		}}
																	/>
																	<Label
																		htmlFor={permissionId}
																		className="text-sm"
																	>
																		{label}
																	</Label>
																</div>
															);
														})}
													</div>
												</div>
											))}
										</div>
									</TabsContent>
								</Tabs>
							</div>

							{/* Hidden input to store all permissions */}
							{formData.permissions.map((permission) => (
								<input
									key={permission}
									type="hidden"
									name="permissions"
									value={permission}
								/>
							))}

							<div className="flex items-center space-x-2">
								<Checkbox
									id="isDefault"
									name="isDefault"
									checked={formData.isDefault}
									onCheckedChange={(checked) => {
										setFormData((prev) => ({
											...prev,
											isDefault: !!checked,
										}));
									}}
								/>
								<Label htmlFor="isDefault">Default role for new members</Label>
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
				title="Delete Role"
				description="Are you sure you want to delete this role? This action cannot be undone and will remove this role from all members who have it."
				loading={false}
				open={showDeleteConfirm}
				onOpenChange={setShowDeleteConfirm}
				onConfirm={handleDelete}
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
