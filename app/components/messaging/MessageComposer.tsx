import type { users, userPreferences } from "@/server/db/schema";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
	Bell,
	Mail,
	MessageSquare,
	Phone,
	AlertTriangle,
	Save,
	FileText,
	Eye,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";

import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { Alert, AlertDescription } from "~/components/ui/alert";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { toast } from "sonner";
import { EmailEditor, type EmailTemplate } from "./EmailEditor";

const MAX_ALERT_LENGTH = 160;

const EMAIL_TEMPLATES: EmailTemplate[] = [
	{
		id: "general-announcement",
		name: "General Announcement",
		subject: "Important Announcement from {church_name}",
		content:
			"<p>Dear {first_name},</p><p>We hope this email finds you well.</p><p>[Your announcement here]</p><p>Best regards,<br/>{church_name} Team</p>",
	},
	{
		id: "event-invitation",
		name: "Event Invitation",
		subject: "Join Us: Upcoming Event at {church_name}",
		content:
			"<p>Dear {first_name},</p><p>We're excited to invite you to our upcoming event:</p><p>[Event details here]</p><p>We hope to see you there!</p><p>Best regards,<br/>{church_name} Team</p>",
	},
	{
		id: "prayer-request",
		name: "Prayer Request",
		subject: "Prayer Request from {church_name}",
		content:
			"<p>Dear {first_name},</p><p>We're reaching out to our church family for prayer support.</p><p>[Prayer request details here]</p><p>Thank you for joining us in prayer.</p><p>In Christ,<br/>{church_name} Team</p>",
	},
];

interface MessageComposerProps {
	onSend: (data: {
		message: string;
		subject?: string;
		type: "alert" | "email" | "sms" | "phone";
		templateId?: string;
	}) => void;
	onCancel: () => void;
	selectedMembers: Array<
		typeof users.$inferSelect & {
			preferences: typeof userPreferences.$inferSelect;
		}
	>;
}

