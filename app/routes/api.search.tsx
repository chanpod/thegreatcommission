
import { authenticator } from "~/server/auth/strategies/authenticaiton";

import { SearchEntityType } from "~/src/components/header/SearchBar";

const missionaryPrismaSearch = (search: string) => {
    return {
        where: {
            OR: [
                {
                    firstName: {
                        contains: search ?? "",
                        mode: "insensitive",
                    },
                },
                {
                    lastName: {
                        contains: search ?? "",
                        mode: "insensitive",
                    },
                },
            ],
        },
    };
};

const missionsPrismaSearch = (search: string) => {
    return {
        where: {
            title: {
                contains: search ?? "",
                mode: "insensitive",
            },
        },
    };
};

const orgPrismaSearch = (search: string) => {
    return {
        where: {
            name: {
                contains: search ?? "",
                mode: "insensitive",
            },
        },
    };
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const search = (searchParams.get("search") as string) ?? "";
    const entityType = searchParams.get("type") as SearchEntityType;
    const user = await authenticator.authenticate("google", request);
    
    let missionaryPromise, churchesPromise, missionsPromise;

    if (entityType) {
        switch (entityType) {
            case SearchEntityType.Missionary:
                missionaryPromise = db.select().from(missionary).where(missionaryPrismaSearch(search) as any);
                break;
            case SearchEntityType.ChurchOrganization:
                churchesPromise = db.select().from(churchOrganization).where(orgPrismaSearch(search) as any);
                break;
            case SearchEntityType.Mission:
                missionsPromise = db.select().from(missions).where(missionsPrismaSearch(search) as any);
                break;
        }
    } else {
        missionaryPromise = db.select().from(missionary).where(missionaryPrismaSearch(search) as any);

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
