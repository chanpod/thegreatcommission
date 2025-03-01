import { db } from "@/server/db/dbConnection";
import { PermissionsService } from "@/server/services/PermissionsService";
import { eq } from "drizzle-orm";
import { useEffect, useState } from "react";
import {
	Form,
	useBeforeUnload,
	useLoaderData,
	useNavigate,
	useSubmit,
} from "react-router";
import { ClientOnly } from "remix-utils/client-only";
import {
	churchOrganization,
	landingPageConfig,
	formConfig,
} from "server/db/schema";
import { toast } from "sonner";
import type { CustomSectionProps } from "~/components/CustomSection";
import { RichTextEditor } from "~/components/messaging/RichTextEditor";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { createAuthLoader } from "~/server/auth/authLoader";
import { UploadButton } from "~/utils/uploadthing";
import { LandingToolbar } from "./churches.$organization.landing._index";
import { OrganizationDataService } from "@/server/dataServices/OrganizationDataService";
import { X } from "lucide-react";

// Mini-sidenav component for quick navigation
function MiniSidenav() {
	const [activeSection, setActiveSection] = useState<string | null>(null);

	// Update active section based on scroll position
	useEffect(() => {
		const handleScroll = () => {
			const sections = document.querySelectorAll('[id$="-section"]');
			let currentActiveSection: string | null = null;

			sections.forEach((section) => {
				const sectionTop = section.getBoundingClientRect().top;
				if (sectionTop < 100) {
					currentActiveSection = section.id;
				}
			});

			setActiveSection(currentActiveSection);
		};

		window.addEventListener("scroll", handleScroll);
		handleScroll(); // Initial check

		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	const scrollToSection = (sectionId: string) => {
		const section = document.getElementById(sectionId);
		if (section) {
			section.scrollIntoView({ behavior: "smooth" });
		}
	};

	return (
		<div className="fixed right-4 top-1/3 z-10 bg-white rounded-lg shadow-md p-2 border">
			<div className="flex flex-col gap-2">
				<button
					onClick={() => scrollToSection("hero-section")}
					className={`p-2 rounded-md text-sm ${activeSection === "hero-section" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"}`}
				>
					Hero
				</button>
				<button
					onClick={() => scrollToSection("about-section")}
					className={`p-2 rounded-md text-sm ${activeSection === "about-section" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"}`}
				>
					About
				</button>
				<button
					onClick={() => scrollToSection("custom-sections")}
					className={`p-2 rounded-md text-sm ${activeSection === "custom-sections" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"}`}
				>
					Custom Sections
				</button>
				<button
					onClick={() => scrollToSection("social-section")}
					className={`p-2 rounded-md text-sm ${activeSection === "social-section" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"}`}
				>
					Social
				</button>
				<button
					onClick={() => scrollToSection("footer-section")}
					className={`p-2 rounded-md text-sm ${activeSection === "footer-section" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"}`}
				>
					Footer
				</button>
				<button
					onClick={() => scrollToSection("settings-section")}
					className={`p-2 rounded-md text-sm ${activeSection === "settings-section" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"}`}
				>
					Settings
				</button>
			</div>
		</div>
	);
}

export const loader = createAuthLoader(
	async ({ request, params, userContext }) => {
		const user = userContext?.user;
		const permissionsService = new PermissionsService();
		const organizationDataService = new OrganizationDataService();

		const permissions = await permissionsService.getOrganizationPermissions(
			user.id,
			params.organization,
		);
		const config = await db
			.select()
			.from(landingPageConfig)
			.where(eq(landingPageConfig.churchOrganizationId, params.organization))
			.then((res) => res[0]);

		const organization = await db
			.select()
			.from(churchOrganization)
			.where(eq(churchOrganization.id, params.organization))
			.then((res) => res[0]);

		// Fetch available forms for the organization
		const forms = await db
			.select()
			.from(formConfig)
			.where(eq(formConfig.churchOrganizationId, params.organization))
			.then((res) => res.filter((form) => form.active));

		// Fetch organization members
		const members = await organizationDataService.getOrganizationMembers(
			params.organization,
		);

		return { config, organization, permissions, forms, members };
	},
	true,
);

export const action = createAuthLoader(async ({ request, params }) => {
	const formData = await request.formData();
	const now = new Date();

	// Get all form data
	const configData = {
		heroImage: formData.get("heroImage") as string,
		heroHeadline: formData.get("heroHeadline") as string,
		heroSubheadline: formData.get("heroSubheadline") as string,
		heroImagePosition: formData.get("heroImagePosition") as string,
		heroImageObjectFit: formData.get("heroImageObjectFit") as string,
		heroOverlayOpacity: formData.get("heroOverlayOpacity") as string,
		heroHeight: formData.get("heroHeight") as string,

		aboutTitle: formData.get("aboutTitle") as string,
		aboutContent: formData.get("aboutContent") as string,
		aboutSubtitle: formData.get("aboutSubtitle") as string,
		aboutLogoImage: formData.get("aboutLogoImage") as string,
		aboutButtons: formData.get("aboutButtons") as string,
		aboutSection: formData.get("aboutSection") as string,

		customSections: formData.get("customSections") as string,

		footerContent: formData.get("footerContent") as string,
		socialLinks: formData.get("socialLinks") as string,
		contactEmail: formData.get("contactEmail") as string,
		contactPhone: formData.get("contactPhone") as string,
		contactAddress: formData.get("contactAddress") as string,
		logoUrl: formData.get("logoUrl") as string,
		updatedAt: now,
	};

	// Debug logging
	console.log("Action received configData:", {
		aboutSection: configData.aboutSection,
		customSections: configData.customSections,
		socialLinks: configData.socialLinks,
	});

	console.log("configData", configData);
	const existingConfig = await db
		.select()
		.from(landingPageConfig)
		.where(eq(landingPageConfig.churchOrganizationId, params.organization))
		.then((res) => res[0]);

	if (existingConfig) {
		await db
			.update(landingPageConfig)
			.set(configData)
			.where(eq(landingPageConfig.churchOrganizationId, params.organization));
	} else {
		await db.insert(landingPageConfig).values({
			...configData,
			churchOrganizationId: params.organization,
		});
	}

	const result = await db
		.update(landingPageConfig)
		.set(configData)
		.where(eq(landingPageConfig.churchOrganizationId, params.organization));

	console.log("result", result);

	// Update custom domain if provided
	const customDomain = formData.get("customDomain") as string;
	if (customDomain !== undefined) {
		await db
			.update(churchOrganization)
			.set({
				customDomain: customDomain || null,
				updatedAt: now,
			})
			.where(eq(churchOrganization.id, params.organization));
	}

	return { success: true };
}, true);

export default function LandingConfig() {
	const { config, organization, permissions, forms, members } = useLoaderData();
	const submit = useSubmit();
	const navigate = useNavigate();
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
	const [pendingNavigation, setPendingNavigation] = useState<string | null>(
		null,
	);

	// Hero configuration state
	const [heroImageUrl, setHeroImageUrl] = useState<string>(
		config?.heroImage || "",
	);
	const [heroConfig, setHeroConfig] = useState({
		imagePosition: config?.heroImagePosition || "center",
		imageObjectFit: config?.heroImageObjectFit || "cover",
		overlayOpacity: config?.heroOverlayOpacity || "0.5",
		height: config?.heroHeight || "500px",
	});

	// About section state
	const [aboutLogoUrl, setAboutLogoUrl] = useState<string>(
		config?.aboutLogoImage || "",
	);
	const [aboutButtons, setAboutButtons] = useState<
		Array<{ label: string; url: string }>
	>(config?.aboutButtons ? JSON.parse(config.aboutButtons) : []);

	// Custom sections state
	const [customSections, setCustomSections] = useState<CustomSectionProps[]>(
		config?.customSections ? JSON.parse(config.customSections) : [],
	);

	// Social links state
	const [socialLinks, setSocialLinks] = useState<Record<string, string>>(
		config?.socialLinks ? JSON.parse(config.socialLinks) : {},
	);

	// Logo URL state
	const [logoUrl, setLogoUrl] = useState<string>(organization?.logoUrl || "");
	const [customDomain, setCustomDomain] = useState<string>(
		organization?.customDomain || "",
	);

	// Form data state
	const [formData, setFormData] = useState({
		heroHeadline: config?.heroHeadline || "",
		heroSubheadline: config?.heroSubheadline || "",
		aboutTitle: config?.aboutTitle || "",
		aboutSubtitle: config?.aboutSubtitle || "",
		aboutContent: config?.aboutContent || "",
		footerContent: config?.footerContent || "",
		contactEmail: config?.contactEmail || "",
		contactPhone: config?.contactPhone || "",
		contactAddress: config?.contactAddress || "",
		contactFormEnabled: config?.contactFormEnabled || false,
	});

	// Search term state
	const [searchTerm, setSearchTerm] = useState("");

	// Track changes
	useEffect(() => {
		const hasChanges =
			heroImageUrl !== (config?.heroImage || "") ||
			heroConfig.imagePosition !== (config?.heroImagePosition || "center") ||
			heroConfig.imageObjectFit !== (config?.heroImageObjectFit || "cover") ||
			heroConfig.overlayOpacity !== (config?.heroOverlayOpacity || "0.5") ||
			heroConfig.height !== (config?.heroHeight || "500px") ||
			aboutLogoUrl !== (config?.aboutLogoImage || "") ||
			JSON.stringify(aboutButtons) !== (config?.aboutButtons || "[]") ||
			JSON.stringify(customSections) !== (config?.customSections || "[]") ||
			logoUrl !== (organization?.logoUrl || "") ||
			customDomain !== (organization?.customDomain || "") ||
			JSON.stringify(socialLinks) !== (config?.socialLinks || "{}") ||
			formData.heroHeadline !== (config?.heroHeadline || "") ||
			formData.heroSubheadline !== (config?.heroSubheadline || "") ||
			formData.aboutTitle !== (config?.aboutTitle || "") ||
			formData.aboutSubtitle !== (config?.aboutSubtitle || "") ||
			formData.aboutContent !== (config?.aboutContent || "") ||
			formData.footerContent !== (config?.footerContent || "") ||
			formData.contactEmail !== (config?.contactEmail || "") ||
			formData.contactPhone !== (config?.contactPhone || "") ||
			formData.contactAddress !== (config?.contactAddress || "") ||
			formData.contactFormEnabled !== (config?.contactFormEnabled || false);

		setHasUnsavedChanges(hasChanges);
	}, [
		heroImageUrl,
		heroConfig,
		aboutLogoUrl,
		aboutButtons,
		customSections,
		logoUrl,
		customDomain,
		socialLinks,
		formData,
		config,
		organization,
	]);

	// Handle navigation attempts
	useBeforeUnload((event) => {
		if (hasUnsavedChanges) {
			event.preventDefault();
			return "You have unsaved changes. Are you sure you want to leave?";
		}
	});

	const handleNavigation = (to: string) => {
		if (hasUnsavedChanges) {
			setPendingNavigation(to);
			setShowUnsavedDialog(true);
		} else {
			navigate(to);
		}
	};

	const handleFieldChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleHeroConfigChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const { name, value } = e.target;
		setHeroConfig((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const submitData = new FormData();

		// Add all form data fields
		for (const [key, value] of Object.entries(formData)) {
			submitData.set(key, value);
		}

		// Add hero configuration
		submitData.set("heroImage", heroImageUrl);
		submitData.set("heroImagePosition", heroConfig.imagePosition);
		submitData.set("heroImageObjectFit", heroConfig.imageObjectFit);
		submitData.set("heroOverlayOpacity", heroConfig.overlayOpacity);
		submitData.set("heroHeight", heroConfig.height);

		// Add about section configuration
		const aboutSection = {
			title: formData.aboutTitle,
			subtitle: formData.aboutSubtitle,
			content: formData.aboutContent,
			logoImage: aboutLogoUrl,
			buttons: aboutButtons,
			backgroundGradient: "linear-gradient(135deg, #00a99d 0%, #89d7bb 100%)",
		};
		submitData.set("aboutSection", JSON.stringify(aboutSection));

		// Debug logging
		console.log("Saving aboutSection:", aboutSection);
		console.log("Saving aboutSection JSON:", JSON.stringify(aboutSection));

		// Add custom sections
		// Ensure each custom section has its properties properly included
		const sectionsToSave = customSections.map((section) => ({
			...section,
			buttons: section.buttons || [],
			images: section.images || [],
			cards: section.cards || [],
			teamMembers: section.teamMembers || [],
		}));
		submitData.set("customSections", JSON.stringify(sectionsToSave));

		// Debug logging
		console.log("Saving customSections:", sectionsToSave);
		console.log("Saving customSections JSON:", JSON.stringify(sectionsToSave));

		// Add social links and logo
		submitData.set("socialLinks", JSON.stringify(socialLinks));

		// Debug logging
		console.log("Saving socialLinks:", socialLinks);
		console.log("Saving socialLinks JSON:", JSON.stringify(socialLinks));

		submitData.set("logoUrl", logoUrl);
		submitData.set("customDomain", customDomain);

		submit(submitData, { method: "post" });
		setHasUnsavedChanges(false);
		toast.success("Landing page configuration saved successfully");
	};

	const addSocialLink = () => {
		setSocialLinks((prev) => ({
			...prev,
			"": "",
		}));
	};

	const updateSocialLink = (
		oldPlatform: string,
		newPlatform: string,
		url: string,
	) => {
		setSocialLinks((prev) => {
			const newLinks = { ...prev };
			if (oldPlatform !== newPlatform) {
				delete newLinks[oldPlatform];
			}
			newLinks[newPlatform] = url;
			return newLinks;
		});
	};

	const removeSocialLink = (platform: string) => {
		setSocialLinks((prev) => {
			const newLinks = { ...prev };
			delete newLinks[platform];
			return newLinks;
		});
	};

	// About buttons management
	const addAboutButton = () => {
		setAboutButtons((prev) => [...prev, { label: "New Button", url: "#" }]);
	};

	const updateAboutButton = (
		index: number,
		field: "label" | "url",
		value: string,
	) => {
		setAboutButtons((prev) =>
			prev.map((button, i) =>
				i === index ? { ...button, [field]: value } : button,
			),
		);
	};

	const removeAboutButton = (index: number) => {
		setAboutButtons((prev) => prev.filter((_, i) => i !== index));
	};

	// Custom sections management
	const addCustomSection = () => {
		const newSection: CustomSectionProps = {
			id: `section-${Date.now()}`,
			title: "New Section",
			subtitle: "Section subtitle",
			content:
				"<p>This is a new custom section. Edit the content to your needs.</p>",
			backgroundColor: "#ffffff",
			textColor: "#333333",
			layout: "text-only" as
				| "text-only"
				| "text-image"
				| "full-width-image"
				| "cards"
				| "team",
			buttons: [],
			images: [],
			cards: [],
			teamMembers: [],
		};

		setCustomSections((prev) => [...prev, newSection]);
	};

	const updateCustomSection = (
		index: number,
		field: string,
		value: string | number | boolean | object,
	) => {
		setCustomSections((prev) =>
			prev.map((section, i) =>
				i === index ? { ...section, [field]: value } : section,
			),
		);
	};

	const removeCustomSection = (index: number) => {
		setCustomSections((prev) => prev.filter((_, i) => i !== index));
	};

	const moveCustomSection = (index: number, direction: "up" | "down") => {
		if (
			(direction === "up" && index === 0) ||
			(direction === "down" && index === customSections.length - 1)
		) {
			return;
		}

		const newSections = [...customSections];
		const targetIndex = direction === "up" ? index - 1 : index + 1;
		const temp = newSections[targetIndex];
		newSections[targetIndex] = newSections[index];
		newSections[index] = temp;

		setCustomSections(newSections);
	};

	return (
		<>
			<LandingToolbar
				organization={organization}
				permissions={permissions}
				isLive={false}
			/>
			<MiniSidenav />
			<div className="flex justify-between items-center mb-4 p-3">
				<h1 className="text-3xl font-bold">Landing Page Configuration</h1>
				<div className="flex gap-2">
					<Button
						type="button"
						onClick={() => {
							const form = document.getElementById(
								"landing-config-form",
							) as HTMLFormElement;
							if (form) {
								form.dispatchEvent(
									new Event("submit", { cancelable: true, bubbles: true }),
								);
							}
						}}
					>
						Save Changes
					</Button>
				</div>
			</div>

			<form
				id="landing-config-form"
				onSubmit={handleSubmit}
				className="space-y-6"
			>
				<Card id="hero-section">
					<CardHeader>
						<CardTitle>Hero Section</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="heroImage">Hero Image</Label>
							{heroImageUrl && (
								<div
									className="relative w-full rounded-lg overflow-hidden mb-2"
									style={{ height: heroConfig.height || "500px" }}
								>
									<div className="absolute inset-0">
										<img
											src={heroImageUrl}
											alt="Hero"
											className="w-full h-full"
											style={{
												objectFit:
													(heroConfig.imageObjectFit as any) || "cover",
												objectPosition: (() => {
													switch (heroConfig.imagePosition) {
														case "top":
															return "center top";
														case "bottom":
															return "center bottom";
														case "left":
															return "left center";
														case "right":
															return "right center";
														default:
															return "center center";
													}
												})(),
											}}
										/>
									</div>
									<div
										className="absolute inset-0 flex flex-col justify-center items-center text-white px-4 text-center"
										style={{
											backgroundColor: `rgba(0, 0, 0, ${heroConfig.overlayOpacity || 0.5})`,
										}}
									>
										<h2 className="text-2xl md:text-3xl font-bold mb-2">
											{formData.heroHeadline ||
												`Welcome to ${organization.name}`}
										</h2>
										<p className="text-lg md:text-xl">
											{formData.heroSubheadline ||
												"A place of worship, fellowship, and growth"}
										</p>
										<p className="mt-4 text-xs uppercase tracking-wide opacity-80">
											Preview - This is how your hero section will appear
										</p>
									</div>
								</div>
							)}
							<UploadButton
								endpoint="imageUploader"
								onClientUploadComplete={(res) => {
									if (res?.[0]) {
										setHeroImageUrl(res[0].ufsUrl);
										toast.success(
											"Image uploaded successfully. Please save changes to keep this image.",
										);
									}
								}}
								onUploadError={(error: Error) => {
									toast.error(`Upload failed: ${error.message}`);
								}}
							/>
							{heroImageUrl !== (config?.heroImage || "") && (
								<p className="text-sm text-yellow-600">
									* Remember to save changes to keep this uploaded image
								</p>
							)}
						</div>

						<div>
							<Label htmlFor="heroHeadline">Headline</Label>
							<Input
								id="heroHeadline"
								name="heroHeadline"
								value={formData.heroHeadline}
								onChange={handleFieldChange}
								placeholder={`Welcome to ${organization.name}`}
							/>
						</div>

						<div>
							<Label htmlFor="heroSubheadline">Subheadline</Label>
							<Input
								id="heroSubheadline"
								name="heroSubheadline"
								value={formData.heroSubheadline}
								onChange={handleFieldChange}
								placeholder="A place of worship, fellowship, and growth"
							/>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<Label htmlFor="imagePosition">Image Position</Label>
								<select
									id="imagePosition"
									name="imagePosition"
									value={heroConfig.imagePosition}
									onChange={handleHeroConfigChange}
									className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
								>
									<option value="center">Center</option>
									<option value="top">Top</option>
									<option value="bottom">Bottom</option>
									<option value="left">Left</option>
									<option value="right">Right</option>
								</select>
							</div>

							<div>
								<Label htmlFor="imageObjectFit">Image Fit</Label>
								<select
									id="imageObjectFit"
									name="imageObjectFit"
									value={heroConfig.imageObjectFit}
									onChange={handleHeroConfigChange}
									className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
								>
									<option value="cover">Cover (fills area, may crop)</option>
									<option value="contain">
										Contain (shows all, may have space)
									</option>
									<option value="fill">Fill (stretches to fit)</option>
								</select>
							</div>

							<div>
								<Label htmlFor="overlayOpacity">Overlay Opacity</Label>
								<div className="flex items-center gap-4">
									<input
										id="overlayOpacity"
										name="overlayOpacity"
										type="range"
										min="0"
										max="1"
										step="0.1"
										value={heroConfig.overlayOpacity}
										onChange={handleHeroConfigChange}
										className="flex-1"
									/>
									<span>{Number(heroConfig.overlayOpacity).toFixed(1)}</span>
								</div>
							</div>

							<div>
								<Label htmlFor="height">Hero Height</Label>
								<Input
									id="height"
									name="height"
									value={heroConfig.height}
									onChange={handleHeroConfigChange}
									placeholder="500px"
								/>
								<p className="text-xs text-muted-foreground mt-1">
									Use px, vh, or other valid CSS units (e.g., 500px, 80vh)
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card id="about-section">
					<CardHeader>
						<CardTitle>About Section</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
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
												onContentChange={(content) => {
													setFormData((prev) => ({
														...prev,
														aboutContent: content,
													}));
												}}
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
											toast.error(`Upload failed: ${error.message}`);
										}}
									/>
									{aboutLogoUrl !== (config?.aboutLogoImage || "") && (
										<p className="text-sm text-yellow-600">
											* Remember to save changes to keep this uploaded image
										</p>
									)}
								</div>

								<div>
									<div className="flex justify-between items-center mb-2">
										<Label>Buttons</Label>
										<Button
											type="button"
											variant="outline"
											onClick={addAboutButton}
										>
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
												Add buttons like "What We Believe" or "Core Values" to
												your about section
											</p>
										)}
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card id="custom-sections">
					<CardHeader className="flex flex-row justify-between items-center">
						<CardTitle>Custom Sections</CardTitle>
						<Button type="button" variant="outline" onClick={addCustomSection}>
							Add New Section
						</Button>
					</CardHeader>
					<CardContent className="space-y-6">
						{forms.length > 0 && (
							<div className="bg-blue-50 p-4 rounded-md mb-4">
								<h3 className="text-sm font-medium text-blue-800 mb-1">
									Form Integration Available
								</h3>
								<p className="text-sm text-blue-700">
									You can now link buttons in custom sections directly to your
									forms. Add a button to any section and use the dropdown to
									select a form.
								</p>
							</div>
						)}

						{customSections.length === 0 ? (
							<div className="text-center p-8 border border-dashed rounded-lg">
								<h3 className="text-lg font-medium mb-2">
									No Custom Sections Yet
								</h3>
								<p className="text-muted-foreground mb-4">
									Create custom sections for staff, ministries, testimonials,
									and more.
								</p>
								<Button type="button" onClick={addCustomSection}>
									Add Your First Section
								</Button>
							</div>
						) : (
							customSections.map((section, index) => (
								<div
									key={section.id || `section-${index}`}
									className="border rounded-lg p-4 bg-slate-50 border-l-4 border-l-blue-500 shadow-sm"
								>
									<div className="flex justify-between items-center mb-4">
										<h3 className="text-lg font-medium flex items-center">
											<span className="bg-blue-500 text-white rounded-full w-6 h-6 inline-flex items-center justify-center mr-2 text-sm">
												{index + 1}
											</span>
											{section.title || `Section ${index + 1}`}
										</h3>
										<div className="flex gap-2">
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => moveCustomSection(index, "up")}
												disabled={index === 0}
											>
												Move Up
											</Button>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => moveCustomSection(index, "down")}
												disabled={index === customSections.length - 1}
											>
												Move Down
											</Button>
											<Button
												type="button"
												variant="destructive"
												size="sm"
												onClick={() => removeCustomSection(index)}
											>
												Remove
											</Button>
										</div>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
										<div>
											<Label htmlFor={`section-${index}-title`}>
												Section Title
											</Label>
											<Input
												id={`section-${index}-title`}
												value={section.title || ""}
												onChange={(e) =>
													updateCustomSection(index, "title", e.target.value)
												}
											/>
										</div>

										<div>
											<Label htmlFor={`section-${index}-subtitle`}>
												Subtitle
											</Label>
											<Input
												id={`section-${index}-subtitle`}
												value={section.subtitle || ""}
												onChange={(e) =>
													updateCustomSection(index, "subtitle", e.target.value)
												}
											/>
										</div>

										<div>
											<Label htmlFor={`section-${index}-layout`}>
												Layout Type
											</Label>
											<select
												id={`section-${index}-layout`}
												value={section.layout || "text-only"}
												onChange={(e) =>
													updateCustomSection(index, "layout", e.target.value)
												}
												className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
											>
												<option value="text-only">Text Only</option>
												<option value="text-image">Text & Image</option>
												<option value="full-width-image">
													Full Width Image
												</option>
												<option value="cards">Cards/Grid</option>
												<option value="team">Team Members</option>
											</select>
										</div>

										<div>
											<Label htmlFor={`section-${index}-background`}>
												Background Color
											</Label>
											<div className="flex gap-2 items-center">
												<input
													type="color"
													value={section.backgroundColor || "#ffffff"}
													onChange={(e) =>
														updateCustomSection(
															index,
															"backgroundColor",
															e.target.value,
														)
													}
													className="w-10 h-10"
												/>
												<Input
													value={section.backgroundColor || "#ffffff"}
													onChange={(e) =>
														updateCustomSection(
															index,
															"backgroundColor",
															e.target.value,
														)
													}
												/>
											</div>
										</div>
									</div>

									<div>
										<Label htmlFor={`section-${index}-content`}>Content</Label>
										<ClientOnly>
											{() => (
												<RichTextEditor
													name={`section-${index}-content`}
													defaultValue={section.content || ""}
													onContentChange={(content) => {
														updateCustomSection(index, "content", content);
													}}
												/>
											)}
										</ClientOnly>
									</div>

									{/* Add image upload for layouts that need images */}
									{(section.layout === "text-image" ||
										section.layout === "full-width-image" ||
										section.layout === "cards") && (
										<div className="mt-4">
											<Label>Section Images</Label>
											<div className="mt-2 space-y-4">
												{/* Display current images if they exist */}
												{section.images && section.images.length > 0 ? (
													<div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
														{section.images.map((image, imageIndex) => (
															<div
																key={`image-${imageIndex}`}
																className="relative group"
															>
																<div className="aspect-video rounded-md overflow-hidden border bg-muted">
																	<img
																		src={image.url}
																		alt={image.alt || "Section image"}
																		className="w-full h-full object-cover"
																	/>
																</div>
																<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
																	<Button
																		type="button"
																		variant="destructive"
																		size="sm"
																		onClick={() => {
																			const updatedImages = [
																				...(section.images || []),
																			];
																			updatedImages.splice(imageIndex, 1);
																			updateCustomSection(
																				index,
																				"images",
																				updatedImages,
																			);
																		}}
																	>
																		Remove
																	</Button>
																</div>
																<Input
																	className="mt-1"
																	placeholder="Image alt text"
																	value={image.alt || ""}
																	onChange={(e) => {
																		const updatedImages = [
																			...(section.images || []),
																		];
																		updatedImages[imageIndex] = {
																			...updatedImages[imageIndex],
																			alt: e.target.value,
																		};
																		updateCustomSection(
																			index,
																			"images",
																			updatedImages,
																		);
																	}}
																/>
															</div>
														))}
													</div>
												) : (
													<p className="text-sm text-muted-foreground mb-4">
														No images added yet. Upload images for your{" "}
														{section.layout === "text-image"
															? "text and image"
															: section.layout === "full-width-image"
																? "full width image"
																: "cards"}{" "}
														layout.
													</p>
												)}

												{/* Upload button */}
												<div>
													<UploadButton
														endpoint="imageUploader"
														onClientUploadComplete={(res) => {
															if (res?.[0]) {
																const newImage = {
																	url: res[0].ufsUrl,
																	alt: "",
																};
																const updatedImages = [
																	...(section.images || []),
																];
																updatedImages.push(newImage);
																updateCustomSection(
																	index,
																	"images",
																	updatedImages,
																);
																toast.success("Image uploaded successfully");
															}
														}}
														onUploadError={(error: Error) => {
															toast.error(`Upload failed: ${error.message}`);
														}}
													/>
													<p className="text-xs text-muted-foreground mt-2">
														{section.layout === "text-image"
															? "Upload an image to display alongside your text."
															: section.layout === "full-width-image"
																? "Upload a full-width banner image."
																: "Upload images for your cards. You can add multiple images."}
													</p>
												</div>
											</div>
										</div>
									)}

									{/* Add card content management for card layout */}
									{section.layout === "cards" && (
										<div className="mt-6">
											<div className="flex justify-between items-center mb-2">
												<Label>Cards</Label>
												<Button
													type="button"
													variant="outline"
													onClick={() => {
														const updatedSection = { ...section };
														if (!updatedSection.cards) {
															updatedSection.cards = [];
														}
														updatedSection.cards.push({
															title: "New Card",
															content: "<p>Card content goes here.</p>",
															image:
																section.images && section.images.length > 0
																	? section.images[0].url
																	: "",
															link: "",
														});
														updateCustomSection(
															index,
															"cards",
															updatedSection.cards,
														);
													}}
												>
													Add Card
												</Button>
											</div>

											<div className="space-y-4 mt-2">
												{section.cards && section.cards.length > 0 ? (
													section.cards.map((card, cardIndex) => (
														<div
															key={`card-${cardIndex}`}
															className="border rounded-md p-4"
														>
															<div className="flex justify-between items-center mb-2">
																<h4 className="font-medium">
																	Card {cardIndex + 1}
																</h4>
																<Button
																	type="button"
																	variant="destructive"
																	size="sm"
																	onClick={() => {
																		const updatedCards = [
																			...(section.cards || []),
																		];
																		updatedCards.splice(cardIndex, 1);
																		updateCustomSection(
																			index,
																			"cards",
																			updatedCards,
																		);
																	}}
																>
																	Remove
																</Button>
															</div>
															<div className="space-y-3">
																<div>
																	<Label>Title</Label>
																	<Input
																		value={card.title || ""}
																		onChange={(e) => {
																			const updatedCards = [
																				...(section.cards || []),
																			];
																			updatedCards[cardIndex] = {
																				...updatedCards[cardIndex],
																				title: e.target.value,
																			};
																			updateCustomSection(
																				index,
																				"cards",
																				updatedCards,
																			);
																		}}
																		placeholder="Card Title"
																	/>
																</div>
																<div>
																	<Label>Content</Label>
																	<Textarea
																		value={card.content || ""}
																		onChange={(e) => {
																			const updatedCards = [
																				...(section.cards || []),
																			];
																			updatedCards[cardIndex] = {
																				...updatedCards[cardIndex],
																				content: e.target.value,
																			};
																			updateCustomSection(
																				index,
																				"cards",
																				updatedCards,
																			);
																		}}
																		placeholder="Card content"
																		rows={3}
																	/>
																</div>
																<div>
																	<Label>Link (Optional)</Label>
																	<Input
																		value={card.link || ""}
																		onChange={(e) => {
																			const updatedCards = [
																				...(section.cards || []),
																			];
																			updatedCards[cardIndex] = {
																				...updatedCards[cardIndex],
																				link: e.target.value,
																			};
																			updateCustomSection(
																				index,
																				"cards",
																				updatedCards,
																			);
																		}}
																		placeholder="https://example.com"
																	/>
																</div>
																<div>
																	<Label>Image</Label>
																	{section.images &&
																	section.images.length > 0 ? (
																		<select
																			className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
																			value={card.image || ""}
																			onChange={(e) => {
																				const updatedCards = [
																					...(section.cards || []),
																				];
																				updatedCards[cardIndex] = {
																					...updatedCards[cardIndex],
																					image: e.target.value,
																				};
																				updateCustomSection(
																					index,
																					"cards",
																					updatedCards,
																				);
																			}}
																		>
																			<option value="">Select an image</option>
																			{section.images.map((image, i) => (
																				<option key={i} value={image.url}>
																					Image {i + 1}{" "}
																					{image.alt ? `- ${image.alt}` : ""}
																				</option>
																			))}
																		</select>
																	) : (
																		<p className="text-sm text-muted-foreground">
																			Upload images in the section above to use
																			them in cards.
																		</p>
																	)}
																</div>
															</div>
														</div>
													))
												) : (
													<p className="text-sm text-muted-foreground italic">
														Add cards to display in a grid layout. Each card can
														have a title, content, image, and link.
													</p>
												)}
											</div>
										</div>
									)}

									{/* Add team members management for team layout */}
									{section.layout === "team" && (
										<div className="mt-6">
											<div className="flex justify-between items-center mb-2">
												<Label>Team Members</Label>
												<Button
													type="button"
													variant="outline"
													onClick={() => {
														const updatedSection = { ...section };
														if (!updatedSection.teamMembers) {
															updatedSection.teamMembers = [];
														}
														updateCustomSection(
															index,
															"teamMembers",
															updatedSection.teamMembers,
														);
													}}
												>
													Add Organization Members
												</Button>
											</div>

											{/* Search and select organization members */}
											<div className="mb-4">
												<Label htmlFor={`member-search-${index}`}>
													Search Organization Members
												</Label>
												<div className="flex gap-2 mt-1">
													<Input
														id={`member-search-${index}`}
														placeholder="Search by name or email"
														onChange={(e) => {
															// This will trigger a re-render with the filtered members
															setSearchTerm(e.target.value);
														}}
													/>
												</div>

												<div className="mt-3 border rounded-md p-2 max-h-60 overflow-y-auto">
													{members.length > 0 ? (
														members
															.filter((member) => {
																if (!searchTerm) return true;
																const fullName =
																	`${member.user.firstName} ${member.user.lastName}`.toLowerCase();
																const email =
																	member.user.email?.toLowerCase() || "";
																const search = searchTerm.toLowerCase();
																return (
																	fullName.includes(search) ||
																	email.includes(search)
																);
															})
															.map((member) => {
																// Check if this member is already added
																const isAdded = section.teamMembers?.some(
																	(tm) => tm.userId === member.user.id,
																);

																return (
																	<div
																		key={member.user.id}
																		className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md"
																	>
																		<div className="flex items-center gap-2">
																			<div className="font-medium">
																				{member.user.firstName}{" "}
																				{member.user.lastName}
																			</div>
																			<div className="text-sm text-gray-500">
																				{member.user.email}
																			</div>
																		</div>
																		<Button
																			type="button"
																			variant={
																				isAdded ? "secondary" : "outline"
																			}
																			size="sm"
																			onClick={() => {
																				const updatedSection = { ...section };
																				if (!updatedSection.teamMembers) {
																					updatedSection.teamMembers = [];
																				}

																				// If already added, remove it
																				if (isAdded) {
																					updatedSection.teamMembers =
																						updatedSection.teamMembers.filter(
																							(tm) =>
																								tm.userId !== member.user.id,
																						);
																				} else {
																					// Add the member
																					updatedSection.teamMembers.push({
																						userId: member.user.id,
																						name: `${member.user.firstName} ${member.user.lastName}`,
																						role:
																							member.roles &&
																							member.roles.length > 0
																								? member.roles[0].role?.name ||
																									""
																								: "",
																						bio: "",
																						image: "",
																					});
																				}

																				updateCustomSection(
																					index,
																					"teamMembers",
																					updatedSection.teamMembers,
																				);
																			}}
																		>
																			{isAdded ? "Remove" : "Add"}
																		</Button>
																	</div>
																);
															})
													) : (
														<p className="text-sm text-muted-foreground p-2">
															No organization members found.
														</p>
													)}
												</div>
											</div>

											<div className="space-y-4 mt-4">
												<h4 className="font-medium text-sm">
													Selected Team Members
												</h4>
												{section.teamMembers &&
												section.teamMembers.length > 0 ? (
													section.teamMembers.map((member, memberIndex) => (
														<div
															key={`member-${memberIndex}`}
															className="border rounded-md p-4"
														>
															<div className="flex justify-between items-center mb-2">
																<h4 className="font-medium">
																	{member.name ||
																		`Team Member ${memberIndex + 1}`}
																</h4>
																<Button
																	type="button"
																	variant="destructive"
																	size="sm"
																	onClick={() => {
																		const updatedMembers = [
																			...(section.teamMembers || []),
																		];
																		updatedMembers.splice(memberIndex, 1);
																		updateCustomSection(
																			index,
																			"teamMembers",
																			updatedMembers,
																		);
																	}}
																>
																	Remove
																</Button>
															</div>
															<div className="space-y-3">
																<div>
																	<Label>Role/Position</Label>
																	<Input
																		value={member.role || ""}
																		onChange={(e) => {
																			const updatedMembers = [
																				...(section.teamMembers || []),
																			];
																			updatedMembers[memberIndex] = {
																				...updatedMembers[memberIndex],
																				role: e.target.value,
																			};
																			updateCustomSection(
																				index,
																				"teamMembers",
																				updatedMembers,
																			);
																		}}
																		placeholder="Position or Title"
																	/>
																</div>
																<div>
																	<Label>Bio</Label>
																	<Textarea
																		value={member.bio || ""}
																		onChange={(e) => {
																			const updatedMembers = [
																				...(section.teamMembers || []),
																			];
																			updatedMembers[memberIndex] = {
																				...updatedMembers[memberIndex],
																				bio: e.target.value,
																			};
																			updateCustomSection(
																				index,
																				"teamMembers",
																				updatedMembers,
																			);
																		}}
																		placeholder="Short biography"
																		rows={3}
																	/>
																</div>
																<div>
																	<Label>Photo</Label>
																	<div className="mt-2">
																		{member.image ? (
																			<div className="relative group mb-2">
																				<div className="aspect-square w-24 rounded-md overflow-hidden border bg-muted">
																					<img
																						src={member.image}
																						alt={member.name}
																						className="w-full h-full object-cover"
																					/>
																				</div>
																				<Button
																					type="button"
																					variant="destructive"
																					size="sm"
																					className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
																					onClick={() => {
																						const updatedMembers = [
																							...(section.teamMembers || []),
																						];
																						updatedMembers[memberIndex] = {
																							...updatedMembers[memberIndex],
																							image: "",
																						};
																						updateCustomSection(
																							index,
																							"teamMembers",
																							updatedMembers,
																						);
																					}}
																				>
																					<X className="h-3 w-3" />
																				</Button>
																			</div>
																		) : (
																			<UploadButton
																				endpoint="imageUploader"
																				onClientUploadComplete={(res) => {
																					if (res?.[0]) {
																						const updatedMembers = [
																							...(section.teamMembers || []),
																						];
																						updatedMembers[memberIndex] = {
																							...updatedMembers[memberIndex],
																							image: res[0].ufsUrl,
																						};
																						updateCustomSection(
																							index,
																							"teamMembers",
																							updatedMembers,
																						);
																					}
																				}}
																				onUploadError={(error: Error) => {
																					toast({
																						title: "Error uploading photo",
																						description: error.message,
																						variant: "destructive",
																					});
																				}}
																			/>
																		)}
																	</div>
																</div>
															</div>
														</div>
													))
												) : (
													<p className="text-sm text-muted-foreground italic">
														No team members selected yet. Search and add
														organization members above.
													</p>
												)}
											</div>
										</div>
									)}

									{/* Add buttons management for custom sections */}
									<div className="mt-4">
										<div className="flex justify-between items-center mb-2">
											<Label>Section Buttons</Label>
											<Button
												type="button"
												variant="outline"
												onClick={() => {
													const updatedSection = { ...section };
													if (!updatedSection.buttons) {
														updatedSection.buttons = [];
													}
													updatedSection.buttons.push({
														label: "New Button",
														url: "#",
													});
													updateCustomSection(
														index,
														"buttons",
														updatedSection.buttons,
													);
												}}
											>
												Add Button
											</Button>
										</div>

										<div className="space-y-3">
											{section.buttons &&
												section.buttons.map((button, buttonIndex) => (
													<div
														key={`section-${index}-button-${buttonIndex}`}
														className="flex gap-2 items-start"
													>
														<div className="grid grid-cols-2 gap-2 flex-1">
															<Input
																value={button.label}
																onChange={(e) => {
																	const updatedButtons = [
																		...(section.buttons || []),
																	];
																	updatedButtons[buttonIndex] = {
																		...updatedButtons[buttonIndex],
																		label: e.target.value,
																	};
																	updateCustomSection(
																		index,
																		"buttons",
																		updatedButtons,
																	);
																}}
																placeholder="Button Label"
															/>
															<Input
																value={button.url}
																onChange={(e) => {
																	const updatedButtons = [
																		...(section.buttons || []),
																	];
																	updatedButtons[buttonIndex] = {
																		...updatedButtons[buttonIndex],
																		url: e.target.value,
																	};
																	updateCustomSection(
																		index,
																		"buttons",
																		updatedButtons,
																	);
																}}
																placeholder="Button URL"
															/>
														</div>
														<div className="flex gap-2">
															<select
																className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
																value=""
																onChange={(e) => {
																	if (e.target.value) {
																		const formId = e.target.value;
																		const updatedButtons = [
																			...(section.buttons || []),
																		];
																		updatedButtons[buttonIndex] = {
																			...updatedButtons[buttonIndex],
																			url: `/landing/${organization.id}/forms/${formId}`,
																		};
																		updateCustomSection(
																			index,
																			"buttons",
																			updatedButtons,
																		);
																	}
																}}
															>
																<option value="">Link to form...</option>
																{forms.map((form) => (
																	<option key={form.id} value={form.id}>
																		{form.name}
																	</option>
																))}
															</select>
															<Button
																type="button"
																variant="destructive"
																onClick={() => {
																	const updatedButtons = [
																		...(section.buttons || []),
																	];
																	updatedButtons.splice(buttonIndex, 1);
																	updateCustomSection(
																		index,
																		"buttons",
																		updatedButtons,
																	);
																}}
															>
																Remove
															</Button>
														</div>
														{button.url.includes("/forms/") && (
															<p className="text-xs text-green-600 mt-1">
																This button links to a form
															</p>
														)}
													</div>
												))}

											{(!section.buttons || section.buttons.length === 0) && (
												<p className="text-sm text-muted-foreground italic">
													Add buttons to link to forms or other pages
												</p>
											)}
										</div>
									</div>
								</div>
							))
						)}
					</CardContent>
				</Card>

				<Card id="social-section">
					<CardHeader>
						<CardTitle>Social Links</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<Label>Social Media Links</Label>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={addSocialLink}
								>
									Add Link
								</Button>
							</div>

							{Object.keys(socialLinks).length === 0 ? (
								<p className="text-sm text-muted-foreground italic">
									No social links added yet.
								</p>
							) : (
								<div className="space-y-3">
									{Object.entries(socialLinks).map(([platform, url]) => (
										<div key={platform} className="flex gap-2 items-center">
											<select
												className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
												value={platform}
												onChange={(e) => {
													if (e.target.value) {
														updateSocialLink(platform, e.target.value, url);
													}
												}}
											>
												<option value="">Select platform</option>
												<option value="facebook">Facebook</option>
												<option value="twitter">Twitter</option>
												<option value="instagram">Instagram</option>
												<option value="youtube">YouTube</option>
												<option value="linkedin">LinkedIn</option>
												<option value="tiktok">TikTok</option>
											</select>
											<Input
												value={url}
												onChange={(e) => {
													updateSocialLink(platform, platform, e.target.value);
												}}
												placeholder="URL"
												className="flex-1"
											/>
											<Button
												type="button"
												variant="destructive"
												onClick={() => removeSocialLink(platform)}
											>
												Remove
											</Button>
										</div>
									))}
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				<Card id="footer-section">
					<CardHeader>
						<CardTitle>Footer</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="footerContent">Content</Label>
							<Textarea
								id="footerContent"
								name="footerContent"
								value={formData.footerContent}
								onChange={handleFieldChange}
								placeholder="Additional footer content..."
								rows={3}
							/>
						</div>
						<div>
							<Label>
								Contact Information (Optional - will use organization details if
								not provided)
							</Label>
							<div className="space-y-2 mt-2">
								<Input
									name="contactEmail"
									value={formData.contactEmail}
									onChange={handleFieldChange}
									placeholder={organization.email}
								/>
								<Input
									name="contactPhone"
									value={formData.contactPhone}
									onChange={handleFieldChange}
									placeholder={organization.phone}
								/>
								<Input
									name="contactAddress"
									value={formData.contactAddress}
									onChange={handleFieldChange}
									placeholder={`${organization.street}, ${organization.city}, ${organization.state} ${organization.zip}`}
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card id="settings-section">
					<CardHeader>
						<CardTitle>Website Settings</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="customDomain">Custom Domain</Label>
							<Input
								id="customDomain"
								value={customDomain}
								onChange={(e) => setCustomDomain(e.target.value)}
								placeholder="e.g., yourchurch.com"
							/>
							<p className="text-sm text-muted-foreground">
								Enter your custom domain to use for your church website. You'll
								need to set up a CNAME record pointing to
								thegreatcommission.org.
							</p>

							{customDomain && (
								<div className="mt-2">
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={async () => {
											try {
												const response = await fetch(
													`/api/check-domain?domain=${encodeURIComponent(customDomain)}`,
												);
												const data = await response.json();

												if (data.isConfigured) {
													toast.success("Domain is properly configured! 🎉");
												} else if (!data.exists) {
													toast.error(
														"This domain is not saved in our system yet. Save your changes first.",
													);
												} else if (data.dns.error) {
													toast.error(`DNS error: ${data.dns.error}`);
												} else if (!data.dns.success) {
													toast.error(
														"CNAME record not properly configured. Please check your DNS settings.",
													);
												} else {
													toast.error(
														"Domain verification failed. Please check your settings.",
													);
												}
											} catch (error) {
												toast.error("Error checking domain configuration");
												console.error(error);
											}
										}}
									>
										Verify Domain Setup
									</Button>
								</div>
							)}
						</div>

						<div className="mt-4 p-4 bg-muted rounded-md">
							<h3 className="text-sm font-medium mb-2">
								How to set up your custom domain:
							</h3>
							<ol className="text-sm text-muted-foreground space-y-2 list-decimal pl-4">
								<li>
									Purchase a domain from a domain registrar (like Namecheap,
									GoDaddy, or Google Domains).
								</li>
								<li>
									In your domain registrar's DNS settings, add a CNAME record:
								</li>
								<ul className="list-disc pl-6 mt-1 space-y-1">
									<li>
										<strong>Host/Name:</strong> @ or www (depending on if you
										want example.com or www.example.com)
									</li>
									<li>
										<strong>Value/Target:</strong> thegreatcommission.org
									</li>
									<li>
										<strong>TTL:</strong> 3600 (or Auto)
									</li>
								</ul>
								<li>Enter your domain above (without http:// or https://)</li>
								<li>
									Save your changes and wait for DNS propagation (can take up to
									48 hours)
								</li>
							</ol>
							<p className="text-sm text-muted-foreground mt-2">
								Once set up, your church's landing page will be accessible at
								your custom domain.
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="mb-6">
					<CardHeader>
						<CardTitle>Contact Information</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div>
								<Label htmlFor="contactEmail">Contact Email</Label>
								<Input
									id="contactEmail"
									value={formData.contactEmail}
									onChange={(e) =>
										setFormData({ ...formData, contactEmail: e.target.value })
									}
									placeholder="Enter contact email"
								/>
							</div>
							<div>
								<Label htmlFor="contactPhone">Contact Phone</Label>
								<Input
									id="contactPhone"
									value={formData.contactPhone}
									onChange={(e) =>
										setFormData({ ...formData, contactPhone: e.target.value })
									}
									placeholder="Enter contact phone"
								/>
							</div>
							<div>
								<Label htmlFor="contactAddress">Contact Address</Label>
								<Textarea
									id="contactAddress"
									value={formData.contactAddress}
									onChange={(e) =>
										setFormData({
											...formData,
											contactAddress: e.target.value,
										})
									}
									placeholder="Enter contact address"
								/>
							</div>
							<div className="flex items-center space-x-2">
								<input
									type="checkbox"
									id="contactFormEnabled"
									checked={formData.contactFormEnabled}
									onChange={(e) =>
										setFormData({
											...formData,
											contactFormEnabled: e.target.checked,
										})
									}
									className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
								/>
								<Label htmlFor="contactFormEnabled">
									Enable Contact Form Section
								</Label>
							</div>
						</div>
					</CardContent>
				</Card>

				<div className="flex justify-end gap-4 p-3">
					<Button
						type="button"
						variant="outline"
						onClick={() => {
							if (hasUnsavedChanges) {
								setShowUnsavedDialog(true);
								setPendingNavigation(`/churches/${organization.id}/landing`);
							} else {
								navigate(`/churches/${organization.id}/landing`);
							}
						}}
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => {
							navigate(`/landing/${organization.id}`);
						}}
					>
						Preview Landing Page
					</Button>
					<Button type="submit" disabled={!hasUnsavedChanges}>
						Save Changes
					</Button>
				</div>
			</form>

			<AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
						<AlertDialogDescription>
							You have unsaved changes. Are you sure you want to leave? Your
							changes will be lost.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setPendingNavigation(null)}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (pendingNavigation) {
									navigate(pendingNavigation);
								}
							}}
						>
							Leave Page
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
