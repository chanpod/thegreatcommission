import { db } from "~/server/dbConnection";

import { SearchEntityType } from "~/src/components/header/SearchBar";

import { ilike, or } from "drizzle-orm";
import { churchOrganization, missions, users } from "server/db/schema";
import { createAuthLoader } from "~/server/auth/authLoader";
import type { Route } from "../+types/root";

const missionaryPrismaSearch = (search: string) => {
	return or(
		ilike(users.firstName, `%${search ?? ""}%`),
		ilike(users.lastName, `%${search ?? ""}%`),
	);
};

const missionsPrismaSearch = (search: string) => {
	return ilike(missions.title, `%${search ?? ""}%`);
};

const orgPrismaSearch = (search: string) => {
	return ilike(churchOrganization.name, `%${search ?? ""}%`);
};

export const loader = createAuthLoader(
	async ({ request, params, userContext }) => {
		const url = new URL(request.url);
		const searchParams = url.searchParams;
		const search = (searchParams.get("search") as string) ?? "";
		const entityType = searchParams.get("type") as SearchEntityType;

		let missionaryPromise, churchesPromise, missionsPromise;

		if (entityType) {
			switch (entityType) {
				case SearchEntityType.Missionary:
					missionaryPromise = db
						.select()
						.from(users)
						.where(missionaryPrismaSearch(search) as any);
					break;
				case SearchEntityType.ChurchOrganization:
					churchesPromise = db
						.select()
						.from(churchOrganization)
						.where(orgPrismaSearch(search) as any);
					break;
				case SearchEntityType.Mission:
					missionsPromise = db
						.select()
						.from(missions)
						.where(missionsPrismaSearch(search) as any);
					break;
			}
		} else {
			missionaryPromise = db
				.select()
				.from(users)
				.where(missionaryPrismaSearch(search) as any);

			churchesPromise = db
				.select()
				.from(churchOrganization)
				.where(orgPrismaSearch(search) as any);

			missionsPromise = db
				.select()
				.from(missions)
				.where(missionsPrismaSearch(search) as any);
		}

		const responses = await Promise.all([
			missionaryPromise,
			churchesPromise,
			missionsPromise,
		]);

		return {
			missionary: responses[0],
			churches: responses[1],
			missions: responses[2],
		};
	},
	false,
);
