import { useFetcher, useLoaderData } from "react-router";
import {
	churchOrganization,
	organizationMembershipRequest,
} from "server/db/schema";
import { db } from "@/server/db/dbConnection";
import OrgRequestCard from "~/src/components/forms/cards/OrgRequestCard";
import { eq, not, exists } from "drizzle-orm";
import List from "~/src/components/listItems/List";
import { InvitationTypes } from "~/src/types/invitation.types";
import type { Route } from "./+types";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const organization = await db
		.select()
		.from(churchOrganization)
		.where(eq(churchOrganization.id, params.organization))
		.innerJoin(
			churchOrganization.associations,
			eq(churchOrganization.id, churchOrganization.associations.id),
		)
		.innerJoin(
			churchOrganization.parentOrganization,
			eq(churchOrganization.id, churchOrganization.parentOrganization.id),
		)
		.then(([organization]) => organization);

	const organizations = await db
		.select()
		.from(churchOrganization)
		.where(eq(churchOrganization.id, params.organization))
		.where(not(eq(churchOrganization.id, params.organization)))
		.where(
			not(
				exists(
					select()
						.from(organizationMembershipRequest)
						.where(
							and(
								eq(
									organizationMembershipRequest.requestingChurchOrganizationId,
									params.organization,
								),
								eq(
									organizationMembershipRequest.parentOrganizationId,
									churchOrganization.id,
								),
							),
						),
				),
			),
		);

	return {
		requestingOrg: organization,
		organizations,
	};
};

const Request = () => {
	const loaderData = useLoaderData();

	const acceptFetcher = useFetcher();

	function acceptRequest(orgId: string, invitationId: string) {
		acceptFetcher.submit(
			{
				orgId: orgId,
				parentOrgId: loaderData.organization?.id,
				invitationId: invitationId,
				type: InvitationTypes.Organization,
			},
			{
				method: "post",
				action: `/api/invitation/accept`,
			},
		);
	}

	function rejectRequest(orgId: string, invitationId: string) {
		acceptFetcher.submit(
			{
				orgId: orgId,
				parentOrgId: loaderData.organization?.id,
				invitationId: invitationId,
				type: InvitationTypes.Organization,
			},
			{
				method: "post",
				action: `/api/invitation/reject`,
			},
		);
	}

	return (
		<div className="flex-col">
			<span className="text-3xl">
				{loaderData.organization?.organizationMembershipRequest.length} Request
			</span>

			<div className="flex flex-col">
				<List>
					{loaderData.organization?.organizationMembershipRequest.map(
						(request: typeof organizationMembershipRequest.$inferSelect) => {
							return (
								<OrgRequestCard
									key={request.id}
									request={request}
									acceptRequest={acceptRequest}
									rejectRequest={rejectRequest}
								/>
							);
						},
					)}
				</List>
			</div>
		</div>
	);
};

export default Request;
