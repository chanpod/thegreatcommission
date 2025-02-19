import {
	Link,
	Outlet,
	data,
	isRouteErrorResponse,
	redirect,
	useLoaderData,
	useLocation,
	useNavigate,
	useRouteError,
} from "react-router";

import { ChurchService } from "~/services/ChurchService";
import { eq } from "drizzle-orm";
import type { ActionFunctionArgs } from "react-router";
import { churchOrganization } from "server/db/schema";
import { Button } from "~/components/ui/button";
import { db } from "~/server/dbConnection";
import type { Route } from "./+types";
import { Bell, Settings } from "lucide-react";
import stylesheet from "~/components/messaging/styles.css?url";
import { cn } from "~/lib/utils";
import { createAuthLoader } from "~/server/auth/authLoader";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { PermissionsService } from "@/server/services/PermissionsService";
import { format } from "date-fns";
import { GuidedMessageComposer } from "~/components/messaging/GuidedMessageComposer";
import { useState } from "react";

export const links: Route.LinksFunction = () => [
	{ rel: "stylesheet", href: stylesheet },
];

export const loader = createAuthLoader(
	async ({ request, auth, params, userContext }) => {
		const organization = await db
			.select()
			.from(churchOrganization)
			.where(eq(churchOrganization.id, params.organization))
			.then((rows) => rows[0]);

		if (!organization) {
			throw new Error("Organization not found");
		}

		const permissionsService = new PermissionsService();
		const permissions = await permissionsService.getOrganizationPermissions(
			userContext.user.id,
			params.organization,
		);

		return {
			organization,
			permissions,
			lastUpdated: organization.updatedAt,
		};
	},
	true,
);

export const action = async ({ request, params }: ActionFunctionArgs) => {
	if (!params.organization) {
		throw new Error("Organization ID is required");
	}

	if (request.method === "PUT") {
		const user = await authenticator.isAuthenticated(request);
		if (!user) return data({ message: "Not Authenticated" }, { status: 401 });

		const churchService = new ChurchService();
		const formData = await churchService.getChurchFormDataFromRequest(request);
		const newChurch = {
			...formData,
			updatedAt: new Date(),
			createdById: user.id,
		};

		const response = await db
			.update(churchOrganization)
			.set(newChurch)
			.where(eq(churchOrganization.id, params.organization));

		return {
			organization: response,
			success: true,
		};
	}

	if (request.method === "DELETE") {
		const user = await authenticator.isAuthenticated(request);
		if (!user) return data({ message: "Not Authenticated" }, { status: 401 });

		const response = await db
			.delete(churchOrganization)
			.where(eq(churchOrganization.id, params.organization));

		return redirect("/churches");
	}

	return { error: "Invalid request method" };
};

const NAV_ITEMS = [
	{ name: "Overview", href: "" },
	{ name: "Members", href: "members" },
	{ name: "Teams", href: "teams" },
	{ name: "Events", href: "events" },
	{ name: "Roles", href: "roles" },
	{ name: "Landing Page", href: "landing" },
];

export default function OrganizationLayout() {
	const { organization, lastUpdated, permissions } =
		useLoaderData<typeof loader>();
	const location = useLocation();
	const currentPath = location.pathname.split("/").pop() || "";
	const [showMessageComposer, setShowMessageComposer] = useState(false);

	return (
		<div className="min-h-screen bg-gray-100">
			{/* Header */}
			<header className="bg-white shadow">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
					<div className="flex items-center">
						<h1 className="text-2xl font-bold text-gray-900">
							{organization.name}
						</h1>
					</div>
					<div className="flex items-center space-x-4">
						<p className="text-sm text-gray-500">
							Last updated: {format(new Date(lastUpdated), "MMM d, yyyy")}
						</p>
						<button
							type="button"
							className="p-2 rounded-full hover:bg-gray-200"
						>
							<Bell className="h-5 w-5 text-gray-600" />
						</button>
						{permissions.canEdit && (
							<Link
								to="details/update"
								className="p-2 rounded-full hover:bg-gray-200"
							>
								<Settings className="h-5 w-5 text-gray-600" />
							</Link>
						)}
						{permissions.canMessage && (
							<Button onClick={() => setShowMessageComposer(true)}>
								Message
							</Button>
						)}
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4">
				{/* Navigation */}
				<nav className="mb-6">
					<div className="sm:hidden">
						<select
							className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
							value={currentPath}
							onChange={(e) => {
								const path = `/churches/${organization.id}/${e.target.value}`;
								window.location.href = path;
							}}
						>
							{NAV_ITEMS.map((item) => (
								<option key={item.href} value={item.href}>
									{item.name}
								</option>
							))}
						</select>
					</div>
					<div className="hidden sm:block">
						<div className="border-b border-gray-200">
							<nav className="-mb-px flex space-x-8" aria-label="Tabs">
								{NAV_ITEMS.map((item) => {
									const isActive = currentPath === item.href;
									return (
										<Link
											key={item.href}
											to={item.href}
											className={cn(
												"whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm",
												isActive
													? "border-indigo-500 text-indigo-600"
													: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
											)}
										>
											{item.name}
										</Link>
									);
								})}
							</nav>
						</div>
					</div>
				</nav>

				{/* Content Area */}
				<div className="bg-white shadow overflow-hidden sm:rounded-lg">
					<Outlet />
				</div>
			</main>

			<GuidedMessageComposer
				open={showMessageComposer}
				onOpenChange={setShowMessageComposer}
				organizationId={organization.id}
			/>
		</div>
	);
}

export function ErrorBoundary() {
	const error = useRouteError();
	const navigate = useNavigate();

	if (isRouteErrorResponse(error)) {
		if (error.status === 401) {
			return (
				<div className="min-h-screen flex flex-col items-center justify-center p-4">
					<div className="text-center space-y-4">
						<h1 className="text-2xl font-bold">Authentication Required</h1>
						<p className="text-gray-600">
							Please log in to access this organization.
						</p>
						<Button onClick={() => navigate("/login")}>Log In</Button>
					</div>
				</div>
			);
		}

		if (error.status === 403) {
			return (
				<div className="min-h-screen flex flex-col items-center justify-center p-4">
					<div className="text-center space-y-4">
						<h1 className="text-2xl font-bold">Access Denied</h1>
						<p className="text-gray-600">
							You don't have permission to access this organization.
						</p>
						<Button onClick={() => navigate("/churches")}>
							Return to Churches
						</Button>
					</div>
				</div>
			);
		}

		if (error.status === 404) {
			return (
				<div className="min-h-screen flex flex-col items-center justify-center p-4">
					<div className="text-center space-y-4">
						<h1 className="text-2xl font-bold">Organization Not Found</h1>
						<p className="text-gray-600">
							The organization you're looking for doesn't exist.
						</p>
						<Button onClick={() => navigate("/churches")}>
							Return to Churches
						</Button>
					</div>
				</div>
			);
		}
	}

	// For any other errors
	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-4">
			<div className="text-center space-y-4">
				<h1 className="text-2xl font-bold">Unexpected Error</h1>
				<p className="text-gray-600">
					Something went wrong while accessing this organization.
				</p>
				{import.meta.env.DEV && error instanceof Error && (
					<div className="mt-4 p-4 bg-gray-100 rounded-lg overflow-auto text-left">
						<code>{error.message}</code>
						{error.stack && (
							<code className="block mt-2 text-gray-500">{error.stack}</code>
						)}
					</div>
				)}
				<Button onClick={() => navigate("/churches")}>
					Return to Churches
				</Button>
			</div>
		</div>
	);
}
