import type {
	churchOrganization,
	events,
	landingPageConfig,
} from "server/db/schema";
import Hero from "~/components/Hero";
import Header from "~/components/Header";
import ServiceTimes from "~/components/ServiceTimes";
import Events from "~/components/Events";
import About from "~/components/About";
import type { AboutProps } from "~/components/About";
import CustomSection from "~/components/CustomSection";
import type { CustomSectionProps } from "~/components/CustomSection";
import Footer from "~/components/Footer";
import { Video } from "lucide-react";

interface LandingPageProps {
	organization: typeof churchOrganization.$inferSelect;
	config: typeof landingPageConfig.$inferSelect | null;
	serviceTimes: Array<typeof events.$inferSelect>;
	upcomingEvents: Array<typeof events.$inferSelect>;
	isLive: boolean;
}

interface ServiceTimesProps {
	services: Array<typeof events.$inferSelect>;
}

interface EventsProps {
	events: Array<typeof events.$inferSelect>;
}

interface FooterProps {
	organization: typeof churchOrganization.$inferSelect;
	contactInfo: {
		email: string;
		phone: string;
		address: string;
	};
	content?: string;
	socialLinks?: Record<string, string> | null;
}

function LiveStream({ url }: { url: string }) {
	return (
		<div className="aspect-video w-full rounded-lg overflow-hidden shadow-lg">
			<iframe
				title="Live Stream"
				src={url}
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				allowFullScreen
				className="w-full h-full"
			/>
		</div>
	);
}

function ThemeProvider({
	organization,
	children,
}: {
	organization: typeof churchOrganization.$inferSelect;
	children: React.ReactNode;
}) {
	const themeColors = JSON.parse(
		organization.themeColors ||
			'{"primary":"#3b82f6","secondary":"#1e293b","accent":"#8b5cf6"}',
	);

	return (
		<div
			className="landing-page"
			style={
				{
					"--theme-primary": themeColors.primary,
					"--theme-secondary": themeColors.secondary,
					"--theme-accent": themeColors.accent,
				} as React.CSSProperties
			}
		>
			{children}
		</div>
	);
}

const LandingPage = ({
	organization,
	config,
	serviceTimes,
	upcomingEvents,
	isLive,
}: LandingPageProps) => {
	// Parse customSections from config if they exist
	const customSections: CustomSectionProps[] = config?.customSections
		? JSON.parse(config.customSections)
		: [];

	// Parse aboutSection from config if it exists
	const aboutSection: AboutProps = config?.aboutSection
		? JSON.parse(config.aboutSection)
		: {
				title: config?.aboutTitle || "About Us",
				content: config?.aboutContent || organization.description,
				backgroundGradient: "linear-gradient(135deg, #00a99d 0%, #89d7bb 100%)",
				buttons: [
					...(config?.aboutButtons ? JSON.parse(config.aboutButtons) : []),
				],
				subtitle: config?.aboutSubtitle || "Our Mission",
				logoImage: config?.aboutLogoImage || "",
			};

	// Hero configuration
	const heroConfig = {
		imageUrl: config?.heroImage || organization.churchBannerUrl,
		headline: config?.heroHeadline || `Welcome to ${organization.name}`,
		subheadline:
			config?.heroSubheadline || "A place of worship, fellowship, and growth",
		imagePosition: config?.heroImagePosition || "center",
		imageObjectFit: config?.heroImageObjectFit || "cover",
		overlayOpacity: config?.heroOverlayOpacity || 0.5,
		height: config?.heroHeight || "500px",
	};

	return (
		<ThemeProvider organization={organization}>
			<div className="min-h-screen flex flex-col">
				<Header churchName={organization.name} logoUrl={organization.logoUrl} />
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

				{/* Render custom sections if available */}
				{customSections.map((section) => (
					<CustomSection key={section.id} {...section} />
				))}

				<Footer
					organization={organization}
					contactInfo={{
						email: config?.contactEmail || organization.email,
						phone: config?.contactPhone || organization.phone,
						address:
							config?.contactAddress ||
							`${organization.street}, ${organization.city}, ${organization.state} ${organization.zip}`,
					}}
					content={config?.footerContent}
					socialLinks={
						config?.socialLinks ? JSON.parse(config.socialLinks) : null
					}
				/>
			</div>
		</ThemeProvider>
	);
};

export default LandingPage;
