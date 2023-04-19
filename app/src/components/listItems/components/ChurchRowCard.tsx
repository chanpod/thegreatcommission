import { ChurchOrganization } from "@prisma/client";
import React from "react";
import ChurchPlaceholderImage from "~/src/assets/images/placeholderImage1.jpg";
import CardButton from "./MissionRowCard";
import { Link } from "@remix-run/react";

type Props = {
    church: ChurchOrganization;
    linkActive?: boolean;
};

const ChurchRowCard = ({ church, linkActive }: Props) => {

    const card = (
        <CardButton>
            <div className="flex p-4 border border-gray-300 mb-4 rounded-lg shadow-md">
                <div className="w-full">
                    <div className="mb-2">
                        <h2 className="text-2xl">{church.name}</h2>
                    </div>
                    <div className="relative h-56 rounded-lg overflow-hidden">
                        <img
                            className="absolute object-cover w-full h-full"
                            src={ChurchPlaceholderImage}
                            alt="Church image"
                        />
                        {/* <div className="absolute w-[96%] justify-center text-center backdrop-blur-sm items-center top-1 z-10 rounded-md border-solid border-[#5e57573d] bg-[#30303559] p-2 m-2 text-white">
                        <h2 className="text-2xl">{church.name}</h2>
                    </div> */}
                    </div>
                    <div className=" py-2">
                        <p className="text-gray-700">{church.description}</p>
                        <p className="mt-2 text-gray-700">Location: {church.city}, {church.state} {church.zip}</p>
                        <a href="#" className="mt-2 block text-sm font-medium text-indigo-600 hover:text-indigo-500">
                            Learn more
                        </a>
                    </div>
                </div>
            </div>
        </CardButton>
    )

    return linkActive ? <Link to={`/churches/${church.id}`}>{card}</Link> : card;
};

export default ChurchRowCard;
