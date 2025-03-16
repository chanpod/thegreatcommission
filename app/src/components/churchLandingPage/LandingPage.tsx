import type {
	churchOrganization,
	events,
	landingPageConfig,
} from "server/db/schema";
import Header from "~/components/Header";
import Footer from "~/components/Footer";
import { Outlet } from "react-router";

interface LandingPageProps {
	organization: typeof churchOrganization.$inferSelect;
	config: typeof landingPageConfig.$inferSelect | null;
	serviceTimes: Array<typeof events.$inferSelect>;
	upcomingEvents: Array<typeof events.$inferSelect>;
	isLive: boolean;
	canViewForms?: boolean;
	children?: React.ReactNode;
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

export function ThemeProvider({
	organization,
	children,
}: {
	organization: typeof churchOrganization.$inferSelect;
	children: React.ReactNode;
}) {
	const themeColors = safeJsonParse(organization.themeColors, {
		primary: "#3b82f6",
		secondary: "#1e293b",
		accent: "#8b5cf6",
	});

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
	canViewForms = false,
	children,
}: LandingPageProps) => {
	return (
		<ThemeProvider organization={organization}>
			<div className="min-h-screen flex flex-col">
				<Header
					churchName={organization.name}
					logoUrl={organization.logoUrl}
					organizationId={organization.id}
					canViewForms={canViewForms}
				/>

				{/* Render children if provided, otherwise render the Outlet */}
				{children || (
					<Outlet
						context={{
							organization,
							config,
							serviceTimes,
							upcomingEvents,
							isLive,
						}}
					/>
				)}

				<Footer
					organization={organization}
					contactInfo={{
						email: organization.contactEmail || "",
						phone: organization.contactPhone || "",
						address: organization.address || "",
					}}
					content={config?.footerContent || undefined}
					socialLinks={
						config?.socialLinks
							? safeJsonParse(config.socialLinks, {})
							: undefined
					}
				/>
			</div>
		</ThemeProvider>
	);
};

export default LandingPage;
