import {
	churchOrganization,
	teams as teamsTable,
	userPreferences,
	users,
	usersToTeams,
	usersTochurchOrganization,
} from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { useContext } from "react";
import {
	Outlet,
	useActionData,
	useFetcher,
	useLoaderData,
	useNavigate,
	useParams,
	useSubmit,
} from "react-router";

import { db } from "~/server/dbConnection";
import { PageLayout } from "~/src/components/layout/PageLayout";
import { UserContext } from "~/src/providers/userProvider";

import { PermissionsService } from "@/server/services/PermissionsService";
import sgMail from "@sendgrid/mail";
import {
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import {
	EllipsisVerticalIcon,
	MessageSquareIcon,
	PencilIcon,
	TrashIcon,
	UserPlusIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import twilio from "twilio";
import { MessageComposer } from "~/components/messaging/MessageComposer";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { DeleteConfirm } from "~/src/components/confirm/DeleteConfirm";
import { TeamsDataService } from "@/server/dataServices/TeamsDataService";
import { OrganizationRolesDataService } from "@/server/dataServices/OrganizationRolesDataService";
import { OrganizationDataService } from "@/server/dataServices/OrganizationDataService";
import { createAuthLoader } from "~/server/auth/authLoader";

export const loader = createAuthLoader(
	async ({ request, auth, params, userContext }) => {
		const user = userContext?.user;
		// Initialize services
		const permissionsService = new PermissionsService();
		const teamsDataService = new TeamsDataService();
		const rolesDataService = new OrganizationRolesDataService();
		const organizationDataService = new OrganizationDataService();

		// Get permissions and member data in parallel
		const [permissions, members, teams, roles] = await Promise.all([
			permissionsService.getMemberPermissions(user.id, params.organization),
			organizationDataService.getOrganizationMembers(params.organization),
			teamsDataService.getOrganizationTeams(params.organization),
			rolesDataService.getOrganizationRoles(params.organization),
		]);

		// Transform member data
		const transformedMembers = members.map((member) => ({
			...member,
			teams: Array.isArray(member.teams)
				? member.teams
				: [member.teams].filter(Boolean),
		}));

		return {
			members: transformedMembers,
			teams,
			roles,
			permissions,
		};
	},
	true,
);

const formatPhoneNumber = (phone: string) => {
	// Remove any non-digit characters
	const cleaned = phone.replace(/\D/g, "");

	// Ensure it starts with 1 for US numbers
	const withCountry = cleaned.startsWith("1") ? cleaned : `1${cleaned}`;

	// Add + prefix if not present
	return withCountry.startsWith("+") ? withCountry : `+${withCountry}`;
};

export const action = async ({ request, params }) => {
	const accountSid = process.env.TWILIO_ACCOUNT_SID;
	const authToken = process.env.TWILIO_AUTH_TOKEN;

	const twilioClient = twilio(accountSid, authToken);
	const formData = await request.formData();
	sgMail.setApiKey(process.env.SENDGRID_API_KEY);

	const message = formData.get("message");
	const messageType = formData.get("type");
	const userIds = formData.getAll("userIds[]");
	const format = formData.get("format")
		? JSON.parse(formData.get("format"))
		: undefined;
	const templateId = formData.get("templateId");
	const subject = formData.get("subject");
	const messagesSent = [];

	// Get the organization details for template personalization
	const organization = await db
		.select()
		.from(churchOrganization)
		.where(eq(churchOrganization.id, params.organization))
		.then((res) => res[0]);

	for (const userId of userIds) {
		const user = await db
			.select()
			.from(users)
			.where(eq(users.id, userId))
			.then((res) => res[0]);
		const userPreferencesResponse = await db
			.select()
			.from(userPreferences)
			.where(eq(userPreferences.userId, userId))
			.then((res) => res[0]);

		if (messageType === "alert") {
			// Send using user's preferred method
			if (userPreferencesResponse.phoneNotifications) {
				const usersPhone = user.phone?.startsWith("1")
					? user.phone
					: `1${user.phone}`;
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
				};
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
		} else {
			// Send using specified method
			if (messageType === "phone") {
				const usersPhone = formatPhoneNumber(user.phone);
				await twilioClient.calls.create({
					twiml: `<Response><Say>Hello, ${user.firstName}! ${message}</Say></Response>`,
					to: usersPhone,
					from: "+18445479466",
				});
				messagesSent.push(`call to ${user.firstName}`);
			} else if (messageType === "email") {
				let personalizedSubject = subject;
				let personalizedMessage = message;

				if (templateId) {
					// Replace template variables
					const replacements = {
						"{first_name}": user.firstName,
						"{church_name}": organization.name,
					};

					personalizedSubject = subject.replace(
						/{first_name}|{church_name}/g,
						(match) => replacements[match],
					);

					personalizedMessage = message.replace(
						/{first_name}|{church_name}/g,
						(match) => replacements[match],
					);
				}

				const email = {
					to: user.email,
					from: "gracecommunitybrunswick@gmail.com",
					subject: personalizedSubject,
					text: personalizedMessage.replace(/<[^>]*>/g, ""), // Strip HTML for plain text version
					html: personalizedMessage, // TinyMCE output is already HTML
				};
				await sgMail.send(email);
				messagesSent.push(`email to ${user.firstName}`);
			} else if (messageType === "sms") {
				const formattedPhone = formatPhoneNumber(user.phone);
				await twilioClient.messages.create({
					to: formattedPhone,
					from: "+18445479466",
					body: message,
				});
				messagesSent.push(`text to ${user.firstName}`);
			}
		}
	}

	return {
		success: true,
		message: `Messages sent: ${messagesSent.join(", ")}`,
	};
};

export default function MembersList() {
	const { members, roles, teams, permissions } = useLoaderData<typeof loader>();
	const { user } = useContext(UserContext);

	const params = useParams();

	const navigate = useNavigate();
	const actionData = useActionData<typeof action>();
	const deleteFetcher = useFetcher();
	const submit = useSubmit();
	const fetcher = useFetcher();
	const [message, setMessage] = useState("");
	const [showCommunicationModal, setShowCommunicationModal] = useState(false);
	const [selectedMemberId, setSelectedMemberId] = useState(null);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [rowSelection, setRowSelection] = useState({});
	const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
	const [selectedRole, setSelectedRole] = useState<string | null>(null);

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
		const selectedMembers = Object.keys(rowSelection).map(
			(index) => members[Number.parseInt(index, 10)].user.id,
		);
		const formData = new FormData();
		formData.append("message", message);
		for (const id of selectedMembers) {
			formData.append("userIds[]", id);
		}
		await submit(formData, { method: "post" });
	};

	const handleDelete = async () => {
		const response = await fetcher.submit(
			{
				userId: selectedMemberId,
			},
			{
				method: "delete",
				action: `/churches/${params.organization}/members/${selectedMemberId}`,
			},
		);
	};

	// Memoize the filtered members
	const filteredMembers = useMemo(() => {
		return members.filter((member) => {
			if (
				selectedTeam &&
				selectedTeam !== "all" &&
				!member.teams?.find((t) => t.teamId === selectedTeam)
			)
				return false;
			if (
				selectedRole &&
				selectedRole !== "all" &&
				!member.roles?.find((r) => r.organizationRoleId === selectedRole)
			)
				return false;
			return true;
		});
	}, [members, selectedTeam, selectedRole]);

	// Memoize the columns configuration
	const columns = useMemo(
		() => [
			// Only show select column if user is authenticated and can message members
			...(user && permissions.canMessage
				? [
						{
							accessorKey: "select",
							header: ({ table }) => (
								<Checkbox
									checked={table.getIsAllPageRowsSelected()}
									onCheckedChange={(value) =>
										table.toggleAllPageRowsSelected(!!value)
									}
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
					]
				: []),
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
				accessorKey: "teams",
				header: "Teams",
				cell: ({ row }) => {
					const memberTeams = teams.filter((team) =>
						row.original.teams?.some((ut) => ut.teamId === team.team.id),
					);
					return (
						<div className="flex gap-1 flex-wrap">
							{memberTeams.map((team) => (
								<Badge
									key={team.team.id}
									style={{ backgroundColor: team.team.color || "#666" }}
								>
									{team.team.name}
								</Badge>
							))}
						</div>
					);
				},
			},
			{
				accessorKey: "roles",
				header: "Roles",
				cell: ({ row }) => {
					console.log(row.original);
					const memberRoles = roles.organizationRoles.filter((role) =>
						row.original.roles?.some((ur) => ur.organizationRoleId === role.id),
					);
					return (
						<div className="flex gap-1 flex-wrap">
							{memberRoles.map((role) => (
								<Badge key={role.id} variant="secondary">
									{role.name}
								</Badge>
							))}
						</div>
					);
				},
			},
			// Only show actions column if user has any permissions
			...(permissions.canEdit || permissions.canDelete || permissions.canAssign
				? [
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
											{permissions.canEdit && (
												<DropdownMenuItem
													onClick={() => navigate(`${member.user.id}/update`)}
												>
													<PencilIcon className="h-4 w-4 mr-2" />
													Edit
												</DropdownMenuItem>
											)}
											{permissions.canAssign && (
												<DropdownMenuItem
													onClick={() => {
														navigate(`${member.user.id}/assign`);
													}}
												>
													<UserPlusIcon className="h-4 w-4 mr-2" />
													Edit Teams & Roles
												</DropdownMenuItem>
											)}
											{permissions.canDelete && (
												<DropdownMenuItem
													onClick={() => {
														setSelectedMemberId(member.user.id);
														setShowDeleteConfirm(true);
													}}
												>
													<TrashIcon className="h-4 w-4 mr-2" />
													Delete
												</DropdownMenuItem>
											)}
										</DropdownMenuContent>
									</DropdownMenu>
								);
							},
						},
					]
				: []),
		],
		[navigate, roles, permissions, user],
	);

	const table = useReactTable({
		data: filteredMembers,
		columns,
		getCoreRowModel: getCoreRowModel(),
		onRowSelectionChange: setRowSelection,
		state: {
			rowSelection,
		},
		enableRowSelection: true,
		// Disable features we're not using to improve performance
		enableSorting: false,
		enableFilters: false,
		enableColumnFilters: false,
	});

	const selectedCount = Object.keys(rowSelection).length;

	const selectedMembersList = Object.keys(rowSelection).map((index) => {
		const member = members[Number.parseInt(index, 10)];
		return {
			...member.user,
			preferences: member.preferences,
		};
	});

	return (
		<PageLayout
			title="Members"
			actions={
				<div className="flex gap-2">
					{user && permissions.canMessage && selectedCount > 0 && (
						<Button onClick={() => setShowCommunicationModal(true)}>
							<MessageSquareIcon className="h-4 w-4 mr-2" />
							Message Selected ({selectedCount})
						</Button>
					)}
					{permissions.canAdd && (
						<Button onClick={() => navigate("add")}>
							<UserPlusIcon className="h-4 w-4 mr-2" />
							Add Member
						</Button>
					)}
				</div>
			}
		>
			<div className="space-y-4">
				<div className="flex gap-4">
					<div className="w-48">
						<Label>Filter by Team</Label>
						<Select
							value={selectedTeam || undefined}
							onValueChange={setSelectedTeam}
						>
							<SelectTrigger className="text-gray-900">
								<SelectValue placeholder="All Teams" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Teams</SelectItem>
								{teams.map((team) => (
									<SelectItem key={team.team.id} value={team.team.id}>
										{team.team.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="w-48">
						<Label>Filter by Role</Label>
						<Select
							value={selectedRole || undefined}
							onValueChange={setSelectedRole}
						>
							<SelectTrigger className="text-gray-900">
								<SelectValue placeholder="All Roles" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Roles</SelectItem>
								{roles.organizationRoles.map((role) => (
									<SelectItem key={role.id} value={role.id}>
										{role.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="rounded-md border">
					<Table>
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<TableHead
											key={header.id}
											className="text-gray-900 font-medium"
										>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows?.length ? (
								table
									.getRowModel()
									.rows.slice(0, 50)
									.map((row) => {
										const selected = row.getIsSelected();
										return (
											<TableRow
												key={row.id}
												data-state={row.getIsSelected() && "selected"}
											>
												{row.getVisibleCells().map((cell) => (
													<TableCell
														key={cell.id}
														className={` ${selected ? "text-white-500" : "text-gray-900"}`}
													>
														{flexRender(
															cell.column.columnDef.cell,
															cell.getContext(),
														)}
													</TableCell>
												))}
											</TableRow>
										);
									})
							) : (
								<TableRow>
									<TableCell
										colSpan={columns.length}
										className="h-24 text-center text-gray-900"
									>
										No members found.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</div>

			<Dialog
				open={showCommunicationModal}
				onOpenChange={setShowCommunicationModal}
			>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Message Members</DialogTitle>
					</DialogHeader>

					<MessageComposer
						selectedMembers={selectedMembersList}
						onSend={async (data) => {
							const formData = new FormData();
							console.log(data);
							formData.append("message", data.message);
							formData.append("type", data.type);
							if (data.subject) {
								formData.append("subject", data.subject);
							}
							if (data.templateId) {
								formData.append("templateId", data.templateId);
							}
							if (data.format) {
								formData.append("format", JSON.stringify(data.format));
							}
							for (const id of Object.keys(rowSelection).map(
								(index) => members[Number.parseInt(index, 10)].user.id,
							)) {
								formData.append("userIds[]", id);
							}
							await submit(formData, { method: "post" });
						}}
						onCancel={() => setShowCommunicationModal(false)}
					/>
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
