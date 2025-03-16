import { PERMISSIONS } from "./permissions";
import type { Permission } from "./permissions";

// Define permission groups for a more user-friendly interface
export const PERMISSION_GROUPS = {
	// People Management
	"People - View": {
		label: "View people information",
		description: "Can see members, teams, and roles",
		permissions: ["members.view", "teams.view", "roles.view"],
	},
	"People - Edit": {
		label: "Manage people",
		description: "Can add, edit, and remove members, teams, and roles",
		permissions: [
			"members.create",
			"members.edit",
			"members.delete",
			"members.assign",
			"teams.create",
			"teams.edit",
			"teams.delete",
			"teams.manage",
			"roles.create",
			"roles.edit",
			"roles.delete",
		],
	},
	"People - Message": {
		label: "Send messages",
		description: "Can send messages to members",
		permissions: ["members.message"],
	},

	// Events Management
	"Events - View": {
		label: "View events",
		description: "Can see events and details",
		permissions: ["events.view"],
	},
	"Events - Edit": {
		label: "Manage events",
		description: "Can create, edit, and delete events",
		permissions: ["events.create", "events.edit", "events.delete"],
	},

	// Missions Management
	"Missions - View": {
		label: "View missions",
		description: "Can see missions and details",
		permissions: ["missions.view"],
	},
	"Missions - Edit": {
		label: "Manage missions",
		description: "Can create, edit, and delete missions",
		permissions: ["missions.create", "missions.edit", "missions.delete"],
	},

	// Organization Management
	"Organization - View": {
		label: "View organization",
		description: "Can see organization details",
		permissions: ["organization.view", "settings.view"],
	},
	"Organization - Edit": {
		label: "Manage organization",
		description: "Can edit organization details and settings",
		permissions: [
			"organization.edit",
			"organization.manageAssociations",
			"settings.edit",
		],
	},
	"Organization - Admin": {
		label: "Full administrative control",
		description: "Can delete the organization and perform all other actions",
		permissions: ["organization.delete"],
	},

	// Childcare Management
	"Childcare - Basic": {
		label: "Basic childcare access",
		description: "Can perform child check-ins and view rooms",
		permissions: ["childcare.checkin", "childcare.viewRooms"],
	},
	"Childcare - Assign": {
		label: "Assign children to rooms",
		description: "Can assign children to rooms and view reports",
		permissions: ["childcare.assignChildren", "childcare.viewReports"],
	},
	"Childcare - Admin": {
		label: "Manage childcare system",
		description: "Can create, edit, and delete childcare rooms",
		permissions: [
			"childcare.createRooms",
			"childcare.editRooms",
			"childcare.deleteRooms",
		],
	},
};

export type PermissionGroupKey = keyof typeof PERMISSION_GROUPS;

// Helper to get all permissions from selected groups
export const getPermissionsFromGroups = (
	groups: PermissionGroupKey[],
): Permission[] => {
	return [
		...new Set(groups.flatMap((group) => PERMISSION_GROUPS[group].permissions)),
	] as Permission[];
};

// Helper to get groups that contain a specific permission
export const getGroupsContainingPermission = (
	permission: Permission,
): PermissionGroupKey[] => {
	return Object.entries(PERMISSION_GROUPS)
		.filter(([_, group]) => group.permissions.includes(permission))
		.map(([key]) => key as PermissionGroupKey);
};

// Helper to determine which groups are selected based on current permissions
export const getSelectedGroups = (
	permissions: Permission[],
): PermissionGroupKey[] => {
	return Object.entries(PERMISSION_GROUPS)
		.filter(([_, group]) =>
			group.permissions.every((permission) => permissions.includes(permission)),
		)
		.map(([key]) => key as PermissionGroupKey);
};
