import { useState } from "react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "~/components/ui/accordion";

import { Switch } from "~/components/ui/switch";
import { useFetcher } from "react-router";

interface LandingPageSettingsProps {
	landingPageConfig: any;
	churchId: string;
}

export function LandingPageSettings({
	landingPageConfig,
	churchId,
}: LandingPageSettingsProps) {
	const [activeTab, setActiveTab] = useState("general");
	const updateFetcher = useFetcher();
	const isSubmitting = updateFetcher.state === "submitting";

	const initialConfig = {
		churchName: landingPageConfig?.churchName || "",
		tagline: landingPageConfig?.tagline || "",
		logoUrl: landingPageConfig?.logoUrl || "",
		backgroundImageUrl: landingPageConfig?.backgroundImageUrl || "",
		backgroundColor: landingPageConfig?.backgroundColor || "#FFFFFF",
		textColor: landingPageConfig?.textColor || "#000000",
		buttonColor: landingPageConfig?.buttonColor || "#2563EB",
		buttonTextColor: landingPageConfig?.buttonTextColor || "#FFFFFF",
		serviceDay: landingPageConfig?.serviceDay || "Sunday",
		serviceTime: landingPageConfig?.serviceTime || "10:00 AM",
		address: landingPageConfig?.address || "",
		welcomeMessage: landingPageConfig?.welcomeMessage || "",
		aboutText: landingPageConfig?.aboutText || "",
		ctaButtonText: landingPageConfig?.ctaButtonText || "Join Us",
		ctaButtonUrl: landingPageConfig?.ctaButtonUrl || "",
		socialFacebook: landingPageConfig?.socialFacebook || "",
		socialInstagram: landingPageConfig?.socialInstagram || "",
		socialTwitter: landingPageConfig?.socialTwitter || "",
		socialYoutube: landingPageConfig?.socialYoutube || "",
		contactFormEnabled: landingPageConfig?.contactFormEnabled || false,
		contactTitle: landingPageConfig?.contactTitle || "Contact Us",
		contactDescription:
			landingPageConfig?.contactDescription ||
			"Have questions? We'd love to hear from you!",
		contactButtonText: landingPageConfig?.contactButtonText || "Send Message",
		contactBackgroundColor:
			landingPageConfig?.contactBackgroundColor || "#F3F4F6",
		contactTextColor: landingPageConfig?.contactTextColor || "#000000",
	};

	const serviceDays = [
		"Sunday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
	];

	return (
		<div className="w-full">
			<updateFetcher.Form
				method="post"
				action={`/dashboard/${churchId}/landing`}
				className="space-y-8"
			>
				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList className="grid w-full grid-cols-4">
						<TabsTrigger value="general">General</TabsTrigger>
						<TabsTrigger value="appearance">Appearance</TabsTrigger>
						<TabsTrigger value="content">Content</TabsTrigger>
						<TabsTrigger value="contact">Contact</TabsTrigger>
					</TabsList>

					{/* General Tab */}
					<TabsContent value="general" className="space-y-6">
						<div className="space-y-4">
							<div>
								<Label htmlFor="churchName">Church Name</Label>
								<Input
									id="churchName"
									name="churchName"
									defaultValue={initialConfig.churchName}
								/>
							</div>

							<div>
								<Label htmlFor="tagline">Tagline</Label>
								<Input
									id="tagline"
									name="tagline"
									defaultValue={initialConfig.tagline}
								/>
							</div>

							<div>
								<Label htmlFor="address">Address</Label>
								<Textarea
									id="address"
									name="address"
									defaultValue={initialConfig.address}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="serviceDay">Service Day</Label>
									<Select
										name="serviceDay"
										defaultValue={initialConfig.serviceDay}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select day" />
										</SelectTrigger>
										<SelectContent>
											{serviceDays.map((day) => (
												<SelectItem key={day} value={day}>
													{day}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div>
									<Label htmlFor="serviceTime">Service Time</Label>
									<Input
										id="serviceTime"
										name="serviceTime"
										defaultValue={initialConfig.serviceTime}
									/>
								</div>
							</div>

							<Accordion type="single" collapsible className="w-full">
								<AccordionItem value="social">
									<AccordionTrigger>Social Media Links</AccordionTrigger>
									<AccordionContent>
										<div className="space-y-4 pt-4">
											<div>
												<Label htmlFor="socialFacebook">Facebook</Label>
												<Input
													id="socialFacebook"
													name="socialFacebook"
													defaultValue={initialConfig.socialFacebook}
													placeholder="https://facebook.com/yourchurch"
												/>
											</div>
											<div>
												<Label htmlFor="socialInstagram">Instagram</Label>
												<Input
													id="socialInstagram"
													name="socialInstagram"
													defaultValue={initialConfig.socialInstagram}
													placeholder="https://instagram.com/yourchurch"
												/>
											</div>
											<div>
												<Label htmlFor="socialTwitter">Twitter</Label>
												<Input
													id="socialTwitter"
													name="socialTwitter"
													defaultValue={initialConfig.socialTwitter}
													placeholder="https://twitter.com/yourchurch"
												/>
											</div>
											<div>
												<Label htmlFor="socialYoutube">YouTube</Label>
												<Input
													id="socialYoutube"
													name="socialYoutube"
													defaultValue={initialConfig.socialYoutube}
													placeholder="https://youtube.com/c/yourchurch"
												/>
											</div>
										</div>
									</AccordionContent>
								</AccordionItem>
							</Accordion>
						</div>
					</TabsContent>

					{/* Appearance Tab */}
					<TabsContent value="appearance" className="space-y-6">
						<div className="space-y-4">
							<div>
								<Label htmlFor="logoUrl">Logo URL</Label>
								<Input
									id="logoUrl"
									name="logoUrl"
									defaultValue={initialConfig.logoUrl}
									placeholder="https://example.com/logo.png"
								/>
							</div>

							<div>
								<Label htmlFor="backgroundImageUrl">Background Image URL</Label>
								<Input
									id="backgroundImageUrl"
									name="backgroundImageUrl"
									defaultValue={initialConfig.backgroundImageUrl}
									placeholder="https://example.com/background.jpg"
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="backgroundColor">Background Color</Label>
									<div className="flex">
										<Input
											id="backgroundColor"
											name="backgroundColor"
											type="color"
											defaultValue={initialConfig.backgroundColor}
											className="w-12 p-1 h-10"
										/>
										<Input
											type="text"
											value={initialConfig.backgroundColor}
											className="ml-2 flex-1"
											readOnly
										/>
									</div>
								</div>
								<div>
									<Label htmlFor="textColor">Text Color</Label>
									<div className="flex">
										<Input
											id="textColor"
											name="textColor"
											type="color"
											defaultValue={initialConfig.textColor}
											className="w-12 p-1 h-10"
										/>
										<Input
											type="text"
											value={initialConfig.textColor}
											className="ml-2 flex-1"
											readOnly
										/>
									</div>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="buttonColor">Button Color</Label>
									<div className="flex">
										<Input
											id="buttonColor"
											name="buttonColor"
											type="color"
											defaultValue={initialConfig.buttonColor}
											className="w-12 p-1 h-10"
										/>
										<Input
											type="text"
											value={initialConfig.buttonColor}
											className="ml-2 flex-1"
											readOnly
										/>
									</div>
								</div>
								<div>
									<Label htmlFor="buttonTextColor">Button Text Color</Label>
									<div className="flex">
										<Input
											id="buttonTextColor"
											name="buttonTextColor"
											type="color"
											defaultValue={initialConfig.buttonTextColor}
											className="w-12 p-1 h-10"
										/>
										<Input
											type="text"
											value={initialConfig.buttonTextColor}
											className="ml-2 flex-1"
											readOnly
										/>
									</div>
								</div>
							</div>
						</div>
					</TabsContent>

					{/* Content Tab */}
					<TabsContent value="content" className="space-y-6">
						<div className="space-y-4">
							<div>
								<Label htmlFor="welcomeMessage">Welcome Message</Label>
								<Input
									id="welcomeMessage"
									name="welcomeMessage"
									defaultValue={initialConfig.welcomeMessage}
								/>
							</div>

							<div>
								<Label htmlFor="aboutText">About Text</Label>
								<Textarea
									id="aboutText"
									name="aboutText"
									rows={5}
									defaultValue={initialConfig.aboutText}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="ctaButtonText">
										Call-to-Action Button Text
									</Label>
									<Input
										id="ctaButtonText"
										name="ctaButtonText"
										defaultValue={initialConfig.ctaButtonText}
									/>
								</div>
								<div>
									<Label htmlFor="ctaButtonUrl">Button Link URL</Label>
									<Input
										id="ctaButtonUrl"
										name="ctaButtonUrl"
										defaultValue={initialConfig.ctaButtonUrl}
										placeholder="https://example.com/join"
									/>
								</div>
							</div>
						</div>
					</TabsContent>

					{/* Contact Tab */}
					<TabsContent value="contact" className="space-y-6">
						<div className="space-y-4">
							<div className="flex items-center space-x-2">
								<Switch
									id="contactFormEnabled"
									name="contactFormEnabled"
									defaultChecked={initialConfig.contactFormEnabled}
								/>
								<Label htmlFor="contactFormEnabled">Enable Contact Form</Label>
							</div>

							<div>
								<Label htmlFor="contactTitle">Contact Section Title</Label>
								<Input
									id="contactTitle"
									name="contactTitle"
									defaultValue={initialConfig.contactTitle}
								/>
							</div>

							<div>
								<Label htmlFor="contactDescription">Contact Description</Label>
								<Textarea
									id="contactDescription"
									name="contactDescription"
									rows={3}
									defaultValue={initialConfig.contactDescription}
								/>
							</div>

							<div>
								<Label htmlFor="contactButtonText">Contact Button Text</Label>
								<Input
									id="contactButtonText"
									name="contactButtonText"
									defaultValue={initialConfig.contactButtonText}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="contactBackgroundColor">
										Background Color
									</Label>
									<div className="flex">
										<Input
											id="contactBackgroundColor"
											name="contactBackgroundColor"
											type="color"
											defaultValue={initialConfig.contactBackgroundColor}
											className="w-12 p-1 h-10"
										/>
										<Input
											type="text"
											value={initialConfig.contactBackgroundColor}
											className="ml-2 flex-1"
											readOnly
										/>
									</div>
								</div>
								<div>
									<Label htmlFor="contactTextColor">Text Color</Label>
									<div className="flex">
										<Input
											id="contactTextColor"
											name="contactTextColor"
											type="color"
											defaultValue={initialConfig.contactTextColor}
											className="w-12 p-1 h-10"
										/>
										<Input
											type="text"
											value={initialConfig.contactTextColor}
											className="ml-2 flex-1"
											readOnly
										/>
									</div>
								</div>
							</div>
						</div>
					</TabsContent>
				</Tabs>

				<Button type="submit" className="w-full" disabled={isSubmitting}>
					{isSubmitting ? "Saving..." : "Save Settings"}
				</Button>
			</updateFetcher.Form>
		</div>
	);
}
