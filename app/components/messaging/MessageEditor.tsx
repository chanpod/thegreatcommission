import { useState } from "react";
import { Textarea } from "../ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { RichTextEditor } from "./RichTextEditor";
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

export function MessageEditor({ type, value, onChange }: MessageEditorProps) {
	const [templates] = useState([
		{ id: "welcome", name: "Welcome Template" },
		{ id: "reminder", name: "Event Reminder" },
		{ id: "update", name: "General Update" },
	]);

	const isEmail = type === "email";

	if (isEmail) {
		return (
			<div className="space-y-4">
				<div>
					<Select
						value={value.templateId}
						onValueChange={(templateId) => onChange({ ...value, templateId })}
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
