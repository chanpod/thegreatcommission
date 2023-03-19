import { Outlet, useNavigation } from "@remix-run/react";
import Header from "~/src/components/header/Header";
import TheGreatCommissionImage from "~/src/assets/images/mainSplash.png";
import tgcIcon from "~/src/assets/images/tgcIcon.png";
import { useGoogleMap } from "@ubilabs/google-maps-react-hooks";
import SimpleMap from "~/src/components/maps/HomeMap";
export default function Index() {
    return (
        <div style={{ minHeight: "80vh" }}>
            <div className="flex items-center justify-center">
                <img src={tgcIcon} />
                <h1 className="mb-6 text-5xl font-bold text-center pt-5">The Great Commission</h1>
            </div>
            
            <SimpleMap />
            <div style={{ width: "750px" }} className="text-2xl bg-[#0a192f] text-white rounded-md p-5 ml-10 ">
                The Great Commission website is a valuable resource for those looking to connect with churches and
                mission programs around the world. With a user-friendly interface and a vast database of information,
                finding the right fit for your mission work has never been easier. Whether you're looking for a local
                church or an international mission opportunity, The Great Commission offers a comprehensive directory of
                organizations and programs, making it the go-to destination for all things mission-related. Join the
                global community of believers and fulfill your calling to spread the gospel with The Great Commission.
            </div>
        </div>
    );
}
