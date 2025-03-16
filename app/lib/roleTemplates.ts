import { PERMISSION_GROUPS, type PermissionGroupKey } from "./permissionGroups";
import { getAllPermissions } from "./permissions";

export interface RoleTemplate {
	id: string;
	name: string;
	description: string;
	permissionGroups: PermissionGroupKey[];
	isDefault?: boolean;
}

export const ROLE_TEMPLATES: RoleTemplate[] = [
	{
		id: "admin",
		name: "Administrator",
		description: "Full access to all features and settings",
		permissionGroups: Object.keys(PERMISSION_GROUPS) as PermissionGroupKey[],
	},
	{
		id: "member",
		name: "Regular Member",
		description: "Basic access for regular church members",
		permissionGroups: [
			"People - View",
			"Events - View",
			"Missions - View",
			"Organization - View",
		],
		isDefault: true,
	},
	{
		id: "childcare",
		name: "Child Care Worker",
		description: "Access for those working with children",
		permissionGroups: [
			"People - View",
			"Events - View",
			"Childcare - Basic",
			"Childcare - Assign",
		],
	},
	{
		id: "childcare_admin",
		name: "Child Care Administrator",
		description: "Can manage all aspects of the childcare system",
		permissionGroups: [
			"People - View",
			"People - Message",
			"Events - View",
			"Childcare - Basic",
			"Childcare - Assign",
			"Childcare - Admin",
		],
	},
	{
		id: "ministry_leader",
		name: "Ministry Leader",
		description: "Can manage teams and events for their ministry",
		permissionGroups: [
			"People - View",
			"People - Message",
			"Events - View",
			"Events - Edit",
			"Teams - View",
			"Teams - Edit",
		],
	},
	{
		id: "communications",
		name: "Communications Team",
		description: "Can send messages and manage the landing page",
		permissionGroups: [
			"People - View",
			"People - Message",
			"Events - View",
			"Organization - View",
		],
	},
	{
		id: "missions_coordinator",
		name: "Missions Coordinator",
		description: "Can manage missions and related teams",
		permissionGroups: [
			"People - View",
			"People - Message",
			"Missions - View",
			"Missions - Edit",
			"Teams - View",
		],
	},
	{
		id: "office_staff",
		name: "Office Staff",
		description: "Administrative staff with limited permissions",
		permissionGroups: [
			"People - View",
			"People - Edit",
			"People - Message",
			"Events - View",
			"Events - Edit",
			"Organization - View",
		],
	},
	{
		id: "custom",
		name: "Custom Role",
		description: "Create a role with custom permissions",
		permissionGroups: [],
	},
];

export const getTemplateById = (id: string): RoleTemplate | undefined => {
	return ROLE_TEMPLATES.find((template) => template.id === id);
};
