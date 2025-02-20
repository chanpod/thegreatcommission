import {
	useLoaderData,
	useSubmit,
	useBeforeUnload,
	Link,
	useNavigate,
	Form,
} from "react-router";
import { db } from "~/server/dbConnection";
import { churchOrganization, landingPageConfig } from "server/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { UploadButton } from "~/utils/uploadthing";
import type { Route } from "../+types/root";
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
import { createAuthLoader } from "~/server/auth/authLoader";
import { RichTextEditor } from "~/components/messaging/RichTextEditor";
import { ClientOnly } from "remix-utils/client-only";

export const loader = createAuthLoader(
	async ({ request, params, userContext }) => {
		const user = userContext?.user;
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

		return { config, organization };
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
		aboutTitle: formData.get("aboutTitle") as string,
		aboutContent: formData.get("aboutContent") as string, // This will contain the rich text HTML
		footerContent: formData.get("footerContent") as string,
		socialLinks: formData.get("socialLinks") as string,
		contactEmail: formData.get("contactEmail") as string,
		contactPhone: formData.get("contactPhone") as string,
		contactAddress: formData.get("contactAddress") as string,
		updatedAt: now,
	};

	await db
		.update(landingPageConfig)
		.set(configData)
		.where(eq(landingPageConfig.churchOrganizationId, params.organization));

	return { success: true };
}, true);

export default function LandingConfig() {
	const { config, organization } = useLoaderData<typeof loader>();
	const submit = useSubmit();
	const navigate = useNavigate();
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
	const [pendingNavigation, setPendingNavigation] = useState<string | null>(
		null,
	);
	const [socialLinks, setSocialLinks] = useState<Record<string, string>>(
		config?.socialLinks ? JSON.parse(config.socialLinks) : {},
	);
	const [heroImageUrl, setHeroImageUrl] = useState<string>(
		config?.heroImage || "",
	);
	const [formData, setFormData] = useState({
		heroHeadline: config?.heroHeadline || "",
		heroSubheadline: config?.heroSubheadline || "",
		aboutTitle: config?.aboutTitle || "",
		aboutContent: config?.aboutContent || "",
		footerContent: config?.footerContent || "",
		contactEmail: config?.contactEmail || "",
		contactPhone: config?.contactPhone || "",
		contactAddress: config?.contactAddress || "",
	});

	// Track changes
	useEffect(() => {
		const hasChanges =
			heroImageUrl !== (config?.heroImage || "") ||
			JSON.stringify(socialLinks) !== (config?.socialLinks || "{}") ||
			formData.heroHeadline !== (config?.heroHeadline || "") ||
			formData.heroSubheadline !== (config?.heroSubheadline || "") ||
			formData.aboutTitle !== (config?.aboutTitle || "") ||
			formData.aboutContent !== (config?.aboutContent || "") ||
			formData.footerContent !== (config?.footerContent || "") ||
			formData.contactEmail !== (config?.contactEmail || "") ||
			formData.contactPhone !== (config?.contactPhone || "") ||
			formData.contactAddress !== (config?.contactAddress || "");

		setHasUnsavedChanges(hasChanges);
	}, [heroImageUrl, socialLinks, formData, config]);

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
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const submitData = new FormData();

		// Add all form data fields
		Object.entries(formData).forEach(([key, value]) => {
			submitData.set(key, value);
		});

		// Add social links and hero image
		submitData.set("socialLinks", JSON.stringify(socialLinks));
		submitData.set("heroImage", heroImageUrl);

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

	return (
		<>
			<div className="flex justify-between items-center mb-4 p-3">
				<h1 className="text-2xl font-bold">Landing Page Configuration</h1>
				<div className="flex items-center gap-4">
					{hasUnsavedChanges && (
						<div className="text-yellow-600 flex items-center gap-2">
							<span className="animate-pulse">●</span>
							<span>You have unsaved changes</span>
						</div>
					)}
					<Link to={`/landing/${organization.id}`} target="_blank">
						<Button variant="secondary">View Public Page</Button>
					</Link>
				</div>
			</div>

			<Form onSubmit={handleSubmit} className="space-y-8">
				<Card>
					<CardHeader>
						<CardTitle>Hero Section</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="heroImage">Hero Image</Label>
							{heroImageUrl && (
								<div className="relative w-full aspect-video rounded-lg overflow-hidden mb-2">
									<img
										src={heroImageUrl}
										alt="Hero"
										className="object-cover w-full h-full"
									/>
								</div>
							)}
							<UploadButton
								endpoint="imageUploader"
								onClientUploadComplete={(res) => {
									if (res?.[0]) {
										setHeroImageUrl(res[0].url);
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
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>About Section</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<Label htmlFor="aboutTitle">Title</Label>
							<Input
								id="aboutTitle"
								name="aboutTitle"
								value={formData.aboutTitle}
								onChange={handleFieldChange}
								placeholder="About Us"
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
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Footer</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
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
						<div>
							<div className="flex justify-between items-center mb-2">
								<Label>Social Links</Label>
								<Button type="button" variant="outline" onClick={addSocialLink}>
									Add Link
								</Button>
							</div>
							<div className="space-y-2">
								{Object.entries(socialLinks).map(([platform, url]) => (
									<div key={`${platform}-${url}`} className="flex gap-2">
										<Input
											value={platform}
											onChange={(e) =>
												updateSocialLink(platform, e.target.value, url)
											}
											placeholder="Platform (e.g., Facebook)"
										/>
										<Input
											value={url}
											onChange={(e) =>
												updateSocialLink(platform, platform, e.target.value)
											}
											placeholder="URL"
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
						</div>
					</CardContent>
				</Card>

				<div className="flex justify-end gap-4 p-3">
					<Button
						type="button"
						variant="ghost"
						onClick={() => handleNavigation(`/churches/${organization.id}`)}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={!hasUnsavedChanges}>
						Save Changes
					</Button>
				</div>
			</Form>

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
