import { Outlet, useLoaderData, useNavigation } from "@remix-run/react";
import Header from "~/src/components/header/Header";
import TheGreatCommissionImage from "~/src/assets/images/mainSplash.png";
import tgcIcon from "~/src/assets/images/tgcIcon.png";
import { useGoogleMap } from "@ubilabs/google-maps-react-hooks";
import WorldMap from "~/src/components/maps/WorldMap";
import { json, LoaderArgs } from "@remix-run/node";
import { prismaClient } from "~/server/dbConnection";
import { map } from "lodash";
import { Location, Missions } from "@prisma/client";

export const loader = async ({ request, params }: LoaderArgs) => {
    const missionMarkers = await prismaClient.missions.findMany({
        select: {
            location: true,
        },
        where: {
            location: {
                isNot: null,
            },
        },
    });

    return json({ missionMarkers });
};

const quoteContainerStyle = {
    position: "absolute",
    top: "2%",
    left: "1%",
    zIndex: 1,
    textAlign: "center",
    maxWidth: "800px",
};

const quoteStyle = {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#fff",
    textShadow: "0px 0px 5px rgba(0, 0, 0, 0.8)",
};

const containerStyle = {
    background: "rgba(44, 39, 39, 0.35)",
    borderRadius: "16px",
    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
    backdropFilter: "blur(5px)",
    WebkitBackdropFilter: "blur(5px)",
    border: "1px solid rgba(34, 29, 29, 0.24)",
};

{
}
export default function Index() {
    const loaderData = useLoaderData();
    return (
        <div className="relative">
            <a
                target="_blank"
                href="https://flowbite.com/getting-started/remix/"
                rel="noreferrer"
                className="text-lg text-blue-600 hover:underline"
            >
                Flowbite + Remix + Tailwind CSS Tutorial
            </a>
            {/* <div style={{ ...quoteContainerStyle, ...containerStyle }}>  */}
            <div className="absolute backdrop-blur-sm left-1 top-1 z-10 rounded-md border-solid border-[#221d1d3d] bg-[#2c272759] p-2 m-2 max-w-5xl">
                <blockquote className="bold text-xl lg:text-4xl italic">
                    "Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the
                    Son and of the Holy Spirit, 20 and teaching them to obey everything I have commanded you. And surely
                    I am with you always, to the very end of the age." - Matthew 28:19-20
                </blockquote>
            </div>
            <div>
                <WorldMap
                    pins={map(loaderData.missionMarkers, (missionMarker: Partial<Missions>) => missionMarker.location)}
                />
            </div>
        </div>
    );
}
