
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { db } from "~/server/dbConnection";

import { SearchEntityType } from "~/src/components/header/SearchBar";

import { churchOrganization, missionaries, missions } from "server/db/schema";
import { ilike, or } from "drizzle-orm";
import type { Route } from "../+types/root";

const missionaryPrismaSearch = (search: string) => {
    return or(
            ilike(missionaries.firstName, `%${search ?? ""}%`),
            ilike(missionaries.lastName, `%${search ?? ""}%`)
        )
    
};

const missionsPrismaSearch = (search: string) => {
    return ilike(missions.title, `%${search ?? ""}%`);
};

const orgPrismaSearch = (search: string) => {
    return ilike(churchOrganization.name, `%${search ?? ""}%`);
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const search = (searchParams.get("search") as string) ?? "";
    const entityType = searchParams.get("type") as SearchEntityType;
    const user = await authenticator.isAuthenticated(request);
    
    let missionaryPromise, churchesPromise, missionsPromise;

    if (entityType) {
        switch (entityType) {
            case SearchEntityType.Missionary:
                missionaryPromise = db.select().from(missionaries).where(missionaryPrismaSearch(search) as any);
                break;
            case SearchEntityType.ChurchOrganization:
                churchesPromise = db.select().from(churchOrganization).where(orgPrismaSearch(search) as any);
                break;
            case SearchEntityType.Mission:
                missionsPromise = db.select().from(missions).where(missionsPrismaSearch(search) as any);
                break;
        }
    } else {
        missionaryPromise = db.select().from(missionaries).where(missionaryPrismaSearch(search) as any);

        churchesPromise = db.select().from(churchOrganization).where(orgPrismaSearch(search) as any);

        missionsPromise = db.select().from(missions).where(missionsPrismaSearch(search) as any);
    }

    const responses = await Promise.all([missionaryPromise, churchesPromise, missionsPromise]);

    return {
        missionary: responses[0],
        churches: responses[1],
        missions: responses[2],
    };
};
