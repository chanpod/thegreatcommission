import { TrashIcon } from "@heroicons/react/24/outline";
import { ChurchOrganization } from "@prisma/client";
import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { Form, useFetcher, useLoaderData } from "@remix-run/react";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { prismaClient } from "~/server/dbConnection";
import { ChurchService } from "~/services/ChurchService";
import { Button } from "~/src/components/button/Button";
import CreateChurchForm from "~/src/components/forms/createChurch/CreateChurchForm";
import useIsLoggedIn from "~/src/hooks/useIsLoggedIn";

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
        if (!user) return json({ message: "Not Authenticated" }, { status: 401 });

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
    } else if (request.method === "DELETE") {
        const user = await authenticator.isAuthenticated(request);
        if (!user) return json({ message: "Not Authenticated" }, { status: 401 });

        const response = await prismaClient.churchOrganization.delete({
            where: {
                id: params.organization,
            },
        });

        return redirect("/churches");
    }
};

interface ILoaderData {
    organization: ChurchOrganization | null;
}

const ChurchPage = () => {
    const { isLoggedIn, user } = useIsLoggedIn();
    const loaderData = useLoaderData<ILoaderData>();
    const deleteFetcher = useFetcher();
    const loading = deleteFetcher.state === "submitting" || deleteFetcher.state === "loading";
    function deleteChurch() {
        deleteFetcher.submit({}, { method: "delete", action: `/churches/${loaderData.organization?.id}` });
    }

    return (
        <div className="flex-col space-y-4">
            <div className="flex">
                <div className="flex-1">
                    <h1 className="text-3xl"> Update {loaderData.organization?.name} </h1>
                    <div className="text-sm text-gray-500">Last Updated: {loaderData.organization?.updatedAt}</div>
                </div>
                {isLoggedIn && user?.id === loaderData.organization?.createdById && (
                    <Button
                        loading={loading}
                        className="rounded-xl bg-red-800 h-11 flex items-center"
                        onClick={deleteChurch}
                    >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                )}
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
