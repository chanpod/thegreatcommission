import { json, LoaderArgs } from "@remix-run/node";
import { prismaClient } from "~/src/components/server/dbConnection";

export const loader = async ({ request, params }: LoaderArgs) => {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const search = searchParams.get("search");

    console.log(search);
    const missionary = await prismaClient.missionary.findMany({
        where: {
            OR: [
                {
                    firstName: {
                        contains: search ?? "",
                        mode: 'insensitive',
                    },
                },
                {
                    lastName: {
                        contains: search ?? "",
                        mode: 'insensitive',
                    },
                },
            ],
        },
    });

    const churches = await prismaClient.churchOrganization.findMany({
        where: {
            name: {
                contains: search ?? "",
                mode: 'insensitive',
            },
        },
    });

    return json({
        missionary,
        churches,
    });
};
