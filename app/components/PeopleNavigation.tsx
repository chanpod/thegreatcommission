import { Link, useLocation } from "react-router";
import { cn } from "~/lib/utils";

const PEOPLE_TABS = [
	{ name: "Members", href: "members" },
	{ name: "Teams", href: "teams" },
	{ name: "Roles", href: "roles" },
];

export function PeopleNavigation() {
	const location = useLocation();
	const pathParts = location.pathname.split("/");
	const organizationId = pathParts[2];
	const currentPath = pathParts[3] || "";

	return (
		<div className="mb-6">
			<div className="border-b border-gray-200">
				<nav className="-mb-px flex space-x-8" aria-label="Tabs">
					{PEOPLE_TABS.map((tab) => {
						const isActive = currentPath === tab.href;

						return (
							<Link
								key={tab.href}
								to={`/churches/${organizationId}/${tab.href}`}
								className={cn(
									"whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm",
									isActive
										? "border-indigo-500 text-indigo-600"
										: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
								)}
							>
								{tab.name}
							</Link>
						);
					})}
				</nav>
			</div>
		</div>
	);
}
