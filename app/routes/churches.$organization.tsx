import {
	Link,
	Outlet,
	data,
	isRouteErrorResponse,
	redirect,
	useActionData,
	useFetcher,
	useLoaderData,
	useLocation,
	useNavigate,
	useRouteError,
} from "react-router";

import { useContext, useEffect, useState } from "react";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { ChurchService } from "~/services/ChurchService";

import { aliasedTable, eq } from "drizzle-orm";
import {
	ArrowRight as ArrowNarrowRightIcon,
	Pencil as PencilIcon,
	Trash as TrashIcon,
} from "lucide-react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
	churchOrganization,
	organizationRoles,
	usersToOrganizationRoles,
} from "server/db/schema";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { db } from "~/server/dbConnection";
import { AuthorizationService } from "~/services/AuthorizationService";
import UpdateToast from "~/src/components/toast/UpdateToast";
import { UserContext } from "~/src/providers/userProvider";
import type { Route } from "./+types";

import stylesheet from "~/components/messaging/styles.css?url";

export const links: Route.LinksFunction = () => [
	{ rel: "stylesheet", href: stylesheet },
];

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	// Get the organization data first
	const parentOrganizationAlias = aliasedTable(
		churchOrganization,
		"parentOrganization",
	);
	const organizationResponse = await db
		.select({
			organization: churchOrganization,
			parentOrganization: parentOrganizationAlias,
		})
		.from(churchOrganization)
		.where(eq(churchOrganization.id, params.organization))
		.leftJoin(
			parentOrganizationAlias,
			eq(churchOrganization.parentOrganizationId, parentOrganizationAlias.id),
		)
		.then((data) => data[0]);

	if (!organizationResponse) {
		throw new Error("Organization not found");
	}

	// Try to get authenticated user and their permissions
	const user = await authenticator.isAuthenticated(request);
	let orgRoles = null;
	let userRoleAssignments = null;
	let permissions = {
		canEdit: false,
		canDelete: false,
		canManageMembers: false,
		canManageRoles: false,
		canManageTeams: false,
	};

	if (user) {
		// Get all roles for the organization
		orgRoles = await db
			.select()
			.from(organizationRoles)
			.where(eq(organizationRoles.churchOrganizationId, params.organization));

		// Get user's role assignments
		userRoleAssignments = await db
			.select()
			.from(usersToOrganizationRoles)
			.where(
				eq(usersToOrganizationRoles.churchOrganizationId, params.organization),
			);

		// Create authorization service
		const authService = new AuthorizationService(
			user,
			orgRoles,
			userRoleAssignments,
		);

		// Set permissions based on user's roles
		permissions = {
			canEdit: authService.hasPermission(
				"organization.update",
				params.organization,
			),
			canDelete: authService.hasPermission(
				"organization.delete",
				params.organization,
			),
			canManageMembers: authService.hasPermission(
				"members.create",
				params.organization,
			),
			canManageRoles: authService.hasPermission(
				"roles.create",
				params.organization,
			),
			canManageTeams: authService.hasPermission(
				"teams.create",
				params.organization,
			),
		};
	}

	return {
		organization: {
			...organizationResponse.organization,
			parentOrganization: organizationResponse.parentOrganization,
		},
		user,
		orgRoles,
		userRoleAssignments,
		permissions,
	};
};

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

