import { Missions } from "@prisma/client";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import pkg from "lodash";
import { prismaClient } from "~/server/dbConnection";
import WorldMap from "~/src/components/maps/WorldMap";

const { map } = pkg;

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
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


export default function Index() {
    const loaderData = useLoaderData<typeof loader>();
    return (
        <div className="relative">
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
