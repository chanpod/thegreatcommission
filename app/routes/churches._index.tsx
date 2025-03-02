import { useLoaderData } from "react-router";
import { map } from "lodash-es";
import { ilike } from "drizzle-orm";

import ChurchRowCard from "~/src/components/listItems/components/ChurchRowCard";
import List from "~/src/components/listItems/List";
import type { Route } from "../+types/root";
import { churchOrganization } from "server/db/schema";
import { db } from "@/server/db/dbConnection";
import { SearchEntityType } from "~/src/components/header/SearchBar";

export const loader = async ({ request }: Route.LoaderArgs) => {
	const url = new URL(request.url);
	const searchParams = url.searchParams;
	const search = searchParams.get("search");
	const entityType = searchParams.get("type") as SearchEntityType | null;

	let baseQuery = db.select().from(churchOrganization);

	// Apply search filter if search parameter exists and entity type is ChurchOrganization
	let churches;
	console.log(search);
	if (search) {
		churches = await baseQuery.where(
			ilike(churchOrganization.name, `%${search}%`),
		);
	} else {
		churches = await baseQuery;
	}

	return {
		churches,
	};
};

export default function ChurchPage() {
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
