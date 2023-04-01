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

export default function Index() {
    const loaderData = useLoaderData();
    return (
        <div style={{ minHeight: "80vh" }}>
            <div className="text-4xl p-3" style={{ width: "800px" }}>
                Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the Son
                and of the Holy Spirit, 20 and teaching them to obey everything I have commanded you. And surely I am
                with you always, to the very end of the age.
            </div>

            <WorldMap
                pins={map(loaderData.missionMarkers, (missionMarker: Partial<Missions>) => missionMarker.location)}
            />
            {/* <div style={{ width: "750px" }} className="text-2xl bg-[#0a192f] text-white rounded-md p-5 ml-10 ">
                The Great Commission website is a valuable resource for those looking to connect with churches and
                mission programs around the world. With a user-friendly interface and a vast database of information,
                finding the right fit for your mission work has never been easier. Whether you're looking for a local
                church or an international mission opportunity, The Great Commission offers a comprehensive directory of
                organizations and programs, making it the go-to destination for all things mission-related. Join the
                global community of believers and fulfill your calling to spread the gospel with The Great Commission.
            </div> */}
        </div>
    );
}
