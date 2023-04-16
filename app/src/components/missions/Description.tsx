import { Missions } from "@prisma/client";
import { Card, Carousel } from "flowbite-react";
import React from "react";
import PlaceholderImageOne from "app/src/assets/images/placeholderImage1.jpg";
import PlaceholderImageTwo from "app/src/assets/images/placeholderImage2.jpg";

const MissionDescription = ({ mission }: { mission: Missions }) => {
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
                    <div className="text-base">{mission?.description}</div>

                    <hr />
                    <section className="flex flex-col space-y-3">
                        <div className="flex">
                            <div className="text-gray-500">Volunteers Needed:</div>
                            {mission?.volunteerIds?.length ?? 0} / {mission?.volunteersNeeded ?? 0}
                        </div>
                        <div className="flex">
                            <div className="text-gray-500">Funding Raised: </div>${mission?.fundingRaised ?? 0}
                        </div>
                        <div className="flex">
                            <div className="text-gray-500">Community Investment: </div>${mission?.investment ?? 0}
                        </div>
                    </section>
                </>
            </Card>
        </>
    );
};

export default MissionDescription;
