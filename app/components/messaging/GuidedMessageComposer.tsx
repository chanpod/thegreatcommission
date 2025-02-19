import { useState, useEffect } from "react";
import {
	Bell,
	Mail,
	MessageSquare,
	Search,
	X,
	AlertCircle,
	Users,
} from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { MessageEditor } from "./MessageEditor";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { useFetcher, useSubmit } from "react-router";
import type { MessageValue } from "./MessageEditor";
import { Alert, AlertDescription } from "~/components/ui/alert";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Input } from "~/src/components/forms/input/Input";

export type MessageData = {
	message: string;
	subject?: string;
	type: "email" | "phone" | "alert" | "sms";
	templateId?: string;
	format?: {
		html?: boolean;
		richText?: boolean;
	};
};

type GuidedMessageComposerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSend: (data: MessageData) => Promise<void>;
	organizationId: string;
};

type Recipient = {
	type: "user" | "team";
	id: string;
	name: string;
	warnings?: string[];
};

export function GuidedMessageComposer({
	open,
	onOpenChange,
	onSend,
	organizationId,
}: GuidedMessageComposerProps) {
	const usersFetcher = useFetcher();
	const submit = useSubmit();
	const [step, setStep] = useState(1);
	const [messageType, setMessageType] = useState<MessageData["type"]>();
	const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(
		new Set(),
	);
	const [recipientType, setRecipientType] = useState<"users" | "teams">(
		"users",
	);
	const [searchTerm, setSearchTerm] = useState("");
	const [messageData, setMessageData] = useState<MessageValue>({
		message: "",
	});

	useEffect(() => {
		if (open && usersFetcher.state === "idle" && !usersFetcher.data) {
			usersFetcher.load(`/churches/${organizationId}/users`);
		}
	}, [open, organizationId, usersFetcher]);

	const availableUsers = usersFetcher.data?.users ?? [];
	const availableTeams = usersFetcher.data?.teams ?? [];
	const isLoading = usersFetcher.state !== "idle";

	const handleNext = () => setStep(step + 1);
	const handleBack = () => setStep(step - 1);

	const filteredRecipients =
		recipientType === "users"
			? availableUsers.filter((user) =>
					`${user.firstName} ${user.lastName} ${user.email}`
						.toLowerCase()
						.includes(searchTerm.toLowerCase()),
				)
			: availableTeams.filter((team) =>
					team.name.toLowerCase().includes(searchTerm.toLowerCase()),
				);

	const getPreferenceWarnings = (user: (typeof availableUsers)[0]) => {
		const warnings: string[] = [];

		if (messageType === "email" && !user.preferences?.emailNotifications) {
			warnings.push("Email notifications disabled");
		}
		if (messageType === "sms" && !user.preferences?.smsNotifications) {
			warnings.push("SMS notifications disabled");
		}
		if (messageType === "phone" && !user.preferences?.phoneNotifications) {
			warnings.push("Phone notifications disabled");
		}
		if (messageType === "alert") {
			if (
				!user.preferences?.emailNotifications &&
				!user.preferences?.smsNotifications &&
				!user.preferences?.phoneNotifications
			) {
				warnings.push("All notifications disabled");
			}
		}
		if (messageType === "sms" || messageType === "phone") {
			if (!user.phone) {
				warnings.push("No phone number");
			}
		}

		return warnings;
	};

	const getSelectedRecipients = (): Recipient[] => {
		return Array.from(selectedRecipients)
			.map((id) => {
				const [type, actualId] = id.split(":");
				if (type === "user") {
					const user = availableUsers.find((u) => u.id === actualId);
					if (!user) return null;
					return {
						type: "user",
						id: user.id,
						name: `${user.firstName} ${user.lastName}`,
						warnings: getPreferenceWarnings(user),
					};
				} else {
					const team = availableTeams.find((t) => t.id === actualId);
					if (!team) return null;
					return {
						type: "team",
						id: team.id,
						name: team.name,
					};
				}
			})
			.filter(Boolean);
	};

	const hasWarnings = getSelectedRecipients().some(
		(r) => r.warnings?.length > 0,
	);

	const handleSend = async () => {
		if (!messageType || !messageData.message) return;

		const data: MessageData = {
			type: messageType,
			message: messageData.message,
			...(messageData.subject && { subject: messageData.subject }),
			...(messageData.templateId && { templateId: messageData.templateId }),
			...(messageData.format && { format: messageData.format }),
		};

		// Add selected recipients to form data
		const formData = new FormData();
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
		// Add selected recipient IDs
		for (const recipient of getSelectedRecipients()) {
			formData.append("recipientIds[]", `${recipient.type}:${recipient.id}`);
		}

		await submit(formData, {
			method: "post",
			action: `/churches/${organizationId}/message`,
		});
		handleClose();
	};

	const handleClose = () => {
		setStep(1);
		setMessageType(undefined);
		setSelectedRecipients(new Set());
		setMessageData({
			message: "",
		});
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Send Message</DialogTitle>
				</DialogHeader>

				{step === 1 && (
					<div className="space-y-4">
						<h3 className="text-lg font-semibold">Select Message Type</h3>
						<div className="grid grid-cols-3 gap-4">
							<Button
								variant="outline"
								className={`p-6 h-auto flex flex-col items-center ${
									messageType === "alert" ? "border-primary bg-primary/5" : ""
								}`}
								onClick={() => {
									setMessageType("alert");
									handleNext();
								}}
							>
								<Bell className="!h-6 !w-6 mb-2" />
								<span>Alert</span>
							</Button>
							<Button
								variant="outline"
								className={`p-6 h-auto flex flex-col items-center ${
									messageType === "sms" ? "border-primary bg-primary/5" : ""
								}`}
								onClick={() => {
									setMessageType("sms");
									handleNext();
								}}
							>
								<MessageSquare className="!h-6 !w-6 mb-2" />
								<span>SMS</span>
							</Button>
							<Button
								variant="outline"
								className={`p-6 h-auto flex flex-col items-center ${
									messageType === "email" ? "border-primary bg-primary/5" : ""
								}`}
								onClick={() => {
									setMessageType("email");
									handleNext();
								}}
							>
								<Mail className="!h-6 !w-6 mb-2" />
								<span>Email</span>
							</Button>
						</div>
					</div>
				)}

				{step === 2 && (
					<div className="space-y-4">
						<h3 className="text-lg font-semibold">Select Recipients</h3>

						{isLoading ? (
							<div className="flex items-center justify-center p-6">
								<div className="animate-spin rounded-full !h-6 !w-6 border-b-2 border-primary" />
							</div>
						) : (
							<>
								<div className="space-y-4">
									<Select
										onValueChange={(teamId) => {
											const newSelected = new Set(selectedRecipients);
											newSelected.add(`team:${teamId}`);
											setSelectedRecipients(newSelected);
										}}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Add team..." />
										</SelectTrigger>
										<SelectContent>
											{availableTeams
												.filter(
													(team) => !selectedRecipients.has(`team:${team.id}`),
												)
												.map((team) => (
													<SelectItem key={team.id} value={team.id}>
														<div className="flex items-center gap-2">
															<Users className="!h-4 !w-4 text-muted-foreground" />
															<span>{team.name}</span>
														</div>
													</SelectItem>
												))}
										</SelectContent>
									</Select>

									<div className="relative">
										<Input
											name="search"
											type="text"
											placeholder="Search users..."
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
											prefix={<Search className="!h-5 !w-5" />}
										/>
									</div>
								</div>

								<div className="flex flex-wrap gap-2 min-h-[2.5rem]">
									{getSelectedRecipients().map((recipient) => (
										<Badge
											key={`${recipient.type}:${recipient.id}`}
											variant={
												recipient.warnings?.length > 0
													? "destructive"
													: "secondary"
											}
											className="flex items-center gap-1"
										>
											{recipient.type === "team" && (
												<Users className="!h-3 !w-3" />
											)}
											{recipient.name}
											{recipient.warnings?.length > 0 && (
												<AlertCircle
													style={{ width: "12px", height: "12px" }}
												/>
											)}
											<button
												type="button"
												className="ml-1 hover:text-destructive-foreground"
												onClick={() => {
													const newSelected = new Set(selectedRecipients);
													newSelected.delete(
														`${recipient.type}:${recipient.id}`,
													);
													setSelectedRecipients(newSelected);
												}}
											>
												<X style={{ width: "12px", height: "12px" }} />
											</button>
										</Badge>
									))}
								</div>

								<ScrollArea className="h-[300px] border rounded-md">
									{availableUsers
										.filter((user) =>
											`${user.firstName} ${user.lastName} ${user.email}`
												.toLowerCase()
												.includes(searchTerm.toLowerCase()),
										)
										.map((user) => {
											const warnings = getPreferenceWarnings(user);
											return (
												<label
													key={user.id}
													className="flex items-center p-3 hover:bg-muted"
													htmlFor={`user-${user.id}`}
												>
													<Checkbox
														id={`user-${user.id}`}
														checked={selectedRecipients.has(`user:${user.id}`)}
														onCheckedChange={(checked) => {
															const newSelected = new Set(selectedRecipients);
															if (checked) {
																newSelected.add(`user:${user.id}`);
															} else {
																newSelected.delete(`user:${user.id}`);
															}
															setSelectedRecipients(newSelected);
														}}
														className="mr-3"
													/>
													<div className="flex-1">
														<div className="flex items-center gap-2">
															<span>
																{user.firstName} {user.lastName}
															</span>
															{warnings.length > 0 && (
																<AlertCircle
																	style={{
																		width: "16px",
																		height: "16px",
																	}}
																	className="text-destructive"
																/>
															)}
														</div>
														<div className="text-sm text-muted-foreground">
															{user.email}
															{warnings.length > 0 && (
																<div className="text-destructive">
																	{warnings.join(", ")}
																</div>
															)}
														</div>
													</div>
												</label>
											);
										})}
								</ScrollArea>
							</>
						)}
					</div>
				)}

				{step === 3 && (
					<div className="space-y-4">
						<h3 className="text-lg font-semibold">Compose Message</h3>
						<MessageEditor
							type={messageType}
							onChange={setMessageData}
							value={messageData}
						/>
					</div>
				)}

				<div className="flex justify-between mt-6">
					{step > 1 && (
						<Button variant="outline" onClick={handleBack}>
							Back
						</Button>
					)}
					{step < 3 ? (
						<Button
							className="ml-auto"
							onClick={handleNext}
							disabled={step === 2 && selectedRecipients.size === 0}
						>
							Next
						</Button>
					) : (
						<Button
							className="ml-auto"
							onClick={handleSend}
							disabled={!messageData.message}
						>
							Send
						</Button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
