import { OrganizationDataService } from "@/server/dataServices/OrganizationDataService";
import { db } from "@/server/db/dbConnection";
import { PermissionsService } from "@/server/services/PermissionsService";
import { eq } from "drizzle-orm";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import {
	useBeforeUnload,
	useLoaderData,
	useNavigate,
	useSubmit,
	useParams,
} from "react-router";
import {
	churchOrganization,
	formConfig,
	landingPageConfig,
} from "server/db/schema";
import { toast } from "sonner";
import type { CustomSectionProps } from "~/components/CustomSection";
import { AboutEditor } from "~/components/landing/AboutEditor";
import { CustomSectionsEditor } from "~/components/landing/CustomSectionsEditor";
import { HeroEditor } from "~/components/landing/HeroEditor";
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
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { createAuthLoader } from "~/server/auth/authLoader";
import { LandingToolbar } from "./churches.$organization.landing._index";

// Mini-sidenav component for quick navigation
function MiniSidenav() {
	const [activeSection, setActiveSection] = useState<string | null>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const [isCollapsed, setIsCollapsed] = useState(false);

	// Check if on mobile
	useEffect(() => {
		const mediaQuery = window.matchMedia("(max-width: 768px)");
		setIsMobile(mediaQuery.matches);

		const handleResize = () => {
			setIsMobile(mediaQuery.matches);
		};

		mediaQuery.addEventListener("change", handleResize);
		return () => {
			mediaQuery.removeEventListener("change", handleResize);
		};
	}, []);

	// Update active section based on scroll position
	useEffect(() => {
		const handleScroll = () => {
			const sections = document.querySelectorAll('[id$="-section"]');
			let currentActiveSection: string | null = null;

			for (const section of sections) {
				const sectionTop = section.getBoundingClientRect().top;
				if (sectionTop < 100) {
					currentActiveSection = section.id;
				}
			}

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
			if (isMobile) {
				setIsOpen(false); // Close the menu after clicking on mobile
			}
		}
	};

	// Define nav sections
	const navSections = [
		{ id: "hero-section", label: "Hero" },
		{ id: "about-section", label: "About" },
		{ id: "custom-sections", label: "Custom Sections" },
		{ id: "social-section", label: "Social" },
		{ id: "footer-section", label: "Footer" },
		{ id: "settings-section", label: "Settings" },
	];

	// Calculate approximate height based on number of sections
	const navHeight = navSections.length * 40 + 35; // 40px per button + padding

	if (isMobile) {
		return (
			<div className="fixed bottom-6 right-6 z-10">
				<AnimatePresence>
					{isOpen && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 20 }}
							className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg p-2 mb-2"
						>
							<div className="flex flex-col gap-1">
								{navSections.map((section) => (
									<button
										type="button"
										key={section.id}
										onClick={() => scrollToSection(section.id)}
										className={`p-2 rounded-md text-sm whitespace-nowrap ${
											activeSection === section.id
												? "bg-blue-100 text-blue-700"
												: "hover:bg-gray-100"
										}`}
									>
										{section.label}
									</button>
								))}
							</div>
						</motion.div>
					)}
				</AnimatePresence>

				<button
					type="button"
					onClick={() => setIsOpen(!isOpen)}
					className="w-12 h-12 rounded-full bg-primary text-white shadow-md flex items-center justify-center hover:bg-primary/90 transition-colors"
				>
					{isOpen ? (
						<X className="h-5 w-5" />
					) : (
						<ChevronUp className="h-5 w-5" />
					)}
				</button>
			</div>
		);
	}

	return (
		<div className="fixed right-4 top-1/3 z-10 flex">
			<AnimatePresence>
				{!isCollapsed && (
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: 20 }}
						className="bg-white rounded-l-lg shadow-md p-2 border border-r-0"
					>
						<div className="flex flex-col gap-2">
							{navSections.map((section) => (
								<button
									type="button"
									key={section.id}
									onClick={() => scrollToSection(section.id)}
									className={`p-2 rounded-md text-sm ${
										activeSection === section.id
											? "bg-blue-100 text-blue-700"
											: "hover:bg-gray-100"
									}`}
								>
									{section.label}
								</button>
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<button
				type="button"
				onClick={() => setIsCollapsed(!isCollapsed)}
				className={`bg-white border shadow-md flex items-center justify-center transition-all duration-200
					${
						isCollapsed
							? "border-l rounded-lg px-3 py-2 bg-primary/5 hover:bg-primary/10"
							: "border-l-0 rounded-r-lg px-2"
					}`}
				aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
				style={isCollapsed ? { minHeight: `${navHeight}px` } : {}}
			>
				<ChevronUp
					className={`h-5 w-5 transform transition-transform ${isCollapsed ? "rotate-90 text-primary" : "-rotate-90"}`}
				/>
			</button>
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
	let vercelResponse = null;

	if (customDomain !== undefined) {
		// Update the database
		await db
			.update(churchOrganization)
			.set({
				customDomain: customDomain || null,
				updatedAt: now,
			})
			.where(eq(churchOrganization.id, params.organization));

		// If there's a custom domain, register it with Vercel
		if (customDomain) {
			try {
				// Call our API endpoint to register the domain with Vercel
				console.log("Registering domain from action:", {
					domain: customDomain,
					organizationId: params.organization,
				});

				const response = await fetch("/api/configure-domain", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						domain: customDomain,
						organizationId: params.organization,
					}),
				});

				// Log response status
				console.log("Registration response status:", response.status);

				vercelResponse = await response.json();
				console.log("Vercel domain registration response:", vercelResponse);
			} catch (error) {
				console.error("Error registering domain with Vercel:", error);
			}
		}
	}

	// Return success response with Vercel verification info if available
	return {
		success: true,
		vercelVerification: vercelResponse?.vercelVerification || null,
		vercelError: vercelResponse?.vercelError || null,
	};
}, true);

