

import { ArrowRight as ArrowTopRightOnSquareIcon } from "lucide-react";
import PlaceholderImageOne from "app/src/assets/images/placeholderImage1.jpg";
import PlaceholderImageTwo from "app/src/assets/images/placeholderImage2.jpg";
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useState } from "react";
import type { churchOrganization } from "server/db/schema";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Carousel, CarouselItem } from "~/components/ui/carousel";
import { convertAddressToLocation } from "../forms/createChurch/CreateChurchForm";
import OrgLocation from "./OrgLocation";

const OrgDescription = ({ org }: { org: typeof churchOrganization }) => {
    const [location, setLocation] = useState<typeof location | undefined>(undefined);
    useEffect(() => {
        convertAddress();
    }, []);

    async function convertAddress() {
        const location = await convertAddressToLocation(`${org?.street} ${org?.city}, ${org?.state} ${org?.zip}`);
        setLocation(location);
    }

    return (
        <>
            {/* <div className="h-56 sm:h-64 xl:h-80 2xl:h-96 overflow-hidden">
                <Carousel plugins={[
                    Autoplay({
                        delay: 2000,
                    }),
                ]}
                >
                    <CarouselItem>
                        <img src={PlaceholderImageOne} alt="..." />
                    </CarouselItem>
                    <CarouselItem>
                        <img src={PlaceholderImageTwo} alt="..." />
                    </CarouselItem>
                </Carousel>
            </div> */}
            <Card className="bg-white">
                <CardContent>
                    <CardHeader>
                        <h1 className="text-2xl text-gray-900">Description</h1>
                        <div className="text-base text-gray-700">{org?.description}</div>
                    </CardHeader>

                    <hr className="border-gray-200" />
                    <section className="flex flex-col space-y-3">
                        <div className="flex flex-col">
                            <div className="text-gray-500">Location</div>
                            <OrgLocation org={org} />
                        </div>
                        <div className="flex flex-col">
                            <div className="text-gray-500">Website</div>

                            {org.mainChurchWebsite && (
                                <a href={org.mainChurchWebsite} className="text-blue-600 hover:text-blue-800">
                                    <div className="flex space-x-3 items-center">
                                        {org.mainChurchWebsite}
                                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                    </div>
                                </a>
                            )}
                        </div>
                    </section>
                </CardContent>
            </Card>
        </>
    );
};

export default OrgDescription;
