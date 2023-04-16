import { defer, json, LoaderArgs } from "@remix-run/node";
import { prismaClient } from "~/server/dbConnection";
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

export const loader = async ({ request, params }: LoaderArgs) => {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const search = (searchParams.get("search") as string) ?? "";
    const entityType = searchParams.get("type") as SearchEntityType;

    let missionaryPromise, churchesPromise, missionsPromise;

    if (entityType) {
        switch (entityType) {
            case SearchEntityType.Missionary:
                missionaryPromise = prismaClient.missionary.findMany(missionaryPrismaSearch(search) as any);
                break;
            case SearchEntityType.ChurchOrganization:
                churchesPromise = prismaClient.churchOrganization.findMany(orgPrismaSearch(search) as any);
                break;
            case SearchEntityType.Mission:
                missionsPromise = prismaClient.missions.findMany(missionsPrismaSearch(search) as any);
                break;
        }
    } else {
        missionaryPromise = prismaClient.missionary.findMany(missionaryPrismaSearch(search) as any);

        churchesPromise = prismaClient.churchOrganization.findMany(orgPrismaSearch(search) as any);

        missionsPromise = prismaClient.missions.findMany(missionsPrismaSearch(search) as any);
    }

    const responses = await Promise.all([missionaryPromise, churchesPromise, missionsPromise]);

    return json({
        missionary: responses[0],
        churches: responses[1],
        missions: responses[2],
    });
};
