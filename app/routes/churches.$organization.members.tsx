import { eq } from "drizzle-orm";
import { Outlet, useFetcher, useLoaderData, useNavigate, useParams, useSubmit } from "react-router";
import { users, usersTochurchOrganization } from "@/server/db/schema";
import { db } from "~/server/dbConnection";
import { PageLayout } from "~/src/components/layout/PageLayout";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { NoData } from "~/components/ui/no-data";
import List from "~/src/components/listItems/List";
import { DataDisplay } from "~/src/components/dataDisplay/data";
import { Stack } from "~/src/components/layout/Stack";
import { PencilIcon, PhoneIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "~/components/ui/dropdown-menu";
import { TrashIcon } from "lucide-react";
import { DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { EllipsisVerticalIcon } from "lucide-react";
import twilio from "twilio";




export const loader = async ({ params }) => {
    const members = await db
        .select({
            user: users,
            role: usersTochurchOrganization.isAdmin
        })
        .from(usersTochurchOrganization)
        .where(eq(usersTochurchOrganization.churchOrganizationId, params.organization))
        .innerJoin(users, eq(users.id, usersTochurchOrganization.userId));

    return { members };
};

//action to send twilio voice call to user
export const action = async ({ request, params }) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioClient = twilio(accountSid, authToken);
    console.log(authToken);
    const formData = await request.formData();
    const requestType = formData.get("requestType");

    if (requestType === "call") {
        const userId = formData.get("userId");

        const user = await db.select().from(users).where(eq(users.id, userId)).then(res => res[0]);

        const response = await twilioClient.calls.create({
            url: "http://demo.twilio.com/docs/voice.xml",
            to: "+13347144389",
            from: "+18445479466",
        });
        console.log(response);
        return response;
    }
};

export default function MembersList() {
    const { members } = useLoaderData<typeof loader>();
    const navigate = useNavigate();
    const deleteFetcher = useFetcher();
    const submit = useSubmit();
    const params = useParams();

    return (
        <PageLayout title="Members" actions={<Button onClick={() => navigate("add")}>Add Member</Button>}>
            <List>
                {members.length === 0 ? (
                    <NoData message="No members found" />
                ) : (
                    members?.map((member) => (
                        <div key={member.user.id} className="flex items-center p-4 border-b">
                            <Avatar className="h-10 w-10 mr-4">
                                <AvatarImage src={member.user.avatarUrl || undefined} />
                                <AvatarFallback>
                                    {member.user.firstName?.[0]}
                                    {member.user.lastName?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <Stack className="flex-1">
                                <DataDisplay label="Name" value={`${member.user.firstName} ${member.user.lastName}`}>
                                    {member.user.firstName} {member.user.lastName}
                                </DataDisplay>
                                <Stack direction="horizontal">
                                    <DataDisplay label="Role">
                                        {member.role ? "Admin" : "Member"}
                                    </DataDisplay>

                                    <DataDisplay label="Email">
                                        {member.user.email}
                                    </DataDisplay>
                                </Stack>
                            </Stack>
                            <DropdownMenu>
                                <DropdownMenuTrigger>
                                    <Button variant="ghost" size="icon">
                                        <EllipsisVerticalIcon className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => navigate(`${member.user.id}/update`)}>
                                        <PencilIcon className="h-4 w-4 mr-2" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => submit({ requestType: "call", userId: member.user.id }, { method: "post", action: `/churches/${params.organization}/members` })}>
                                        <PhoneIcon className="h-4 w-4 mr-2" />
                                        Call
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600" onClick={() => deleteFetcher.submit({}, { method: "delete", action: `${member.user.id}/update` })}>
                                        <TrashIcon className="h-4 w-4 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ))
                )}
            </List>
            <Outlet />
        </PageLayout>
    );
}
