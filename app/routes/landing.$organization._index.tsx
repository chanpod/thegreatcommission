import { useOutletContext } from "react-router";
import { useEffect } from "react";
import Hero from "~/components/Hero";
import ServiceTimes from "~/components/ServiceTimes";
import Events from "~/components/Events";
import About from "~/components/About";
import type { AboutProps } from "~/components/About";
import CustomSection from "~/components/CustomSection";
import type { CustomSectionProps } from "~/components/CustomSection";
import { ContactFormDialog } from "~/components/ContactFormDialog";
import AnimatedElement, { AnimatedGroup } from "~/components/AnimatedElement";
import { motion } from "framer-motion";
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

	// Parse customSections from config if they exist
	const customSections: CustomSectionProps[] = safeJsonParse<
		CustomSectionProps[]
	>(config?.customSections, []);

	// Get theme colors from organization
	const themeColors = safeJsonParse(organization.themeColors, {
		primary: "#3b82f6",
		secondary: "#1e293b",
		accent: "#8b5cf6",
	});

	// Create a clean gradient string with the actual theme colors
	const aboutGradient = `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.accent} 50%, ${themeColors.secondary} 100%)`;

	// Parse aboutSection from config if it exists
	let aboutSection: AboutProps;

	if (config?.aboutSection) {
		// Try to use the complete aboutSection JSON if available
		aboutSection = safeJsonParse<AboutProps>(config.aboutSection, {
			title: config?.aboutTitle || "About Us",
			content: config?.aboutContent || organization.description,
			backgroundGradient: aboutGradient,
			buttons: [],
			subtitle: config?.aboutSubtitle || "Our Mission",
			logoImage: config?.aboutLogoImage || "",
			animateGradient: true,
		});
	} else {
		// Fallback to individual fields
		aboutSection = {
			title: config?.aboutTitle || "About Us",
			content: config?.aboutContent || organization.description,
			backgroundGradient: aboutGradient,
			buttons: safeJsonParse(config?.aboutButtons, []),
			subtitle: config?.aboutSubtitle || "Our Mission",
			logoImage: config?.aboutLogoImage || "",
			animateGradient: true,
		};
	}

	// Override the backgroundGradient with our actual theme colors gradient
	aboutSection.backgroundGradient = aboutGradient;

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

	// Enhance custom sections with alternating theme colors
	const enhancedCustomSections = customSections.map((section, index) => ({
		...section,
		useThemeColors: index % 2 === 0, // Alternate sections with theme colors
		decorativeElements: true,
	}));

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
				<div className="py-12 bg-gray-50 text-center relative overflow-hidden contact-section">
					{/* Enhanced decorative SVG elements */}
					<motion.div
						className="absolute top-0 right-0 w-64 h-64 opacity-5 text-gray-400"
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 0.05, scale: 1 }}
						transition={{ duration: 1.5 }}
					>
						<svg
							className="w-full h-full float-animation"
							viewBox="0 0 200 200"
							xmlns="http://www.w3.org/2000/svg"
							style={{ animationDuration: "15s" }}
							aria-hidden="true"
						>
							<path
								fill="currentColor"
								d="M42.8,-65.2C54.9,-56.3,63.7,-43.2,70.1,-28.7C76.4,-14.2,80.3,1.8,76.7,16.2C73.1,30.6,62,43.4,48.8,53.5C35.6,63.6,20.3,71,3.1,68.1C-14.1,65.2,-33.2,52,-45.9,37.4C-58.6,22.8,-64.9,6.8,-64.2,-9.1C-63.5,-25,-55.8,-40.8,-44.1,-50.1C-32.4,-59.4,-16.2,-62.2,-0.2,-61.9C15.8,-61.7,30.7,-74.1,42.8,-65.2Z"
								transform="translate(100 100)"
							/>
						</svg>
					</motion.div>
					<motion.div
						className="absolute bottom-0 left-0 w-64 h-64 opacity-5 text-gray-400"
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 0.05, scale: 1 }}
						transition={{ duration: 1.5, delay: 0.3 }}
					>
						<svg
							className="w-full h-full float-animation"
							viewBox="0 0 200 200"
							xmlns="http://www.w3.org/2000/svg"
							style={{ animationDuration: "20s", animationDelay: "2s" }}
							aria-hidden="true"
						>
							<path
								fill="currentColor"
								d="M39.9,-51.6C50.4,-42.8,56.9,-28.9,59.5,-14.7C62.1,-0.5,60.8,13.9,54.4,25.4C48,36.9,36.5,45.5,23.4,52.2C10.3,58.9,-4.4,63.7,-17.4,60.8C-30.4,57.9,-41.7,47.3,-49.4,34.9C-57.1,22.5,-61.2,8.3,-60.2,-5.6C-59.2,-19.5,-53.1,-33.1,-42.9,-42C-32.7,-50.9,-18.4,-55.1,-2.7,-52.1C12.9,-49.1,29.4,-60.4,39.9,-51.6Z"
								transform="translate(100 100)"
							/>
						</svg>
					</motion.div>

					{/* Animated background pattern */}
					<motion.div
						className="absolute inset-0 pattern-grid opacity-10"
						initial={{ opacity: 0 }}
						animate={{ opacity: 0.1 }}
						transition={{ duration: 1 }}
					/>

					{/* Animated particles */}
					<div className="absolute inset-0 pointer-events-none">
						{[...Array(6)].map((_, i) => (
							<motion.div
								key={`particle-${i}`}
								className="absolute rounded-full bg-gray-400 opacity-20 float-animation"
								initial={{ opacity: 0 }}
								animate={{ opacity: 0.2 }}
								transition={{
									duration: 1,
									delay: i * 0.1,
								}}
								style={{
									width: `${Math.random() * 8 + 4}px`,
									height: `${Math.random() * 8 + 4}px`,
									left: `${Math.random() * 100}%`,
									top: `${Math.random() * 100}%`,
									animationDuration: `${Math.random() * 10 + 8}s`,
									animationDelay: `${Math.random() * 5}s`,
								}}
							/>
						))}
					</div>

					<div className="container mx-auto px-4 relative z-10">
						<AnimatedElement variant="fade-down">
							<h2 className="text-3xl font-bold mb-6 text-gray-800">
								Get In Touch
							</h2>
						</AnimatedElement>
						<AnimatedElement variant="fade-up" delay={0.1}>
							<p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
								Have questions or want to learn more about our church? We'd love
								to hear from you!
							</p>
						</AnimatedElement>
						<AnimatedElement variant="zoom-in" delay={0.2}>
							<ContactFormDialog
								buttonText="Contact Us"
								churchId={organization.id}
								buttonSize="lg"
							/>
						</AnimatedElement>
					</div>
				</div>
			)}

			{/* Render custom sections if available */}
			{enhancedCustomSections.map((section) => (
				<CustomSection key={section.id} {...section} />
			))}
		</>
	);
}
