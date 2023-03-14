import { User } from "@prisma/client";
import { ActionArgs, json } from "@remix-run/node";
import { prismaClient } from "~/server/dbConnection";

export const action = async ({ request, params }: ActionArgs) => {
    const form = await request.formData();

    const user = JSON.parse(form.get("user") as string) as User;

    const response = await prismaClient.user.delete({
        where: {
            id: user.id,
        },
    });

    return json({
        response: response,
    });
};
