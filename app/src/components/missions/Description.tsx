import type { missions } from "server/db/schema";
import Autoplay from "embla-carousel-autoplay"

import React from "react";
import PlaceholderImageOne from "app/src/assets/images/placeholderImage1.jpg";
import PlaceholderImageTwo from "app/src/assets/images/placeholderImage2.jpg";
import CurrencyFormatter from "../forms/currencyFormat/CurrencyFormatter";
import { Carousel, CarouselItem } from "~/components/ui/carousel";
import { Card } from "~/components/ui/card";

const MissionDescription = ({ mission }: { mission: typeof missions }) => {
    return (
        <>
            <div className="h-56 sm:h-64 xl:h-80 2xl:h-96">
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
                            <div className="text-gray-500">Community Investment: </div><CurrencyFormatter value={mission?.investment ?? 0} />
                        </div>
                    </section>
                </>
            </Card>
        </>
    );
};

export default MissionDescription;
