import { ChurchOrganization } from "@prisma/client";
import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { prismaClient } from "~/server/dbConnection";
import { ChurchService } from "~/services/ChurchService";
import { Button } from "~/src/components/button/Button";
import CreateChurchForm from "~/src/components/forms/createChurch/CreateChurchForm";

export const loader = async ({ request, params }: LoaderArgs) => {
    const organization = await prismaClient.churchOrganization.findUnique({
        where: {
            id: params.organization,
        },
    });

    return json({
        organization,
    });
};

export const action = async ({ request, params }: ActionArgs) => {
    if (request.method === "PUT") {

        const user = await authenticator.isAuthenticated(request);
        if(!user) return json({message: "Not Authenticated"}, {status: 401});

        console.log("UPdating the church");
        const churchService = new ChurchService();
        const newChurch: ChurchOrganization = await churchService.getChurchFormDataFromRequest(request);

        const response = await prismaClient.churchOrganization.update({
            where: {
                id: params.organization,
            },
            data: newChurch,
        });

        return json({
            organization: response,
        });
    }
};

interface ILoaderData {
    organization: ChurchOrganization | null;
}

const ChurchPage = () => {
    const loaderData = useLoaderData<ILoaderData>();
    return (
        <div className="flex-col space-y-4">
            <div>
                <h1 className="text-3xl"> Update {loaderData.organization?.name} </h1>
                <div className="text-sm text-gray-500">Last Updated: {loaderData.organization?.updatedAt}</div>
            </div>
            <div className="flex-col">
                

                <div className="p-5 max-w-xl shadow-md">
                    <h1 className="text-3xl">Information</h1>
                    <hr className="my-2" />
                    <Form method="put" className="space-y-4">
                        <CreateChurchForm initialValues={loaderData?.organization} />

                        <Button type="submit">Update</Button>
                    </Form>
                </div>
            </div>
        </div>
    );
};

export default ChurchPage;
