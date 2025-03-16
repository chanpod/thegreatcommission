import type { ChangeEvent } from "react";
import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { toast } from "sonner";
import { UploadButton } from "~/utils/uploadthing";
import { ClientOnly } from "remix-utils/client-only";
import { RichTextEditor } from "~/components/messaging/RichTextEditor";
import type { landingPageConfig, churchOrganization } from "server/db/schema";

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
		e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
	) => void;
	onContentChange: (content: string) => void;
	config: typeof landingPageConfig.$inferSelect | null;
	organization?: typeof churchOrganization.$inferSelect; // Properly typed organization prop
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
	organization,
}: AboutEditorProps) {
	// Local state for button inputs to prevent losing focus on every keystroke
	const [localButtons, setLocalButtons] = useState<AboutButton[]>(aboutButtons);

	// Update local state when parent state changes
	useEffect(() => {
		setLocalButtons(aboutButtons);
	}, [aboutButtons]);

	// Handle local button changes
	const handleButtonChange = (
		index: number,
		field: "label" | "url",
		value: string,
	) => {
		setLocalButtons((prev) =>
			prev.map((button, i) =>
				i === index ? { ...button, [field]: value } : button,
			),
		);
	};

	// Update parent state when input loses focus
	const handleButtonBlur = (index: number, field: "label" | "url") => {
		updateAboutButton(index, field, localButtons[index][field]);
	};

	// Get theme colors from organization, or use defaults if not available
	const getThemeColors = () => {
		try {
			if (organization?.themeColors) {
				return JSON.parse(organization.themeColors) as {
					primary: string;
					secondary: string;
					accent: string;
				};
			}
		} catch (error) {
			console.error("Error parsing theme colors:", error);
		}

		// Default theme colors if not available
		return {
			primary: "#3b82f6",
			secondary: "#1e293b",
			accent: "#8b5cf6",
		};
	};

	const themeColors = getThemeColors();

	// Create a clean gradient string without whitespace or newlines
	const backgroundGradient = `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.accent || "#8b5cf6"} 50%, ${themeColors.secondary} 100%)`;

	// This is the exact same gradient that will be used on the landing page
	const previewGradient = backgroundGradient;

	return (
		<div className="space-y-4">
			<div
				className="p-4 rounded-lg mb-4 animated-gradient"
				style={{
					background: previewGradient,
					backgroundSize: "200% 200%", // More compact background size for more dramatic movement
					boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)", // Add shadow for depth
					border: `1px solid ${themeColors.accent || "#8b5cf6"}`, // Add border with accent color
				}}
			>
				<div className="text-white text-center">
					<p className="text-xs uppercase tracking-wider">Preview</p>
					<h3 className="text-lg font-semibold mt-1">
						This section will have an animated gradient background using your
						theme colors
					</h3>
					<p className="text-sm mt-2">
						Primary: {themeColors.primary} | Accent: {themeColors.accent} |
						Secondary: {themeColors.secondary}
					</p>
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
									setAboutLogoUrl(res[0].url);
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
							{localButtons.map((button, index) => (
								<div key={`button-${index}`} className="flex gap-2 items-start">
									<div className="grid grid-cols-2 gap-2 flex-1">
										<Input
											value={button.label}
											onChange={(e) =>
												handleButtonChange(index, "label", e.target.value)
											}
											onBlur={() => handleButtonBlur(index, "label")}
											placeholder="Button Label"
										/>
										<Input
											value={button.url}
											onChange={(e) =>
												handleButtonChange(index, "url", e.target.value)
											}
											onBlur={() => handleButtonBlur(index, "url")}
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

							{localButtons.length === 0 && (
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
