import { useState, useEffect } from "react";
import {
	useActionData,
	redirect,
	useSubmit,
	Form,
	useSearchParams,
	useNavigate,
	useLoaderData,
} from "react-router";
import {
	Check,
	ChevronRight,
	Church,
	Globe,
	MapPin,
	Settings,
	Image,
	Palette,
	ChevronLeft,
	UserCircle,
} from "lucide-react";
import { db } from "~/server/dbConnection";
import {
	churchOrganization,
	usersTochurchOrganization,
	organizationRoles,
	usersToOrganizationRoles,
	landingPageConfig,
} from "server/db/schema";
import { eq } from "drizzle-orm";
import { getAllPermissions } from "~/lib/permissions";
import { toast } from "sonner";
import { ColorPicker } from "~/components/forms/ColorPicker";
import { UploadButton } from "~/utils/uploadthing";
import { SignedOut, SignIn, SignUp } from "@clerk/react-router";

// UI Components
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
	CardFooter,
} from "~/components/ui/card";
import type { Route } from "./+types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { AuthService } from "~/services/AuthService";
import { getAuth, rootAuthLoader } from "@clerk/react-router/ssr.server";

// Define the steps of the wizard
const STEPS = [
	{
		id: "auth",
		title: "Sign In",
		icon: <UserCircle className="h-5 w-5" />,
	},
	{
		id: "church-info",
		title: "Church Information",
		icon: <Church className="h-5 w-5" />,
	},
	{ id: "location", title: "Location", icon: <MapPin className="h-5 w-5" /> },
	{ id: "branding", title: "Branding", icon: <Palette className="h-5 w-5" /> },
	{
		id: "landing-page",
		title: "Landing Page",
		icon: <Globe className="h-5 w-5" />,
	},
	{ id: "complete", title: "Complete", icon: <Check className="h-5 w-5" /> },
];

export const loader = async (request: Route.LoaderArgs) => {
	return rootAuthLoader(request, async ({ request, params, context }) => {
		// Get user context
		const userContext = await AuthService.getAuthenticatedUser(request.auth);

		// If authenticated and on auth step, redirect to church-info step
		const url = new URL(request.url);
		const currentStep = url.searchParams.get("step");
		if (userContext && (!currentStep || currentStep === "auth")) {
			return redirect("/getting-started?step=church-info");
		}

		return {
			isAuthenticated: !!userContext,
		};
	});
};

