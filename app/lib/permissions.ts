export const PERMISSIONS = {
	members: {
		view: "View members",
		create: "Create members",
		edit: "Edit members",
		delete: "Delete members",
		message: "Send messages to members",
		assign: "Assign members to teams/roles",
	},
	teams: {
		view: "View teams",
		create: "Create teams",
		edit: "Edit teams",
		delete: "Delete teams",
		manage: "Manage team settings",
	},
	roles: {
		view: "View roles",
		create: "Create roles",
		edit: "Edit roles",
		delete: "Delete roles",
	},
	events: {
		view: "View events",
		create: "Create events",
		edit: "Edit events",
		delete: "Delete events",
	},
	missions: {
		view: "View missions",
		create: "Create missions",
		edit: "Edit missions",
		delete: "Delete missions",
	},
	organization: {
		view: "View organization",
		edit: "Edit organization",
		delete: "Delete organization",
		manageAssociations: "Manage organization associations",
	},
	settings: {
		view: "View settings",
		edit: "Edit settings",
	},
	childcare: {
		checkin: "Perform child check-ins",
		viewRooms: "View childcare rooms",
		createRooms: "Create childcare rooms",
		editRooms: "Edit childcare rooms",
		deleteRooms: "Delete childcare rooms",
		assignChildren: "Assign children to rooms",
		viewReports: "View childcare reports",
	},
} as const;

export type PermissionCategory = keyof typeof PERMISSIONS;
export type Permission = `${PermissionCategory}.${string}`;

export const getAllPermissions = (): Permission[] => {
	return Object.entries(PERMISSIONS).flatMap(([category, perms]) =>
		Object.keys(perms).map((key) => `${category}.${key}` as Permission),
	);
};

export const getPermissionLabel = (permission: Permission): string => {
	const [category, action] = permission.split(".");
	return PERMISSIONS[category as PermissionCategory]?.[action] || permission;
};

// Helper to check if a permission exists
export const isValidPermission = (
	permission: string,
): permission is Permission => {
	const [category, action] = permission.split(".");
	return (
		category in PERMISSIONS &&
		action in PERMISSIONS[category as PermissionCategory]
	);
};