export function MessageComposer({
	onSend,
	onCancel,
	selectedMembers,
}: MessageComposerProps) {
	const [messageType, setMessageType] = useState<"alert" | "custom">("alert");
	const [customType, setCustomType] = useState<"email" | "sms" | "phone">(
		"email",
	);
	const [message, setMessage] = useState("");
	const [emailContent, setEmailContent] = useState("");
	const [subject, setSubject] = useState("");
	const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
		null,
	);

	const [isOpen, setIsOpen] = useState(false);
	const parentRef = useRef<HTMLDivElement>(null);
	const virtualizer = useVirtualizer({
		count: selectedMembers.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 80,
		overscan: 5,
	});

	// Force virtualizer to update when popover opens
	useEffect(() => {
		if (isOpen) {
			virtualizer.measure();
		}
	}, [isOpen, virtualizer]);

	const handleSend = () => {
		if (messageType === "custom" && customType === "email") {
			if (!emailContent.trim()) return;
			onSend({
				message: emailContent,
				subject,
				type: customType,
				templateId: selectedTemplateId || undefined,
			});
		} else {
			if (!message.trim()) return;
			onSend({
				message,
				type: messageType === "alert" ? "alert" : customType,
			});
		}
	};

	const handleSaveDraft = () => {
		const draft = {
			type: messageType,
			customType,
			message:
				messageType === "custom" && customType === "email"
					? emailContent
					: message,
			subject,
			templateId: selectedTemplateId,
		};
		localStorage.setItem("messageDraft", JSON.stringify(draft));
		toast.success("Draft saved successfully");
	};

	const isAlertTooLong =
		messageType === "alert" && message.length > MAX_ALERT_LENGTH;

	const getWarnings = () => {
		const warnings = [];
		const unreachableMembers = selectedMembers.filter((member) => {
			if (customType === "email") {
				return !member.email || !member.preferences.emailNotifications;
			}
			if (customType === "sms" || customType === "phone") {
				return (
					!member.phone ||
					(customType === "sms" && !member.preferences.smsNotifications) ||
					(customType === "phone" && !member.preferences.phoneNotifications)
				);
			}
			return false;
		});

		if (unreachableMembers.length > 0) {
			warnings.push({
				type: customType,
				members: unreachableMembers,
				count: unreachableMembers.length,
			});
		}
		return warnings;
	};

	const warnings = getWarnings();

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-2">
					<h2 className="text-lg font-semibold">Send Message to</h2>
					<Popover open={isOpen} onOpenChange={setIsOpen}>
						<PopoverTrigger asChild>
							<Button variant="outline" className="font-medium">
								{selectedMembers.length} Members
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-80">
							<div className="p-3 border-b">
								<h3 className="font-medium">Selected Members</h3>
							</div>
							<div ref={parentRef} className="max-h-[300px] overflow-auto">
								<div
									style={{
										height: `${virtualizer.getTotalSize()}px`,
										width: "100%",
										position: "relative",
									}}
								>
									{virtualizer.getVirtualItems().map((virtualRow) => {
										const member = selectedMembers[virtualRow.index];
										return (
											<div
												key={member.id}
												style={{
													position: "absolute",
													top: 0,
													left: 0,
													width: "100%",
													height: `${virtualRow.size}px`,
													transform: `translateY(${virtualRow.start}px)`,
												}}
												className="p-3 border-b last:border-0"
											>
												<div className="flex flex-col">
													<span className="font-medium">
														{member.firstName} {member.lastName}
														<div className="flex flex-row space-x-1">
															<div>
																{member.preferences.emailNotifications && (
																	<Mail className="h-4 w-4 text-blue-500" />
																)}
															</div>
															<div>
																{member.preferences.smsNotifications && (
																	<Phone className="h-4 w-4 text-blue-500" />
																)}
															</div>
															{member.preferences.phoneNotifications && (
																<MessageSquare className="h-4 w-4 text-blue-500" />
															)}
														</div>
													</span>
													<span className="text-sm text-gray-500">
														<div className="flex items-center gap-2">
															<span>{member.email}</span>
															{member.phone && <span>{member.phone}</span>}
														</div>
													</span>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						</PopoverContent>
					</Popover>
				</div>
				{warnings.map((warning) => (
					<Alert variant="warning" key={`${warning.type}-${warning.count}`}>
						<AlertTriangle className="h-4 w-4" />
						<AlertDescription className="flex flex-col">
							<span>
								{warning.count} member{warning.count > 1 ? "s" : ""} cannot
								receive {warning.type} messages:
							</span>
							<div className="mt-2 text-sm">
								{warning.members.map((member) => (
									<div key={member.id} className="text-muted-foreground">
										{member.firstName} {member.lastName}
										{warning.type === "email" && !member.email && " (no email)"}
										{warning.type === "email" &&
											member.email &&
											!member.preferences.emailNotifications &&
											" (opted out)"}
										{(warning.type === "sms" || warning.type === "phone") &&
											!member.phone &&
											" (no phone)"}
										{warning.type === "sms" &&
											member.phone &&
											!member.preferences.smsNotifications &&
											" (opted out)"}
										{warning.type === "phone" &&
											member.phone &&
											!member.preferences.phoneNotifications &&
											" (opted out)"}
									</div>
								))}
							</div>
						</AlertDescription>
					</Alert>
				))}
			</div>

			<Tabs
				defaultValue="alert"
				onValueChange={(value: "alert" | "custom") => setMessageType(value)}
			>
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="alert" className="flex items-center gap-2">
						<Bell className="h-4 w-4" />
						Alert
					</TabsTrigger>
					<TabsTrigger value="custom" className="flex items-center gap-2">
						<Mail className="h-4 w-4" />
						Custom Message
					</TabsTrigger>
				</TabsList>

				<TabsContent value="alert">
					<div className="space-y-4">
						<div>
							<Label>Alert Message</Label>
							<Textarea
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								placeholder="Enter your alert message..."
								className={isAlertTooLong ? "border-red-500" : ""}
							/>
							<div className="flex justify-between mt-1 text-sm">
								<span
									className={isAlertTooLong ? "text-red-500" : "text-gray-500"}
								>
									{message.length}/{MAX_ALERT_LENGTH} characters
								</span>
								{isAlertTooLong && (
									<span className="text-red-500">
										Message is too long for alerts
									</span>
								)}
							</div>
						</div>
					</div>
				</TabsContent>

				<TabsContent value="custom">
					<div className="space-y-4">
						<RadioGroup
							value={customType}
							onValueChange={(v: "email" | "sms" | "phone") => setCustomType(v)}
							className="flex gap-4"
						>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="email" id="email" />
								<Label htmlFor="email">Email</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="sms" id="sms" />
								<Label htmlFor="sms">SMS</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="phone" id="phone" />
								<Label htmlFor="phone">Phone Call</Label>
							</div>
						</RadioGroup>

						{customType === "email" ? (
							<EmailEditor
								content={emailContent}
								subject={subject}
								onContentChange={setEmailContent}
								onSubjectChange={setSubject}
								templates={EMAIL_TEMPLATES}
								selectedTemplateId={selectedTemplateId}
								onTemplateSelect={setSelectedTemplateId}
								onSaveDraft={handleSaveDraft}
							/>
						) : (
							<div>
								<Label>
									{customType === "sms" ? "SMS Message" : "Phone Call Message"}
								</Label>
								<Textarea
									value={message}
									onChange={(e) => setMessage(e.target.value)}
									placeholder={`Enter your ${
										customType === "sms" ? "SMS" : "phone call"
									} message...`}
								/>
							</div>
						)}
					</div>
				</TabsContent>
			</Tabs>

			<div className="flex justify-end gap-2">
				<Button variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button onClick={handleSend} disabled={isAlertTooLong}>
					Send Message
				</Button>
			</div>
		</div>
	);
}
