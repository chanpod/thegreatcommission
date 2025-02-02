import Hero from "~/components/Hero";
import Header from "~/components/Header";

import ServiceTimes from "~/components/ServiceTimes";
import Events from "~/components/Events";
import About from "~/components/About";
import Footer from "~/components/Footer";

const LandingPage = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <Header churchName="Grace Community Church" />
            <Hero
                imageUrl="/placeholder.svg?height=400&width=1200"
                headline="Welcome to Grace Community Church"
                subheadline="A place of worship, fellowship, and growth"
            />
            <ServiceTimes />
            <Events />
            <About />
            <Footer />
        </div>
    );
};

export default LandingPage;