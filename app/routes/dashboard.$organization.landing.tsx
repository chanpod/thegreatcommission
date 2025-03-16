import { useParams, useLoaderData } from "react-router";
import { useState, useEffect } from "react";
import { LandingPageSettings } from "~/components/LandingPageSettings";
import { db } from "@/server/db/dbConnection";
import { landingPageConfig as landingPageConfigTable } from "server/db/schema";
import { eq } from "drizzle-orm";

export default function LandingPageSettingsPage() {
	const params = useParams();
	const organizationId = params.organization;
	const [config, setConfig] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchConfig = async () => {
			if (!organizationId) return;

			try {
				// Get the landing page config for this organization
				const configResult = await db
					.select()
					.from(landingPageConfigTable)
					.where(
						eq(landingPageConfigTable.churchOrganizationId, organizationId),
					);

				setConfig(configResult.length > 0 ? configResult[0] : null);
			} catch (error) {
				console.error("Error fetching landing page config:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchConfig();
	}, [organizationId]);

	const handleSubmit = async (formData) => {
		if (!organizationId) return;

		// Collect form data
		const configData = {
			churchName: formData.get("churchName"),
			tagline: formData.get("tagline"),
			logoUrl: formData.get("logoUrl"),
			backgroundImageUrl: formData.get("backgroundImageUrl"),
			backgroundColor: formData.get("backgroundColor"),
			textColor: formData.get("textColor"),
			buttonColor: formData.get("buttonColor"),
			buttonTextColor: formData.get("buttonTextColor"),
			serviceDay: formData.get("serviceDay"),
			serviceTime: formData.get("serviceTime"),
			address: formData.get("address"),
			welcomeMessage: formData.get("welcomeMessage"),
			aboutText: formData.get("aboutText"),
			ctaButtonText: formData.get("ctaButtonText"),
			ctaButtonUrl: formData.get("ctaButtonUrl"),
			socialFacebook: formData.get("socialFacebook"),
			socialInstagram: formData.get("socialInstagram"),
			socialTwitter: formData.get("socialTwitter"),
			socialYoutube: formData.get("socialYoutube"),
			contactFormEnabled: formData.get("contactFormEnabled") === "true",
			contactTitle: formData.get("contactTitle"),
			contactDescription: formData.get("contactDescription"),
			contactButtonText: formData.get("contactButtonText"),
			contactBackgroundColor: formData.get("contactBackgroundColor"),
			contactTextColor: formData.get("contactTextColor"),
		};

		try {
			// First check if the organization already has a config
			const existingConfig = await db
				.select()
				.from(landingPageConfigTable)
				.where(eq(landingPageConfigTable.churchOrganizationId, organizationId));

			if (existingConfig.length > 0) {
				// Update the existing config
				await db
					.update(landingPageConfigTable)
					.set(configData)
					.where(
						eq(landingPageConfigTable.churchOrganizationId, organizationId),
					);
			} else {
				// Create a new config
				await db.insert(landingPageConfigTable).values({
					churchOrganizationId: organizationId,
					...configData,
				});
			}

			// Refresh config data
			const updatedConfig = await db
				.select()
				.from(landingPageConfigTable)
				.where(eq(landingPageConfigTable.churchOrganizationId, organizationId));

			setConfig(updatedConfig.length > 0 ? updatedConfig[0] : null);

			return { success: true };
		} catch (error) {
			console.error("Error updating landing page config:", error);
			return { success: false, error };
		}
	};

	if (isLoading) {
		return <div className="p-6">Loading...</div>;
	}

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-6">Website Settings</h1>
			<div className="bg-white rounded-lg shadow p-6">
				<LandingPageSettings
					landingPageConfig={config}
					churchId={organizationId}
					onSubmit={handleSubmit}
				/>
			</div>
		</div>
	);
}
