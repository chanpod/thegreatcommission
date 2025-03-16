import { HomeIcon, ImageIcon, Settings, FileText } from "lucide-react";

const navigation = [
	{
		name: "Dashboard",
		path: (organizationId: string) => `/dashboard/${organizationId}`,
		icon: HomeIcon,
	},
	{
		name: "Website",
		path: (organizationId: string) => `/dashboard/${organizationId}/landing`,
		icon: ImageIcon,
	},
	{
		name: "Forms",
		path: (organizationId: string) => `/dashboard/${organizationId}/forms`,
		icon: FileText,
	},
	{
		name: "Settings",
		path: (organizationId: string) => `/dashboard/${organizationId}/settings`,
		icon: Settings,
	},
];
