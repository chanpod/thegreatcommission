import { useState } from "react";
import { Textarea } from "../ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { RichTextEditor, type EmailTemplate } from "./RichTextEditor";
import { Input } from "../ui/input";

export type MessageValue = {
	message: string;
	subject?: string;
	templateId?: string;
	format?: {
		html?: boolean;
		richText?: boolean;
	};
};

type MessageEditorProps = {
	type?: "email" | "phone" | "alert" | "sms";
	value: MessageValue;
	onChange: (value: MessageValue) => void;
};

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

export function MessageEditor({ type, value, onChange }: MessageEditorProps) {
	const [templates] = useState(EMAIL_TEMPLATES);

	const isEmail = type === "email";

	if (isEmail) {
		return (
			<div className="space-y-4">
				<div>
					<Select
						value={value.templateId}
						onValueChange={(templateId) => {
							const template = templates.find((t) => t.id === templateId);
							if (template) {
								onChange({
									...value,
									message: template.content,
									subject: template.subject,
									format: {
										html: true,
										richText: true,
									},
								});
							}
						}}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select template (optional)" />
						</SelectTrigger>
						<SelectContent>
							{templates.map((template) => (
								<SelectItem key={template.id} value={template.id}>
									{template.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div>
					<Input
						placeholder="Subject"
						value={value.subject || ""}
						onChange={(e) => onChange({ ...value, subject: e.target.value })}
					/>
				</div>

				<RichTextEditor
					content={value.message || ""}
					onContentChange={(content) =>
						onChange({
							...value,
							message: content,
							format: {
								html: true,
								richText: true,
							},
						})
					}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<Textarea
				placeholder="Type your message here..."
				className="min-h-[200px]"
				value={value.message || ""}
				onChange={(e) => onChange({ ...value, message: e.target.value })}
			/>
		</div>
	);
}
