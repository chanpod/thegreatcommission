import React from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { toast } from "sonner";
import { UploadButton } from "~/utils/uploadthing";
import { ClientOnly } from "remix-utils/client-only";
import { RichTextEditor } from "~/components/messaging/RichTextEditor";

interface AboutButton {
	label: string;
	url: string;
}

interface AboutEditorProps {
	aboutLogoUrl: string;
	setAboutLogoUrl: (url: string) => void;
	aboutButtons: AboutButton[];
	addAboutButton: () => void;
	updateAboutButton: (
		index: number,
		field: "label" | "url",
		value: string,
	) => void;
	removeAboutButton: (index: number) => void;
	formData: {
		aboutTitle: string;
		aboutSubtitle: string;
		aboutContent: string;
	};
	handleFieldChange: (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => void;
	onContentChange: (content: string) => void;
	config: any;
}

export function AboutEditor({
	aboutLogoUrl,
	setAboutLogoUrl,
	aboutButtons,
	addAboutButton,
	updateAboutButton,
	removeAboutButton,
	formData,
	handleFieldChange,
	onContentChange,
	config,
}: AboutEditorProps) {
	return (
		<div className="space-y-4">
			<div
				className="p-4 rounded-lg mb-4"
				style={{
					background: "linear-gradient(135deg, #00a99d 0%, #89d7bb 100%)",
				}}
			>
				<div className="text-white text-center">
					<p className="text-xs uppercase tracking-wider">Preview</p>
					<h3 className="text-lg font-semibold mt-1">
						This section will have a teal gradient background like this
					</h3>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="space-y-4">
					<div>
						<Label htmlFor="aboutTitle">Main Title</Label>
						<Input
							id="aboutTitle"
							name="aboutTitle"
							value={formData.aboutTitle}
							onChange={handleFieldChange}
							placeholder="About Our Church"
						/>
					</div>

					<div>
						<Label htmlFor="aboutSubtitle">Subtitle</Label>
						<Input
							id="aboutSubtitle"
							name="aboutSubtitle"
							value={formData.aboutSubtitle}
							onChange={handleFieldChange}
							placeholder="Our Mission"
						/>
					</div>

					<div>
						<Label htmlFor="aboutContent">Content</Label>
						<ClientOnly>
							{() => (
								<RichTextEditor
									name="aboutContent"
									defaultValue={formData.aboutContent}
									onContentChange={onContentChange}
								/>
							)}
						</ClientOnly>
					</div>
				</div>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label>Section Logo/Image</Label>
						{aboutLogoUrl && (
							<div className="relative w-32 h-32 rounded-lg overflow-hidden mb-2 bg-gray-100 flex items-center justify-center">
								<img
									src={aboutLogoUrl}
									alt="About Section Logo"
									className="max-w-full max-h-full object-contain"
								/>
							</div>
						)}
						<UploadButton
							endpoint="imageUploader"
							onClientUploadComplete={(res) => {
								if (res?.[0]) {
									setAboutLogoUrl(res[0].ufsUrl);
									toast.success(
										"Image uploaded successfully. Please save changes to keep this image.",
									);
								}
							}}
							onUploadError={(error: Error) => {
								toast.error(error.message);
							}}
						/>
						{aboutLogoUrl &&
							aboutLogoUrl !== (config?.aboutLogoImage || "") && (
								<p className="text-sm text-yellow-600">
									* Remember to save changes to keep this uploaded image
								</p>
							)}
					</div>

					<div>
						<div className="flex justify-between items-center mb-2">
							<Label>Buttons</Label>
							<Button type="button" variant="outline" onClick={addAboutButton}>
								Add Button
							</Button>
						</div>

						<div className="space-y-3">
							{aboutButtons.map((button, index) => (
								<div
									key={`button-${button.label}-${index}`}
									className="flex gap-2 items-start"
								>
									<div className="grid grid-cols-2 gap-2 flex-1">
										<Input
											value={button.label}
											onChange={(e) =>
												updateAboutButton(index, "label", e.target.value)
											}
											placeholder="Button Label"
										/>
										<Input
											value={button.url}
											onChange={(e) =>
												updateAboutButton(index, "url", e.target.value)
											}
											placeholder="Button URL"
										/>
									</div>
									<Button
										type="button"
										variant="destructive"
										onClick={() => removeAboutButton(index)}
									>
										Remove
									</Button>
								</div>
							))}

							{aboutButtons.length === 0 && (
								<p className="text-sm text-muted-foreground italic">
									Add buttons like "What We Believe" or "Core Values" to your
									about section
								</p>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