export const action = async (request: Route.ActionArgs) => {
	return rootAuthLoader(request, async ({ request, params, context }) => {
		// Get user context
		const userContext = await AuthService.getAuthenticatedUser(request.auth);
		const userId = userContext?.user.id;
		const formData = await request.formData();
		const step = formData.get("step") as string;
		const completedStep = formData.get("completedStep") as string;

		// For authentication step, we don't need to check authentication
		if (step === "auth") {
			return {
				status: 200,
				step,
				data: Object.fromEntries(formData.entries()),
				message: "Auth step saved",
			};
		}

		// For all other steps, verify the user is authenticated

		if (!userContext) {
			return redirect("/getting-started?step=auth");
		}

		// Store data in session for multi-step form
		if (step !== "complete") {
			return {
				status: 200,
				step,
				data: Object.fromEntries(formData.entries()),
				message: "Step data saved",
			};
		}

		// Final submission - create church and landing page
		try {
			// Begin transaction to ensure all operations succeed or fail together
			const response = await db.transaction(async (tx) => {
				// Create the organization
				const [org] = await tx
					.insert(churchOrganization)
					.values({
						name: formData.get("name") as string,
						street: formData.get("street") as string,
						city: formData.get("city") as string,
						state: formData.get("state") as string,
						zip: formData.get("zip") as string,
						churchBannerUrl:
							(formData.get("churchBannerUrl") as string) || null,
						mainChurchWebsite:
							(formData.get("mainChurchWebsite") as string) || null,
						createdById: userContext.user.id,
						updatedAt: new Date(),
						email: (formData.get("contactEmail") as string) || null,
						phone: (formData.get("contactPhone") as string) || null,
						description: (formData.get("aboutContent") as string) || null,
						avatarUrl: null,
						parentOrganizationId: null,
						themeColors: (formData.get("themeColors") as string) || null,
					})
					.returning();

				// Create admin role
				const [adminRole] = await tx
					.insert(organizationRoles)
					.values({
						name: "Admin",
						description: "Full administrative control",
						permissions: getAllPermissions(),
						isDefault: false,
						isActive: true,
						churchOrganizationId: org.id,
						updatedAt: new Date(),
						createdAt: new Date(),
					})
					.returning();

				// Assign creator to admin role
				await tx.insert(usersToOrganizationRoles).values({
					userId: userId,
					organizationRoleId: adminRole.id,
					churchOrganizationId: org.id,
					updatedAt: new Date(),
					createdAt: new Date(),
				});

				// Make creator an admin in the organization
				await tx.insert(usersTochurchOrganization).values({
					userId: userId,
					churchOrganizationId: org.id,
					isAdmin: true,
				});

				// Create landing page config
				await tx.insert(landingPageConfig).values({
					churchOrganizationId: org.id,
					heroImage: (formData.get("heroImage") as string) || null,
					heroHeadline: (formData.get("heroHeadline") as string) || "",
					heroSubheadline: (formData.get("heroSubheadline") as string) || "",
					logoUrl: (formData.get("logoUrl") as string) || null,
					aboutTitle:
						(formData.get("aboutTitle") as string) || "About Our Church",
					aboutContent: (formData.get("aboutContent") as string) || "",
					footerContent: (formData.get("footerContent") as string) || "",
					socialLinks: "{}",
					contactEmail: (formData.get("contactEmail") as string) || null,
					contactPhone: (formData.get("contactPhone") as string) || null,
					contactAddress: `${formData.get("street")}, ${formData.get("city")}, ${formData.get("state")} ${formData.get("zip")}`,
					createdAt: new Date(),
					updatedAt: new Date(),
				});

				return org;
			});

			return redirect(`/churches/${response.id}`);
		} catch (error) {
			console.error("Failed to create church:", error);
			return { status: 500, message: "Failed to create church" };
		}
	});
};

