import { eq } from "drizzle-orm";
import { Form, Outlet, useActionData, useFetcher, useLoaderData, useNavigate, useParams, useSubmit } from "react-router";
import { users, usersTochurchOrganization } from "@/server/db/schema";
import { db } from "~/server/dbConnection";
import { PageLayout } from "~/src/components/layout/PageLayout";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { NoData } from "~/components/ui/no-data";
import List from "~/src/components/listItems/List";
import { DataDisplay } from "~/src/components/dataDisplay/data";
import { Stack } from "~/src/components/layout/Stack";
import { PencilIcon, PhoneIcon, MailIcon, MessageSquareIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "~/components/ui/dropdown-menu";
import { TrashIcon } from "lucide-react";
import { DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { EllipsisVerticalIcon } from "lucide-react";
import twilio from "twilio";
import { Input } from "~/src/components/forms/input/Input";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Label } from "~/components/ui/label";
import { toast } from "sonner";

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
    const formData = await request.formData();
    const requestType = formData.get("requestType");

    const message = formData.get("message");
    console.log("request type", requestType);
    console.log("message", message);

    switch (requestType) {
        case "call": {

            const userId = formData.get("userId");

            const user = await db.select().from(users).where(eq(users.id, userId)).then(res => res[0]);

            const response = await twilioClient.calls.create({
                twiml: `<Response><Play>https://drive.google.com/file/d/1W9jN3a-ccPld4rH7qt2O0_qpCYP4olKU/view?usp=drive_link</Play><Say>Hello, ${user.firstName}! ${message}</Say></Response>`,
                to: `+${user.phone?.startsWith('1') ? user.phone : '1' + user.phone}`,
                from: "+18445479466",
            });

            console.log("response", response);

            return { success: true, message: "Call sent" };
        }
        case "email": {
            const userId = formData.get("userId");
            const user = await db.select().from(users).where(eq(users.id, userId)).then(res => res[0]);
            const response = await twilioClient.messages.create({
                to: user.email,
                from: "+18445479466",
                body: message,
            });
            return { success: true, message: "Email sent" };
        }
        case "text": {
            const userId = formData.get("userId");
            const user = await db.select().from(users).where(eq(users.id, userId)).then(res => res[0]);
            const response = await twilioClient.messages.create({
                to: user.phone,
                from: "+18445479466",
                body: message,
            });
            return { success: true, message: "Text sent" };
        }
        default:
            return { success: false, message: "Invalid request type" };
    }
};

export default function MembersList() {
    const { members } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigate = useNavigate();
    const deleteFetcher = useFetcher();
    const submit = useSubmit();
    const params = useParams();
    const [message, setMessage] = useState("");
    const [communicationType, setCommunicationType] = useState("call");
    const [showCommunicationModal, setShowCommunicationModal] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState(null);

    useEffect(() => {
        if (actionData?.success) {
            toast.success(actionData.message);
            setShowCommunicationModal(false);
            setMessage("");
        }
    }, [actionData]);

    const handleCommunication = async () => {

        await submit(
            { requestType: communicationType, userId: selectedMemberId, message },
            { method: "post", action: `/churches/${params.organization}/members` }
        );

    };

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
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setSelectedMemberId(member.user.id);
                                            setShowCommunicationModal(true);
                                        }}
                                    >
                                        <MessageSquareIcon className="h-4 w-4 mr-2" />
                                        Communicate
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

            <Dialog open={showCommunicationModal} onOpenChange={setShowCommunicationModal} >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send Communication</DialogTitle>
                    </DialogHeader>


                    <div className="space-y-4 bg-white p-4 rounded-md">
                        <div>
                            <Label>Message</Label>
                            <Input
                                name="message"
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Enter your message..."
                            />
                        </div>
                        <RadioGroup value={communicationType} onValueChange={setCommunicationType}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="call" id="call" />
                                <Label htmlFor="call"><PhoneIcon className="h-4 w-4 inline mr-2" />Phone Call</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="email" id="email" />
                                <Label htmlFor="email"><MailIcon className="h-4 w-4 inline mr-2" />Email</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="text" id="text" />
                                <Label htmlFor="text"><MessageSquareIcon className="h-4 w-4 inline mr-2" />Text Message</Label>
                            </div>
                        </RadioGroup>
                        <Button onClick={handleCommunication}>Send</Button>
                    </div>

                </DialogContent>
            </Dialog>

            <Outlet />
        </PageLayout>
    );
}