const ChurchPage = () => {
	const { user, organizationRoles, userToRoles } = useContext(UserContext);
	const [showUpdateToast, setShowUpdateToast] = useState(false);
	const loaderData = useLoaderData<typeof loader>();
	const actionData = useActionData();
	const deleteFetcher = useFetcher();
	const location = useLocation();
	const navigate = useNavigate();

	const { permissions } = loaderData;

	// Get the current tab from the URL path
	const getCurrentTab = () => {
		const path = location.pathname.split("/").pop();
		if (!path || path === loaderData.organization?.id) return "details";
		return path;
	};

	function deleteChurch() {
		if (!loaderData.organization?.id || !permissions.canDelete) return;
		deleteFetcher.submit(
			{},
			{ method: "delete", action: `/churches/${loaderData.organization.id}` },
		);
	}

	function removeChurchAssociation(
		org: typeof churchOrganization.$inferSelect,
	) {
		if (!loaderData.organization?.id) return;
		deleteFetcher.submit(
			{
				orgId: org.id,
				parentOrgId: loaderData.organization.id,
			},
			{
				method: "delete",
				action: `/churches/${loaderData.organization.id}/associate`,
			},
		);
	}

	useEffect(() => {
		if (actionData?.success) {
			setShowUpdateToast(actionData.success);
		}
	}, [actionData]);

	return (
		<div className="min-h-screen flex flex-col">
			<div className="p-4 space-y-4">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<div className="flex-1 space-y-1">
						<h1 className="text-2xl sm:text-3xl font-bold">
							{loaderData.organization?.name}
						</h1>
						<div className="text-sm text-gray-500">
							Last Updated:{" "}
							{loaderData.organization?.updatedAt.toLocaleDateString()}
						</div>
						{loaderData.organization?.parentOrganizationId && (
							<Link
								className="flex items-center text-sm text-gray-500 hover:text-gray-700"
								to={`/churches/${loaderData.organization?.parentOrganizationId}`}
							>
								Parent Org: {loaderData.organization?.parentOrganization?.name}
								<ArrowNarrowRightIcon className="w-4 h-4 ml-1" />
							</Link>
						)}
					</div>

					{(permissions.canEdit ||
						permissions.canDelete ||
						permissions.canManageMembers) && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button>
									<PencilIcon className="h-4 w-4 sm:mr-2" />
									<span className="hidden sm:inline">Manage</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48">
								{permissions.canEdit && (
									<DropdownMenuItem onClick={() => navigate("details/update")}>
										Edit Details
									</DropdownMenuItem>
								)}
								{permissions.canManageMembers && (
									<DropdownMenuItem onClick={() => navigate("members/add")}>
										Add Member
									</DropdownMenuItem>
								)}
								{permissions.canDelete && (
									<DropdownMenuItem
										className="text-red-600"
										onClick={deleteChurch}
									>
										<TrashIcon className="h-4 w-4 mr-2" />
										Delete
									</DropdownMenuItem>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>

				<div className="w-full">
					<Tabs value={getCurrentTab()} className="w-full">
						<div className="overflow-x-auto pb-2">
							<TabsList className="inline-flex w-auto min-w-full sm:w-full border-b pb-px">
								<TabsTrigger
									value="details"
									onClick={() => navigate("details")}
								>
									Details
								</TabsTrigger>
								<TabsTrigger
									value="missions"
									onClick={() => navigate("missions")}
								>
									Missions
								</TabsTrigger>
								<TabsTrigger
									value="members"
									onClick={() => navigate("members")}
								>
									Members
								</TabsTrigger>
								<TabsTrigger value="teams" onClick={() => navigate("teams")}>
									Teams
								</TabsTrigger>
								<TabsTrigger value="roles" onClick={() => navigate("roles")}>
									Roles
								</TabsTrigger>
								<TabsTrigger
									value="landing"
									onClick={() => navigate("landing")}
								>
									Landing Page
								</TabsTrigger>
								<TabsTrigger value="events" onClick={() => navigate("events")}>
									Calendar
								</TabsTrigger>
							</TabsList>
						</div>
						<div className="mt-4 overflow-x-hidden">
							<Outlet />
						</div>
					</Tabs>
				</div>
			</div>

			<UpdateToast
				showUpdateToast={showUpdateToast}
				message="Updated Successfully"
				onClose={() => setShowUpdateToast(false)}
			/>
		</div>
	);
};

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

export default ChurchPage;