export default function GettingStarted() {
	const actionData = useActionData<typeof action>();
	const loaderData = useLoaderData<typeof loader>();
	const submit = useSubmit();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();

	// Get the step from URL params or default to auth step
	const stepParam = searchParams.get("step");
	const initialStepIndex = stepParam
		? STEPS.findIndex((s) => s.id === stepParam)
		: loaderData.isAuthenticated
			? 1 // Skip to church info if already authenticated
			: 0; // Default to auth step

	const [currentStep, setCurrentStep] = useState(
		initialStepIndex >= 0 ? initialStepIndex : 0,
	);
	const [formData, setFormData] = useState<Record<string, string>>({
		themeColors: JSON.stringify({
			primary: "#3b82f6",
			secondary: "#1e293b",
			accent: "#8b5cf6",
		}),
	});
	const [heroImageUrl, setHeroImageUrl] = useState("");
	const [logoUrl, setLogoUrl] = useState("");
	const [themeColors, setThemeColors] = useState<Record<string, string>>({
		primary: "#3b82f6",
		secondary: "#1e293b",
		accent: "#8b5cf6",
	});

	// Update URL when step changes
	useEffect(() => {
		const newParams = new URLSearchParams(searchParams);
		newParams.set("step", STEPS[currentStep].id);
		setSearchParams(newParams, { replace: true });
	}, [currentStep, setSearchParams, searchParams]);

	// Load data from previous steps if available
	useEffect(() => {
		if (actionData?.data) {
			setFormData((prev) => ({ ...prev, ...actionData.data }));

			// Update special fields
			if (actionData.data.heroImage) {
				setHeroImageUrl(actionData.data.heroImage);
			}

			if (actionData.data.logoUrl) {
				setLogoUrl(actionData.data.logoUrl);
			}

			if (actionData.data.themeColors) {
				try {
					setThemeColors(JSON.parse(actionData.data.themeColors));
				} catch (e) {
					console.error("Error parsing theme colors:", e);
				}
			}

			// Move to the next step if a step was successfully saved
			if (actionData.step) {
				const nextStepIndex = STEPS.findIndex(
					(step) => step.id === actionData.step,
				);
				if (nextStepIndex > currentStep) {
					setCurrentStep(nextStepIndex);
				}
			}
		}
	}, [actionData, currentStep]);

	// Check if user is authenticated and skip auth step if needed
	useEffect(() => {
		if (loaderData.isAuthenticated && currentStep === 0 && !stepParam) {
			setCurrentStep(1);
			const newParams = new URLSearchParams(searchParams);
			newParams.set("step", STEPS[1].id);
			setSearchParams(newParams, { replace: true });
		}
	}, [
		loaderData.isAuthenticated,
		currentStep,
		searchParams,
		setSearchParams,
		stepParam,
	]);

	const handleFormChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmitStep = (nextStep: string) => {
		// Add theme colors to form data
		const updatedFormData = {
			...formData,
			step: nextStep,
			completedStep: STEPS[currentStep].id,
			themeColors: JSON.stringify(themeColors),
			heroImage: heroImageUrl,
			logoUrl: logoUrl,
		};

		submit(updatedFormData, { method: "post" });
	};

	const goToNextStep = () => {
		if (currentStep < STEPS.length - 1) {
			handleSubmitStep(STEPS[currentStep + 1].id);
		}
	};

	const handleComplete = () => {
		// Submit the final form with complete step
		const finalFormData = {
			...formData,
			step: "complete",
			completedStep: STEPS[currentStep].id,
			themeColors: JSON.stringify(themeColors),
			heroImage: heroImageUrl,
			logoUrl: logoUrl,
		};

		submit(finalFormData, { method: "post" });
	};

	const goToPreviousStep = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	return (
		<div className="container mx-auto py-10 px-4">
			<div className="max-w-3xl mx-auto">
				<h1 className="text-3xl font-bold text-center mb-8">
					Let's Get Started
				</h1>

				{/* Progress Steps */}
				<div className="mb-8">
					<div className="flex items-center justify-center mb-4">
						{STEPS.map((step, index) => (
							<div key={step.id} className="flex items-center">
								<div
									className={`flex items-center justify-center w-10 h-10 rounded-full ${
										currentStep >= index
											? "bg-blue-600 text-white"
											: "bg-gray-200 text-gray-500"
									}`}
								>
									{step.icon}
								</div>
								{index < STEPS.length - 1 && (
									<div
										className={`w-12 h-1 mx-1 ${
											currentStep > index ? "bg-blue-600" : "bg-gray-200"
										}`}
									/>
								)}
							</div>
						))}
					</div>
					<h2 className="text-xl font-semibold text-center">
						{STEPS[currentStep].title}
					</h2>
				</div>

				{/* Authentication Step */}
				{currentStep === 0 && (
					<Card className="w-full mb-6">
						<CardHeader>
							<CardTitle>Sign In or Create an Account</CardTitle>
							<CardDescription>
								Before setting up your church, you'll need to have an account.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Tabs defaultValue="signin" className="w-full">
								<TabsList className="grid w-full grid-cols-2">
									<TabsTrigger value="signin">Sign In</TabsTrigger>
									<TabsTrigger value="signup">Create Account</TabsTrigger>
								</TabsList>
								<SignedOut>
									<TabsContent value="signin" className="mt-4">
										<SignIn redirectUrl="/getting-started?step=church-info" />
									</TabsContent>
									<TabsContent value="signup" className="mt-4">
										<SignUp redirectUrl="/getting-started?step=church-info" />
									</TabsContent>
								</SignedOut>
							</Tabs>
						</CardContent>
					</Card>
				)}

				{currentStep > 0 && (
					<Card className="w-full">
						<CardHeader>
							<CardTitle>{STEPS[currentStep].title}</CardTitle>
							<CardDescription>
								{currentStep === 1 && "Tell us about your church"}
								{currentStep === 2 && "Where is your church located?"}
								{currentStep === 3 && "Let's customize your branding"}
								{currentStep === 4 && "Set up your landing page"}
								{currentStep === 5 && "You're all set!"}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Form method="post" className="space-y-6">
								{/* Step 1: Church Information */}
								{currentStep === 1 && (
									<div className="space-y-4">
										<div className="space-y-2">
											<Label htmlFor="name">Church Name</Label>
											<Input
												id="name"
												name="name"
												value={formData.name || ""}
												onChange={handleFormChange}
												required
											/>
										</div>

										<div className="space-y-2">
											<Label htmlFor="contactPhone">Phone Number</Label>
											<Input
												id="contactPhone"
												name="contactPhone"
												type="tel"
												value={formData.contactPhone || ""}
												onChange={handleFormChange}
											/>
										</div>

										<div className="space-y-2">
											<Label htmlFor="mainChurchWebsite">
												Church Website (if any)
											</Label>
											<Input
												id="mainChurchWebsite"
												name="mainChurchWebsite"
												placeholder="https://"
												value={formData.mainChurchWebsite || ""}
												onChange={handleFormChange}
											/>
										</div>

										<div className="space-y-2">
											<Label htmlFor="aboutContent">Brief Description</Label>
											<Textarea
												id="aboutContent"
												name="aboutContent"
												rows={3}
												placeholder="Tell us a bit about your church"
												value={formData.aboutContent || ""}
												onChange={handleFormChange}
											/>
										</div>
									</div>
								)}

								{/* Step 2: Location */}
								{currentStep === 2 && (
									<div className="space-y-4">
										<div className="space-y-2">
											<Label htmlFor="street">Street Address</Label>
											<Input
												id="street"
												name="street"
												value={formData.street || ""}
												onChange={handleFormChange}
												required
											/>
										</div>

										<div className="space-y-2">
											<Label htmlFor="city">City</Label>
											<Input
												id="city"
												name="city"
												value={formData.city || ""}
												onChange={handleFormChange}
												required
											/>
										</div>

										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="state">State</Label>
												<Input
													id="state"
													name="state"
													value={formData.state || ""}
													onChange={handleFormChange}
													required
												/>
											</div>

											<div className="space-y-2">
												<Label htmlFor="zip">Zip Code</Label>
												<Input
													id="zip"
													name="zip"
													value={formData.zip || ""}
													onChange={handleFormChange}
													required
												/>
											</div>
										</div>
									</div>
								)}

								{/* Step 3: Branding */}
								{currentStep === 3 && (
									<div className="space-y-6">
										<div className="space-y-4">
											<h3 className="text-lg font-medium">Church Logo</h3>
											<p className="text-sm text-muted-foreground">
												Upload your church logo to display on your landing page.
											</p>

											{logoUrl && (
												<div className="relative w-40 h-40 rounded-lg overflow-hidden mb-2 bg-gray-100 flex items-center justify-center p-2">
													<img
														src={logoUrl}
														alt="Church Logo"
														className="max-w-full max-h-full object-contain"
													/>
												</div>
											)}

											<UploadButton
												endpoint="imageUploader"
												onClientUploadComplete={(res) => {
													if (res?.[0]) {
														setLogoUrl(res[0].ufsUrl);
														toast.success("Logo uploaded successfully");
													}
												}}
												onUploadError={(error: Error) => {
													toast.error(`Upload failed: ${error.message}`);
												}}
											/>
											<input type="hidden" name="logoUrl" value={logoUrl} />
										</div>

										<div className="space-y-4">
											<h3 className="text-lg font-medium">Theme Colors</h3>
											<p className="text-sm text-muted-foreground">
												Choose colors that reflect your church's identity.
											</p>

											<div className="space-y-3">
												<ColorPicker
													label="Primary Color"
													value={themeColors.primary}
													onChange={(value) =>
														setThemeColors((prev) => ({
															...prev,
															primary: value,
														}))
													}
												/>
												<ColorPicker
													label="Secondary Color"
													value={themeColors.secondary}
													onChange={(value) =>
														setThemeColors((prev) => ({
															...prev,
															secondary: value,
														}))
													}
												/>
												<ColorPicker
													label="Accent Color"
													value={themeColors.accent}
													onChange={(value) =>
														setThemeColors((prev) => ({
															...prev,
															accent: value,
														}))
													}
												/>
											</div>

											<div className="mt-4 p-3 rounded-lg border bg-muted/30">
												<h4 className="text-sm font-medium mb-2">Preview</h4>
												<div className="grid grid-cols-3 gap-2">
													<div className="space-y-1 text-center">
														<div
															className="h-8 rounded-md shadow-sm"
															style={{ backgroundColor: themeColors.primary }}
															title="Primary Color"
														/>
														<span className="text-xs text-muted-foreground">
															Primary
														</span>
													</div>
													<div className="space-y-1 text-center">
														<div
															className="h-8 rounded-md shadow-sm"
															style={{ backgroundColor: themeColors.secondary }}
															title="Secondary Color"
														/>
														<span className="text-xs text-muted-foreground">
															Secondary
														</span>
													</div>
													<div className="space-y-1 text-center">
														<div
															className="h-8 rounded-md shadow-sm"
															style={{ backgroundColor: themeColors.accent }}
															title="Accent Color"
														/>
														<span className="text-xs text-muted-foreground">
															Accent
														</span>
													</div>
												</div>
											</div>
										</div>

										<input
											type="hidden"
											name="themeColors"
											value={JSON.stringify(themeColors)}
										/>
									</div>
								)}

								{/* Step 4: Landing Page */}
								{currentStep === 4 && (
									<div className="space-y-6">
										<div className="space-y-4">
											<div className="space-y-2">
												<Label htmlFor="heroHeadline">Hero Headline</Label>
												<Input
													id="heroHeadline"
													name="heroHeadline"
													placeholder="Welcome to Our Church"
													value={formData.heroHeadline || ""}
													onChange={handleFormChange}
												/>
											</div>

											<div className="space-y-2">
												<Label htmlFor="heroSubheadline">
													Hero Subheadline
												</Label>
												<Input
													id="heroSubheadline"
													name="heroSubheadline"
													placeholder="A place to grow in faith together"
													value={formData.heroSubheadline || ""}
													onChange={handleFormChange}
												/>
											</div>

											<div className="space-y-2">
												<Label htmlFor="aboutTitle">About Section Title</Label>
												<Input
													id="aboutTitle"
													name="aboutTitle"
													placeholder="About Our Church"
													value={formData.aboutTitle || ""}
													onChange={handleFormChange}
												/>
											</div>

											<div className="space-y-2">
												<Label htmlFor="footerContent">Footer Message</Label>
												<Textarea
													id="footerContent"
													name="footerContent"
													rows={2}
													placeholder="© 2023 Your Church. All rights reserved."
													value={formData.footerContent || ""}
													onChange={handleFormChange}
												/>
											</div>

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
															setHeroImageUrl(res[0].ufsUrl);
															toast.success("Image uploaded successfully");
														}
													}}
													onUploadError={(error: Error) => {
														toast.error(`Upload failed: ${error.message}`);
													}}
												/>
												<input
													type="hidden"
													name="heroImage"
													value={heroImageUrl}
												/>
											</div>
										</div>
									</div>
								)}

								{/* Step 5: Complete */}
								{currentStep === 5 && (
									<div className="text-center py-6">
										<div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-4">
											<Check className="h-10 w-10 text-green-600" />
										</div>
										<h3 className="text-xl font-medium text-gray-900 mb-2">
											Setup Complete!
										</h3>
										<p className="text-gray-500 mb-6">
											You've successfully set up your church profile and landing
											page. Click the button below to access your church
											dashboard.
										</p>
										<input type="hidden" name="step" value="complete" />
									</div>
								)}

								{/* Navigation buttons */}
								<div className="flex justify-between items-center pt-4">
									{currentStep > 0 && currentStep < STEPS.length - 1 && (
										<Button
											type="button"
											variant="outline"
											onClick={goToPreviousStep}
											className="flex items-center space-x-1"
										>
											<ChevronLeft className="h-4 w-4" />
											<span>Back</span>
										</Button>
									)}

									{currentStep === 0 && <div />}

									{currentStep < STEPS.length - 1 ? (
										<Button
											type="button"
											onClick={goToNextStep}
											className="flex items-center space-x-1 ml-auto"
										>
											<span>Next</span>
											<ChevronRight className="h-4 w-4" />
										</Button>
									) : (
										<Button
											type="button"
											onClick={handleComplete}
											className="ml-auto"
										>
											Complete Setup
										</Button>
									)}
								</div>
							</Form>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
