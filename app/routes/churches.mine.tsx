import { useLoaderData } from "react-router";
import { map } from "lodash-es";
import { eq, ilike, and } from "drizzle-orm";

import ChurchRowCard from "~/src/components/listItems/components/ChurchRowCard";
import List from "~/src/components/listItems/List";
import { churchOrganization, usersToOrganizationRoles } from "server/db/schema";
import { db } from "@/server/db/dbConnection";
import { PermissionsService } from "@/server/services/PermissionsService";
import { createAuthLoader } from "~/server/auth/authLoader";
import { SearchEntityType } from "~/src/components/header/SearchBar";

export const loader = createAuthLoader(async ({ request, userContext }) => {
	const permissionsService = new PermissionsService();
	const url = new URL(request.url);
	const searchParams = url.searchParams;
	const search = searchParams.get("search");
	const entityType = searchParams.get("type") as SearchEntityType | null;

	// Base query to get organizations where the user has permissions
	const userOrgs = await db
		.select({
			church: churchOrganization,
		})
		.from(usersToOrganizationRoles)
		.innerJoin(
			churchOrganization,
			eq(churchOrganization.id, usersToOrganizationRoles.churchOrganizationId),
		)
		.where(
			and(
				eq(usersToOrganizationRoles.userId, userContext.user.id),
				search ? ilike(churchOrganization.name, `%${search}%`) : undefined,
			),
		);

	const churches = userOrgs.map((row) => row.church);

	return {
		churches,
	};
}, true);

export default function MyChurchesPage() {
	const loaderData = useLoaderData<typeof loader>();
	const churches = loaderData.churches;

	return (
		<div className="p-6">
			<List>
				{map(churches, (church: typeof churchOrganization.$inferSelect) => {
					return <ChurchRowCard linkActive church={church} key={church.id} />;
				})}
			</List>
		</div>
	);
}
