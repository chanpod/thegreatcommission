import { ChurchOrganization, Location, Missions } from "@prisma/client";
import { Card, Carousel } from "flowbite-react";
import React, { useEffect, useState } from "react";
import PlaceholderImageOne from "app/src/assets/images/placeholderImage1.jpg";
import PlaceholderImageTwo from "app/src/assets/images/placeholderImage2.jpg";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { convertAddressToLocation } from "../forms/createChurch/CreateChurchForm";

const OrgDescription = ({ org }: { org: ChurchOrganization }) => {
    const [location, setLocation] = useState<Location | undefined>(undefined);
    useEffect(() => {
        convertAddress();
    }, []);

    async function convertAddress() {
        const location = await convertAddressToLocation(`${org?.street} ${org?.city}, ${org?.state} ${org?.zip}`);
        setLocation(location);
    }

    return (
        <>
            <div className="h-56 sm:h-64 xl:h-80 2xl:h-96">
                <Carousel slideInterval={5000}>
                    <img src={PlaceholderImageOne} alt="..." />
                    <img src={PlaceholderImageTwo} alt="..." />
                </Carousel>
            </div>
            <Card>
                <>
                    <h1 className="text-2xl">Description</h1>
                    <div className="text-base">{org?.description}</div>

                    <hr />
                    <section className="flex flex-col space-y-3">
                        <div className="flex flex-col">
                            <div className="text-gray-500">Location</div>
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${location?.lat},${location?.lng}`}
                            >
                                {org?.city}, {org?.state} {org?.zip}
                            </a>
                        </div>
                        <div className="flex flex-col">
                            <div className="text-gray-500">Website</div>

                            {org.mainChurchWebsite && (
                                <a href={org.mainChurchWebsite}>
                                    <div className="flex space-x-3 items-center">
                                        {org.mainChurchWebsite}
                                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                    </div>
                                </a>
                            )}
                        </div>
                    </section>
                </>
            </Card>
        </>
    );
};

export default OrgDescription;
