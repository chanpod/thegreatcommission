import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import FontFamily from "@tiptap/extension-font-family";
import TextAlign from "@tiptap/extension-text-align";
import Heading from "@tiptap/extension-heading";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import FontSize from "@tiptap/extension-font-size";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import {
	Bold,
	Italic,
	Underline as UnderlineIcon,
	List,
	ListOrdered,
	AlignLeft,
	AlignCenter,
	AlignRight,
	Heading1,
	Heading2,
	FileText,
	Save,
	Link as LinkIcon,
	Palette,
	Type,
	Image as ImageIcon,
	MinusSquare,
	TextQuote,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";

export type EmailTemplate = {
	id: string;
	name: string;
	subject: string;
	content: string;
};

interface EmailEditorProps {
	content: string;
	subject: string;
	onContentChange: (content: string) => void;
	onSubjectChange: (subject: string) => void;
	templates?: EmailTemplate[];
	onSaveDraft?: () => void;
	selectedTemplateId?: string | null;
	onTemplateSelect?: (templateId: string | null) => void;
}

const FONT_FAMILIES = [
	{ name: "Default", value: "Inter" },
	{ name: "Arial", value: "Arial" },
	{ name: "Georgia", value: "Georgia" },
	{ name: "Times New Roman", value: "Times New Roman" },
	{ name: "Monospace", value: "monospace" },
];

const FONT_SIZES = [
	{ name: "Small", value: "14px" },
	{ name: "Default", value: "16px" },
	{ name: "Medium", value: "18px" },
	{ name: "Large", value: "20px" },
	{ name: "Extra Large", value: "24px" },
	{ name: "Huge", value: "32px" },
];

const TEXT_COLORS = [
	{ name: "Default", value: "var(--foreground)" },
	{ name: "Primary", value: "var(--primary)" },
	{ name: "Blue", value: "#3b82f6" },
	{ name: "Red", value: "#ef4444" },
	{ name: "Green", value: "#22c55e" },
	{ name: "Yellow", value: "#eab308" },
	{ name: "Purple", value: "#a855f7" },
];

export function EmailEditor({
	content,
	subject,
	onContentChange,
	onSubjectChange,
	templates,
	onSaveDraft,
	selectedTemplateId,
	onTemplateSelect,
}: EmailEditorProps) {
	const [showTemplates, setShowTemplates] = useState(false);
	const [showLinkDialog, setShowLinkDialog] = useState(false);
	const [showImageDialog, setShowImageDialog] = useState(false);
	const [linkUrl, setLinkUrl] = useState("");
	const [imageUrl, setImageUrl] = useState("");
	const [imageAlt, setImageAlt] = useState("");

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				bulletList: {
					keepMarks: true,
					keepAttributes: false,
				},
				orderedList: {
					keepMarks: true,
					keepAttributes: false,
				},
			}),
			Link.configure({
				openOnClick: false,
			}),
			TextStyle,
			Color,
			Highlight,
			FontFamily,
			TextAlign.configure({
				types: ["heading", "paragraph"],
			}),
			Heading,
			Underline,
			Image,
			FontSize,
		],
		content,
		onUpdate: ({ editor }) => {
			onContentChange(editor.getHTML());
		},
	});

	// Update editor content when content prop changes
	useEffect(() => {
		if (editor && content !== editor.getHTML()) {
			editor.commands.setContent(content);
		}
	}, [editor, content]);

	// Load template when selectedTemplateId changes
	useEffect(() => {
		if (selectedTemplateId && templates) {
			const template = templates.find((t) => t.id === selectedTemplateId);
			if (template) {
				onSubjectChange(template.subject);
				onContentChange(template.content);
				if (editor) {
					editor.commands.setContent(template.content);
				}
			}
		}
	}, [selectedTemplateId, templates, editor, onSubjectChange, onContentChange]);

	const loadTemplate = (template: EmailTemplate) => {
		onTemplateSelect?.(template.id);
		onSubjectChange(template.subject);
		onContentChange(template.content);
		if (editor) {
			editor.commands.setContent(template.content);
		}
		setShowTemplates(false);
	};

	const clearTemplate = () => {
		onTemplateSelect?.(null);
		onSubjectChange("");
		onContentChange("");
		if (editor) {
			editor.commands.setContent("");
		}
	};

	const addLink = () => {
		if (!linkUrl) return;
		editor?.chain().focus().setLink({ href: linkUrl }).run();
		setShowLinkDialog(false);
		setLinkUrl("");
	};

	const addImage = () => {
		if (!imageUrl) return;
		editor?.chain().focus().setImage({ src: imageUrl, alt: imageAlt }).run();
		setShowImageDialog(false);
		setImageUrl("");
		setImageAlt("");
	};

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<div className="space-x-2">
					{templates && templates.length > 0 && (
						<>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowTemplates(true)}
							>
								<FileText className="h-4 w-4 mr-2" />
								Templates
							</Button>
							{selectedTemplateId && (
								<Button variant="outline" size="sm" onClick={clearTemplate}>
									Clear Template
								</Button>
							)}
						</>
					)}
					{onSaveDraft && (
						<Button variant="outline" size="sm" onClick={onSaveDraft}>
							<Save className="h-4 w-4 mr-2" />
							Save Draft
						</Button>
					)}
				</div>
			</div>

			<div>
				<Label>Subject</Label>
				<Input
					value={subject}
					onChange={(e) => onSubjectChange(e.target.value)}
					placeholder="Enter email subject..."
				/>
			</div>

			<div>
				<Label>Message</Label>
				<div className="border rounded-md">
					<div className="border-b p-2 flex flex-wrap gap-1">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => editor?.chain().focus().toggleBold().run()}
							data-active={editor?.isActive("bold")}
							className={editor?.isActive("bold") ? "bg-secondary" : ""}
						>
							<Bold className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => editor?.chain().focus().toggleItalic().run()}
							data-active={editor?.isActive("italic")}
							className={editor?.isActive("italic") ? "bg-secondary" : ""}
						>
							<Italic className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => editor?.chain().focus().toggleUnderline().run()}
							data-active={editor?.isActive("underline")}
							className={editor?.isActive("underline") ? "bg-secondary" : ""}
						>
							<UnderlineIcon className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => editor?.chain().focus().toggleBulletList().run()}
							data-active={editor?.isActive("bulletList")}
							className={editor?.isActive("bulletList") ? "bg-secondary" : ""}
						>
							<List className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => editor?.chain().focus().toggleOrderedList().run()}
							data-active={editor?.isActive("orderedList")}
							className={editor?.isActive("orderedList") ? "bg-secondary" : ""}
						>
							<ListOrdered className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => editor?.chain().focus().setTextAlign("left").run()}
							data-active={editor?.isActive({ textAlign: "left" })}
							className={
								editor?.isActive({ textAlign: "left" }) ? "bg-secondary" : ""
							}
						>
							<AlignLeft className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() =>
								editor?.chain().focus().setTextAlign("center").run()
							}
							data-active={editor?.isActive({ textAlign: "center" })}
							className={
								editor?.isActive({ textAlign: "center" }) ? "bg-secondary" : ""
							}
						>
							<AlignCenter className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() =>
								editor?.chain().focus().setTextAlign("right").run()
							}
							data-active={editor?.isActive({ textAlign: "right" })}
							className={
								editor?.isActive({ textAlign: "right" }) ? "bg-secondary" : ""
							}
						>
							<AlignRight className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() =>
								editor?.chain().focus().toggleHeading({ level: 1 }).run()
							}
							data-active={editor?.isActive("heading", { level: 1 })}
							className={
								editor?.isActive("heading", { level: 1 }) ? "bg-secondary" : ""
							}
						>
							<Heading1 className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() =>
								editor?.chain().focus().toggleHeading({ level: 2 }).run()
							}
							data-active={editor?.isActive("heading", { level: 2 })}
							className={
								editor?.isActive("heading", { level: 2 }) ? "bg-secondary" : ""
							}
						>
							<Heading2 className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowLinkDialog(true)}
							data-active={editor?.isActive("link")}
							className={editor?.isActive("link") ? "bg-secondary" : ""}
						>
							<LinkIcon className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => editor?.chain().focus().setHorizontalRule().run()}
						>
							<MinusSquare className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowImageDialog(true)}
						>
							<ImageIcon className="h-4 w-4" />
						</Button>

						<Popover>
							<PopoverTrigger asChild>
								<Button variant="ghost" size="sm">
									<Type className="h-4 w-4" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-48 p-2">
								<div className="space-y-2">
									{FONT_FAMILIES.map((font) => (
										<Button
											key={font.value}
											variant="ghost"
											size="sm"
											className="w-full justify-start"
											onClick={() =>
												editor?.chain().focus().setFontFamily(font.value).run()
											}
										>
											<span style={{ fontFamily: font.value }}>
												{font.name}
											</span>
										</Button>
									))}
								</div>
							</PopoverContent>
						</Popover>

						<Popover>
							<PopoverTrigger asChild>
								<Button variant="ghost" size="sm">
									<TextQuote className="h-4 w-4" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-48 p-2">
								<div className="space-y-2">
									{FONT_SIZES.map((size) => (
										<Button
											key={size.value}
											variant="ghost"
											size="sm"
											className="w-full justify-start"
											onClick={() =>
												editor?.chain().focus().setFontSize(size.value).run()
											}
										>
											<span style={{ fontSize: size.value }}>{size.name}</span>
										</Button>
									))}
								</div>
							</PopoverContent>
						</Popover>

						<Popover>
							<PopoverTrigger asChild>
								<Button variant="ghost" size="sm">
									<Palette className="h-4 w-4" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-48 p-2">
								<div className="space-y-2">
									{TEXT_COLORS.map((color) => (
										<Button
											key={color.value}
											variant="ghost"
											size="sm"
											className="w-full justify-start"
											onClick={() =>
												editor?.chain().focus().setColor(color.value).run()
											}
										>
											<div className="flex items-center">
												<div
													className="w-4 h-4 rounded-full mr-2"
													style={{ backgroundColor: color.value }}
												/>
												{color.name}
											</div>
										</Button>
									))}
								</div>
							</PopoverContent>
						</Popover>
					</div>
					<div className="p-4">
						<EditorContent
							editor={editor}
							className="min-h-[200px] prose max-w-none"
						/>
					</div>
				</div>
			</div>

			{templates && (
				<Dialog open={showTemplates} onOpenChange={setShowTemplates}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Email Templates</DialogTitle>
						</DialogHeader>
						<div className="grid gap-4">
							{templates.map((template) => (
								<button
									key={template.id}
									type="button"
									className="p-4 border rounded-lg text-left w-full hover:bg-gray-50"
									onClick={() => loadTemplate(template)}
								>
									<h3 className="font-medium">{template.name}</h3>
									<p className="text-sm text-gray-500 mt-1">
										{template.subject}
									</p>
								</button>
							))}
						</div>
					</DialogContent>
				</Dialog>
			)}

			<Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add Link</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label>URL</Label>
							<Input
								value={linkUrl}
								onChange={(e) => setLinkUrl(e.target.value)}
								placeholder="https://example.com"
							/>
						</div>
						<div className="flex justify-end">
							<Button onClick={addLink}>Add Link</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add Image</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label>Image URL</Label>
							<Input
								value={imageUrl}
								onChange={(e) => setImageUrl(e.target.value)}
								placeholder="https://example.com/image.jpg"
							/>
						</div>
						<div>
							<Label>Alt Text</Label>
							<Input
								value={imageAlt}
								onChange={(e) => setImageAlt(e.target.value)}
								placeholder="Image description"
							/>
						</div>
						<div className="flex justify-end">
							<Button onClick={addImage}>Add Image</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
