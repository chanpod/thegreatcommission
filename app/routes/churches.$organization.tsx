import {
	data,
	Link,
	Outlet,
	redirect,
	useActionData,
	useFetcher,
	useLoaderData,
	useNavigate,
	useLocation,
} from "react-router";

import { motion } from "framer-motion";
import { useContext, useEffect, useState } from "react";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { ChurchService } from "~/services/ChurchService";

import { aliasedTable, and, eq } from "drizzle-orm";
import {
	ArrowRight as ArrowNarrowRightIcon,
	Pencil as PencilIcon,
	Trash as TrashIcon,
} from "lucide-react";
import {
	churchOrganization,
	usersTochurchOrganization,
} from "server/db/schema";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { db } from "~/server/dbConnection";
import UpdateToast from "~/src/components/toast/UpdateToast";
import { classNames } from "~/src/helpers";
import useIsLoggedIn from "~/src/hooks/useIsLoggedIn";
import { UserContext } from "~/src/providers/userProvider";
import type { Route } from "./+types";
import type { LoaderArgs, ActionArgs } from "@remix-run/node";

type LoaderData = {
	organization: typeof churchOrganization.$inferSelect & {
		parentOrganization?: typeof churchOrganization.$inferSelect;
	};
	adminIds: string[];
};

export const loader = async ({ request, params }: LoaderArgs) => {
	if (!params.organization) {
		throw new Error("Organization ID is required");
	}

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
			eq(churchOrganization.id, parentOrganizationAlias.id),
		)
		.then((data) => data[0]);

	const adminIds = await db
		.select()
		.from(usersTochurchOrganization)
		.where(
			and(
				eq(usersTochurchOrganization.churchOrganizationId, params.organization),
				eq(usersTochurchOrganization.isAdmin, true),
			),
		);

	return {
		organization: {
			...organizationResponse.organization,
			parentOrganization: organizationResponse.parentOrganization,
		},
		adminIds: adminIds.map((admin) => admin.userId),
	} satisfies LoaderData;
};

export const action = async ({ request, params }: ActionArgs) => {
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
	const { user } = useIsLoggedIn();
	const { roles } = useContext(UserContext);
	const [showUpdateToast, setShowUpdateToast] = useState(false);
	const loaderData = useLoaderData<typeof loader>();
	const actionData = useActionData();
	const deleteFetcher = useFetcher();
	const location = useLocation();
	const navigate = useNavigate();

	const churchService = new ChurchService(
		loaderData?.organization!,
		loaderData?.adminIds,
	);

	// Get the current tab from the URL path
	const getCurrentTab = () => {
		const path = location.pathname.split("/").pop();
		if (!path || path === loaderData.organization?.id) return "details";
		return path;
	};

	function deleteChurch() {
		if (!loaderData.organization?.id) return;
		deleteFetcher.submit(
			{},
			{ method: "delete", action: "/churches/" + loaderData.organization.id },
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
				action: "/churches/" + loaderData.organization.id + "/associate",
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

					{churchService.userIsAdmin(user, roles) && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button>
									<PencilIcon className="h-4 w-4 sm:mr-2" />
									<span className="hidden sm:inline">Manage</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48">
								<DropdownMenuItem onClick={() => navigate("details/update")}>
									Edit Details
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => navigate("associate")}>
									Associate Org
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => navigate("members/add")}>
									Add Member
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => navigate("request")}>
									Manage Request (
									{loaderData.organization?.organizationMembershipRequest
										?.length || 0}
									)
								</DropdownMenuItem>
								<DropdownMenuItem
									className="text-red-600"
									onClick={deleteChurch}
								>
									<TrashIcon className="h-4 w-4 mr-2" />
									Delete
								</DropdownMenuItem>
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
									value="associations"
									onClick={() => navigate("associations")}
								>
									Associated Orgs
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

export default ChurchPage;
