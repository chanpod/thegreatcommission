import { useOutletContext } from "react-router";
import Hero from "~/components/Hero";
import ServiceTimes from "~/components/ServiceTimes";
import Events from "~/components/Events";
import About from "~/components/About";
import type { AboutProps } from "~/components/About";
import CustomSection from "~/components/CustomSection";
import type { CustomSectionProps } from "~/components/CustomSection";
import { ContactFormDialog } from "~/components/ContactFormDialog";
import type {
	churchOrganization,
	events,
	landingPageConfig,
} from "server/db/schema";

type LandingPageContext = {
	organization: typeof churchOrganization.$inferSelect;
	config: typeof landingPageConfig.$inferSelect | null;
	serviceTimes: Array<typeof events.$inferSelect>;
	upcomingEvents: Array<typeof events.$inferSelect>;
	isLive: boolean;
};

// Helper function to safely parse JSON
function safeJsonParse<T>(
	jsonString: string | null | undefined,
	defaultValue: T,
): T {
	if (!jsonString) return defaultValue;
	try {
		return JSON.parse(jsonString) as T;
	} catch (error) {
		console.error(`Error parsing JSON: ${error}`, jsonString);
		return defaultValue;
	}
}

export default function LandingPageContent() {
	const { organization, config, serviceTimes, upcomingEvents, isLive } =
		useOutletContext<LandingPageContext>();

	console.log("LandingPageContent received config from context:", config);

	// Parse customSections from config if they exist
	const customSections: CustomSectionProps[] = safeJsonParse<
		CustomSectionProps[]
	>(config?.customSections, []);

	// Parse aboutSection from config if it exists
	let aboutSection: AboutProps;

	if (config?.aboutSection) {
		// Try to use the complete aboutSection JSON if available
		aboutSection = safeJsonParse<AboutProps>(config.aboutSection, {
			title: config?.aboutTitle || "About Us",
			content: config?.aboutContent || organization.description,
			backgroundGradient: "linear-gradient(135deg, #00a99d 0%, #89d7bb 100%)",
			buttons: [],
			subtitle: config?.aboutSubtitle || "Our Mission",
			logoImage: config?.aboutLogoImage || "",
		});
	} else {
		// Fallback to individual fields
		aboutSection = {
			title: config?.aboutTitle || "About Us",
			content: config?.aboutContent || organization.description,
			backgroundGradient: "linear-gradient(135deg, #00a99d 0%, #89d7bb 100%)",
			buttons: safeJsonParse(config?.aboutButtons, []),
			subtitle: config?.aboutSubtitle || "Our Mission",
			logoImage: config?.aboutLogoImage || "",
		};
	}

	// Hero configuration
	const heroConfig = {
		imageUrl: config?.heroImage || organization.churchBannerUrl,
		headline: config?.heroHeadline || `Welcome to ${organization.name}`,
		subheadline:
			config?.heroSubheadline || "A place of worship, fellowship, and growth",
		imagePosition: config?.heroImagePosition || "center",
		imageObjectFit: config?.heroImageObjectFit || "cover",
		overlayOpacity: config?.heroOverlayOpacity
			? Number(config.heroOverlayOpacity)
			: 0.5,
		height: config?.heroHeight || "500px",
	};

	return (
		<>
			<Hero
				imageUrl={heroConfig.imageUrl}
				headline={heroConfig.headline}
				subheadline={heroConfig.subheadline}
				imagePosition={
					heroConfig.imagePosition as
						| "center"
						| "top"
						| "bottom"
						| "left"
						| "right"
				}
				imageObjectFit={
					heroConfig.imageObjectFit as "cover" | "contain" | "fill"
				}
				overlayOpacity={Number(heroConfig.overlayOpacity)}
				height={heroConfig.height}
			/>
			<ServiceTimes
				services={serviceTimes}
				liveStreamUrl={organization.liveStreamUrl}
				isLive={isLive}
			/>

			{upcomingEvents.length > 0 && (
				<Events events={upcomingEvents} churchId={organization.id} />
			)}

			<About {...aboutSection} />

			{/* Contact Form Section */}
			{config?.contactFormEnabled && (
				<div className="py-12 bg-gray-50 text-center">
					<div className="container mx-auto px-4">
						<h2 className="text-3xl font-bold mb-6">Get In Touch</h2>
						<p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
							Have questions or want to learn more about our church? We'd love
							to hear from you!
						</p>
						<ContactFormDialog
							buttonText="Contact Us"
							churchId={organization.id}
							buttonSize="lg"
						/>
					</div>
				</div>
			)}

			{/* Render custom sections if available */}
			{customSections.map((section) => (
				<CustomSection key={section.id} {...section} />
			))}
		</>
	);
}
