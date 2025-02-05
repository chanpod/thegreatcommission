import type { churchOrganization, events, landingPageConfig } from "server/db/schema";
import Hero from "~/components/Hero";
import Header from "~/components/Header";
import ServiceTimes from "~/components/ServiceTimes";
import Events from "~/components/Events";
import About from "~/components/About";
import Footer from "~/components/Footer";

interface LandingPageProps {
    organization: typeof churchOrganization.$inferSelect;
    config: typeof landingPageConfig.$inferSelect | null;
    serviceTimes: Array<typeof events.$inferSelect>;
    upcomingEvents: Array<typeof events.$inferSelect>;
}

interface ServiceTimesProps {
    services: Array<typeof events.$inferSelect>;
}

interface EventsProps {
    events: Array<typeof events.$inferSelect>;
}

interface AboutProps {
    title: string;
    content: string;
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

const LandingPage = ({ organization, config, serviceTimes, upcomingEvents }: LandingPageProps) => {
    return (
        <div className="min-h-screen flex flex-col">
            <Header churchName={organization.name} />
            <Hero
                imageUrl={config?.heroImage || organization.churchBannerUrl || "/placeholder.svg?height=400&width=1200"}
                headline={config?.heroHeadline || `Welcome to ${organization.name}`}
                subheadline={config?.heroSubheadline || 'A place of worship, fellowship, and growth'}
            />
            <ServiceTimes services={serviceTimes} />
            <Events events={upcomingEvents} />
            <About
                title={config?.aboutTitle || 'About Us'}
                content={config?.aboutContent || organization.description}
            />
            <Footer
                organization={organization}
                contactInfo={{
                    email: config?.contactEmail || organization.email,
                    phone: config?.contactPhone || organization.phone,
                    address: config?.contactAddress || `${organization.street}, ${organization.city}, ${organization.state} ${organization.zip}`
                }}
                content={config?.footerContent}
                socialLinks={config?.socialLinks ? JSON.parse(config.socialLinks) : null}
            />
        </div>
    );
};

export default LandingPage;