export default function LandingConfig() {
	const { config, organization, permissions, forms, members } = useLoaderData();
	const params = useParams();
	const submit = useSubmit();
	const navigate = useNavigate();
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
	const [pendingNavigation, setPendingNavigation] = useState<string | null>(
		null,
	);
	const [isSubmitting, setIsSubmitting] = useState(false);

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

	// Vercel verification state
	const [vercelVerification, setVercelVerification] = useState(null);
	const [vercelError, setVercelError] = useState(null);

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
		setIsSubmitting(true);
		setVercelVerification(null);
		setVercelError(null);

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

		// Get theme colors from organization
		const themeColors = organization?.themeColors
			? JSON.parse(organization.themeColors)
			: {
					primary: "#3b82f6",
					secondary: "#1e293b",
					accent: "#8b5cf6",
				};

		// Create a clean gradient string without whitespace or newlines
		const backgroundGradient = `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.accent || "#8b5cf6"} 50%, ${themeColors.secondary} 100%)`;

		// Add about section configuration
		const aboutSection = {
			title: formData.aboutTitle,
			subtitle: formData.aboutSubtitle,
			content: formData.aboutContent,
			logoImage: aboutLogoUrl,
			buttons: aboutButtons,
			animateGradient: true,
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

		fetch(`/churches/${params.organization}/landing/config`, {
			method: "POST",
			body: submitData,
		})
			.then((res) => res.json())
			.then((data) => {
				setIsSubmitting(false);
				if (data.success) {
					toast.success("Settings saved successfully!");

					// Handle Vercel verification data if present
					if (data.vercelVerification) {
						setVercelVerification(data.vercelVerification);
					}

					// Handle Vercel error if present
					if (data.vercelError) {
						setVercelError(data.vercelError);
						toast.error(`Vercel domain registration: ${data.vercelError}`);
					}
				} else {
					toast.error("Failed to save settings. Please try again.");
				}
			})
			.catch((error) => {
				setIsSubmitting(false);
				toast.error("An error occurred. Please try again.");
				console.error("Error saving settings:", error);
			});
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

	// Add a function to update hero config
	const updateHeroConfig = (field: string, value: string) => {
		setHeroConfig((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	// Add a function to manually verify domain
	const verifyDomain = async () => {
		if (!customDomain) return;

		setIsSubmitting(true);
		setVercelVerification(null);
		setVercelError(null);

		try {
			console.log("Verifying domain:", {
				domain: customDomain,
				organizationId: params.organization,
			});

			const response = await fetch("/api/configure-domain", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					domain: customDomain,
					organizationId: params.organization,
				}),
			});

			// Log response status
			console.log("Verification response status:", response.status);

			const data = await response.json();
			console.log("Verification response data:", data);

			if (data.success) {
				toast.success("Domain verification initiated!");

				if (data.vercelVerification) {
					setVercelVerification(data.vercelVerification);
				}

				if (data.vercelError) {
					setVercelError(data.vercelError);
					toast.error(`Vercel domain registration: ${data.vercelError}`);
				}
			} else {
				toast.error(
					`Failed to verify domain: ${data.error || "Unknown error"}`,
				);
			}
		} catch (error) {
			console.error("Error verifying domain:", error);
			toast.error(`An error occurred: ${error.message || "Unknown error"}`);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Add a function to test JSON parsing
	const testJsonParsing = async () => {
		try {
			const response = await fetch("/api/test-json", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					testField: "Test value",
					timestamp: new Date().toISOString(),
				}),
			});

			const data = await response.json();
			console.log("Test JSON response:", data);
			toast.success("Test JSON request successful");
		} catch (error) {
			console.error("Error testing JSON:", error);
			toast.error(`Test JSON error: ${error.message || "Unknown error"}`);
		}
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
				<h1 className="text-3xl font-bold">Website Configuration</h1>
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
						<CardDescription>
							The hero section is the main banner at the top of your landing
							page. It includes your headline, background image and key
							messaging to make a strong first impression and communicate your
							church's identity to visitors.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<HeroEditor
							heroImageUrl={heroImageUrl}
							setHeroImageUrl={setHeroImageUrl}
							heroConfig={heroConfig}
							updateHeroConfig={updateHeroConfig}
							formData={formData}
							handleFieldChange={handleFieldChange}
						/>
					</CardContent>
				</Card>

				<Card id="about-section">
					<CardHeader>
						<CardTitle>About Section</CardTitle>
					</CardHeader>
					<CardContent>
						<AboutEditor
							aboutLogoUrl={aboutLogoUrl}
							setAboutLogoUrl={setAboutLogoUrl}
							aboutButtons={aboutButtons}
							addAboutButton={addAboutButton}
							updateAboutButton={updateAboutButton}
							removeAboutButton={removeAboutButton}
							formData={formData}
							handleFieldChange={handleFieldChange}
							onContentChange={(content) => {
								setFormData((prev) => ({
									...prev,
									aboutContent: content,
								}));
							}}
							config={config}
							organization={organization}
						/>
					</CardContent>
				</Card>

				<Card id="custom-sections">
					<CardHeader className="flex flex-row justify-between items-center">
						<CardTitle>Custom Sections</CardTitle>
						<Button type="button" variant="outline" onClick={addCustomSection}>
							Add New Section
						</Button>
					</CardHeader>
					<CardContent>
						<CustomSectionsEditor
							customSections={customSections}
							forms={forms}
							organization={organization}
							addCustomSection={addCustomSection}
							updateCustomSection={updateCustomSection}
							removeCustomSection={removeCustomSection}
							moveCustomSection={moveCustomSection}
						/>
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
								onChange={(e) =>
									setCustomDomain(e.target.value.trim().toLowerCase())
								}
								placeholder="e.g., yourchurch.com or www.yourchurch.com"
							/>
							<p className="text-sm text-muted-foreground">
								Enter your custom domain without http:// or https://. You'll
								need to set up a CNAME record pointing to
								thegreatcommission.life.
							</p>

							{customDomain && (
								<div className="mt-2 flex gap-2">
									{organization?.customDomain === customDomain && (
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => {
												window.open(`https://${customDomain}`, "_blank");
											}}
										>
											Visit Site
										</Button>
									)}

									{(vercelVerification || vercelError) && (
										<>
											<Button
												type="button"
												variant="secondary"
												size="sm"
												onClick={verifyDomain}
												disabled={isSubmitting}
											>
												{isSubmitting ? "Verifying..." : "Verify Domain"}
											</Button>

											{process.env.NODE_ENV === "development" && (
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={testJsonParsing}
												>
													Test JSON
												</Button>
											)}
										</>
									)}
								</div>
							)}

							{vercelVerification && (
								<div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
									<h3 className="text-sm font-medium mb-2 text-yellow-800 dark:text-yellow-300">
										Domain Verification Required
									</h3>
									<p className="text-sm text-yellow-700 dark:text-yellow-400 mb-2">
										Please add the following DNS record in your DNS provider
										(Cloudflare, GoDaddy, etc.) to verify your domain ownership:
									</p>

									{vercelVerification.type === "TXT" && (
										<>
											<div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-md font-mono text-xs">
												<p>
													<strong>Type:</strong> TXT
												</p>
												<p>
													<strong>Name:</strong> {vercelVerification.domain}
												</p>
												<p>
													<strong>Value:</strong> {vercelVerification.value}
												</p>
												<p>
													<strong>TTL:</strong> Auto (or 3600)
												</p>
											</div>

											<div className="mt-4 space-y-3">
												<h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
													How to add this record in Cloudflare:
												</h4>
												<ol className="text-sm text-yellow-700 dark:text-yellow-400 list-decimal pl-5 space-y-2">
													<li>Log in to your Cloudflare account</li>
													<li>
														Select your domain (
														{customDomain.split(".").slice(-2).join(".")})
													</li>
													<li>Click on "DNS" in the top navigation</li>
													<li>Click "Add record"</li>
													<li>Select "TXT" as the type</li>
													<li>
														For "Name", enter:{" "}
														<span className="font-mono bg-yellow-50 dark:bg-yellow-900 px-1">
															{vercelVerification.domain}
														</span>
													</li>
													<li>
														For "Content", enter:{" "}
														<span className="font-mono bg-yellow-50 dark:bg-yellow-900 px-1">
															{vercelVerification.value}
														</span>
													</li>
													<li>Leave TTL as "Auto"</li>
													<li>
														Make sure "Proxy status" is set to "DNS only" (gray
														cloud)
													</li>
													<li>Click "Save"</li>
												</ol>
											</div>
										</>
									)}

									<p className="text-sm text-yellow-700 dark:text-yellow-400 mt-4">
										After adding this record, it may take up to 48 hours for DNS
										changes to propagate. Once you've added the record and
										waited for propagation, click the "Verify Domain" button
										above to check verification status.
									</p>
								</div>
							)}

							{vercelError && (
								<div className="mt-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
									<h3 className="text-sm font-medium mb-2 text-red-800 dark:text-red-300">
										Domain Registration Error
									</h3>
									<p className="text-sm text-red-700 dark:text-red-400">
										{vercelError}
									</p>
									<div className="mt-3 space-y-2">
										<h4 className="text-sm font-medium text-red-800 dark:text-red-300">
											Troubleshooting Steps:
										</h4>
										<ol className="text-sm text-red-700 dark:text-red-400 list-decimal pl-5 space-y-1">
											<li>
												Verify that your CNAME record is correctly set up in
												Cloudflare pointing to{" "}
												<span className="font-mono bg-red-100 dark:bg-red-900 px-1">
													thegreatcommission.life
												</span>
											</li>
											<li>
												Make sure the CNAME record is set to "Proxied" (orange
												cloud) in Cloudflare
											</li>
											<li>
												Check that you don't have conflicting DNS records for
												the same domain
											</li>
											<li>
												If you're using a root domain, ensure you're using
												Cloudflare's CNAME flattening feature
											</li>
											<li>
												Wait a few minutes and try again using the "Verify
												Domain" button above
											</li>
										</ol>
									</div>
									<p className="text-sm text-red-700 dark:text-red-400 mt-3">
										If you continue to experience issues, please check your
										Cloudflare SSL/TLS settings:
										<ol className="list-decimal pl-5 mt-1 space-y-1">
											<li>In Cloudflare, go to SSL/TLS → Overview</li>
											<li>Set the encryption mode to "Flexible" temporarily</li>
											<li>Try verifying the domain again</li>
											<li>
												Once verified, you can change back to "Full" if desired
											</li>
										</ol>
									</p>
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
										<strong>For a root domain</strong> (example.com):
										<ul className="list-disc pl-6 mt-1">
											<li>
												<strong>Host/Name:</strong> @ (or leave blank)
											</li>
											<li>
												<strong>Value/Target:</strong> thegreatcommission.life
											</li>
											<li>
												<strong>TTL:</strong> 3600 (or Auto)
											</li>
											<li>
												<strong>Note:</strong> Some DNS providers don't allow
												CNAME for root domains. If this is the case, use a
												subdomain instead or look for "CNAME flattening" or
												"ANAME" options.
											</li>
										</ul>
									</li>
									<li className="mt-2">
										<strong>For a subdomain</strong> (www.example.com or
										church.example.com):
										<ul className="list-disc pl-6 mt-1">
											<li>
												<strong>Host/Name:</strong> www (or your subdomain)
											</li>
											<li>
												<strong>Value/Target:</strong> thegreatcommission.life
											</li>
											<li>
												<strong>TTL:</strong> 3600 (or Auto)
											</li>
										</ul>
									</li>
								</ul>
								<li>Enter your domain above (without http:// or https://)</li>
								<li>Click "Save Changes" at the bottom of the page</li>
								<li>Wait for DNS propagation (can take up to 48 hours)</li>
								<li>
									Once DNS is properly configured, your site will be accessible
									at your custom domain
								</li>
							</ol>
							<p className="text-sm text-muted-foreground mt-2">
								Once set up, your church's landing page will be accessible at
								your custom domain. All SSL certificates are handled
								automatically.
							</p>

							<h3 className="text-sm font-medium mt-4 mb-2">
								Troubleshooting:
							</h3>
							<ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
								<li>
									<strong>DNS not configured:</strong> Make sure your CNAME
									record points to{" "}
									<code className="bg-background px-1 rounded">
										thegreatcommission.life
									</code>{" "}
									(not thegreatcommission.org or any other domain).
								</li>
								<li>
									<strong>Root domain issues:</strong> If you're using a root
									domain (example.com), some DNS providers don't allow CNAME
									records. Try using a www subdomain instead or look for "CNAME
									flattening" or "ANAME" options.
								</li>
								<li>
									<strong>Propagation delay:</strong> DNS changes can take up to
									48 hours to propagate worldwide. If your site isn't accessible
									immediately, try again later.
								</li>
								<li>
									<strong>SSL certificate:</strong> SSL certificates are
									provisioned automatically after DNS verification. This may
									take a few minutes after DNS propagation is complete.
								</li>
							</ul>
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
						Preview Website
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
