import { userPreferences, users, usersTochurchOrganization } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { Outlet, useActionData, useFetcher, useLoaderData, useNavigate, useParams, useSubmit } from "react-router";
import { db } from "~/server/dbConnection";
import { PageLayout } from "~/src/components/layout/PageLayout";

import { EllipsisVerticalIcon, MailIcon, MessageSquareIcon, PencilIcon, PhoneIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table"
import { toast } from "sonner";
import twilio from "twilio";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Input } from "~/src/components/forms/input/Input";
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { DeleteConfirm } from "~/src/components/confirm/DeleteConfirm";
import sgMail from "@sendgrid/mail";
import { Checkbox } from "~/components/ui/checkbox";

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

const formatPhoneNumber = (phone: string) => {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Ensure it starts with 1 for US numbers
    const withCountry = cleaned.startsWith('1') ? cleaned : `1${cleaned}`;

    // Add + prefix if not present
    return withCountry.startsWith('+') ? withCountry : `+${withCountry}`;
};

export const action = async ({ request, params }) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioClient = twilio(accountSid, authToken);
    const formData = await request.formData();
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const message = formData.get("message");
    const userIds = formData.getAll("userIds[]");
    let messagesSent = [];

    for (const userId of userIds) {
        const user = await db.select().from(users).where(eq(users.id, userId)).then(res => res[0]);
        const userPreferencesResponse = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).then(res => res[0]);

        if (userPreferencesResponse.phoneNotifications) {
            const usersPhone = user.phone?.startsWith('1') ? user.phone : `1${user.phone}`;
            await twilioClient.calls.create({
                twiml: `<Response><Say>Hello, ${user.firstName}! ${message}</Say></Response>`,
                to: `+${usersPhone}`,
                from: "+18445479466",
            });
            messagesSent.push(`call to ${user.firstName}`);
        }

        if (userPreferencesResponse.emailNotifications) {
            const email = {
                to: user.email,
                from: "gracecommunitybrunswick@gmail.com",
                subject: "Church App Message",
                text: message,
            }
            await sgMail.send(email);
            messagesSent.push(`email to ${user.firstName}`);
        }

        if (userPreferencesResponse.smsNotifications) {
            const formattedPhone = formatPhoneNumber(user.phone);
            await twilioClient.messages.create({
                to: formattedPhone,
                from: "+18445479466",
                body: message,
            });
            messagesSent.push(`text to ${user.firstName}`);
        }
    }

    return { success: true, message: `Messages sent: ${messagesSent.join(', ')}` };
};

export default function MembersList() {
    const { members } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigate = useNavigate();
    const deleteFetcher = useFetcher();
    const submit = useSubmit();
    const fetcher = useFetcher();
    const params = useParams();
    const [message, setMessage] = useState("");
    const [showCommunicationModal, setShowCommunicationModal] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [rowSelection, setRowSelection] = useState({});

    useEffect(() => {
        if (actionData?.success) {
            toast.success(actionData.message);
            setShowCommunicationModal(false);
            setMessage("");
            setRowSelection({});
        }
    }, [actionData]);

    useEffect(() => {
        if (fetcher.data?.success) {
            toast.success("Member deleted");
            setShowDeleteConfirm(false);
        } else if (fetcher.data?.error) {
            toast.error("Failed to delete member");
        }
    }, [fetcher.data]);

    const handleCommunication = async () => {
        const selectedMembers = Object.keys(rowSelection).map(index => members[parseInt(index)].user.id);
        const formData = new FormData();
        formData.append("message", message);
        selectedMembers.forEach(id => formData.append("userIds[]", id));

        await submit(formData, { method: "post" });
    };

    const handleDelete = async () => {
        const response = await fetcher.submit({
            userId: selectedMemberId,
        }, {
            method: "delete",
            action: `/churches/${params.organization}/members/${selectedMemberId}`
        });
    }

    const columns = [
        {
            accessorKey: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "user.firstName",
            header: "First Name",
        },
        {
            accessorKey: "user.lastName",
            header: "Last Name",
        },
        {
            accessorKey: "user.email",
            header: "Email",
        },
        {
            accessorKey: "role",
            header: "Role",
            cell: ({ row }) => (
                row.getValue("role") ? "Admin" : "Member"
            ),
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const member = row.original;
                return (
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
                            <DropdownMenuItem onClick={() => {
                                setSelectedMemberId(member.user.id);
                                setShowDeleteConfirm(true);
                            }}>
                                <TrashIcon className="h-4 w-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            }
        }
    ]

    const table = useReactTable({
        data: members,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onRowSelectionChange: setRowSelection,
        state: {
            rowSelection,
        },
    })

    const selectedCount = Object.keys(rowSelection).length;

    return (
        <PageLayout title="Members" actions={
            <div className="flex gap-2">
                {selectedCount > 0 && (
                    <Button onClick={() => setShowCommunicationModal(true)}>
                        <MessageSquareIcon className="h-4 w-4 mr-2" />
                        Message Selected ({selectedCount})
                    </Button>
                )}
                <Button onClick={() => navigate("add")}>Add Member</Button>
            </div>
        }>
            <Table className="w-full text-gray-900">
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                className={row.getIsSelected() ? "text-white" : ""}
                                data-state={row.getIsSelected() && "selected"}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={columns.length}
                                className="h-24 text-center"
                            >
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <Dialog open={showCommunicationModal} onOpenChange={setShowCommunicationModal} >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send Message to {selectedCount} Members</DialogTitle>
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

                        <Button onClick={handleCommunication}>Send</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <DeleteConfirm
                title="Delete Member"
                description="Are you sure you want to delete this member?"
                loading={fetcher.state === "submitting"}
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                onConfirm={handleDelete}
            />

            <Outlet />
        </PageLayout>
    );
}
