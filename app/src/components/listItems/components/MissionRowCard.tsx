
import { Link } from "react-router";
import missionsStockPhoto from "~/src/assets/images/missionsStockPhoto.jpg";
import CurrencyFormatter from "../../forms/currencyFormat/CurrencyFormatter";

import { ShieldCheck as ShieldCheckIcon } from "lucide-react";
import { motion } from "framer-motion";
import type { churchOrganization, missions } from "server/db/schema";

// Define the Button component
export const CardButton = ({ children }: any) => {
    const handleClick = () => {
        // Handle click event
        // You can add your desired functionality here

        // Example: Log a message on click
        console.log("Button clicked!");
    };

    return (
        <motion.div
            whileHover={{ backgroundColor: "#f3f3f3", scale: 0.95 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClick}
        >
            {children}
        </motion.div>
    );
};

export default CardButton;

interface Props {
    mission: typeof missions;
    linkActive?: boolean;
    sponsoringOrg?: typeof churchOrganization;
}

export const MissionRowCard = ({ mission, linkActive, sponsoringOrg }: Props) => {
    const card = (
        <CardButton>
            <div className="flex items-center p-4 border relative border-gray-300 mb-4 rounded-lg shadow-md">
                <div className="absolute top-2 right-2">
                    {mission.sensitive && <ShieldCheckIcon color="green" className="rounded-full h-8 w-8 " />}
                </div>
                <div style={{ minWidth: "5em" }} className="w-20 h-20 mr-4 bg-gray-300 rounded-full overflow-hidden">
                    <img src={missionsStockPhoto} className="h-full w-full" alt="Mission" />
                </div>
                <div className="flex-grow">
                    <div className="text-xl font-bold">{mission.title}</div>
                    {sponsoringOrg && <div className="text-base text-gray-600 mb-4">Org: {sponsoringOrg?.name}</div>}
                    <div className="text-sm text-gray-500 mb-1">{mission.description}</div>
                    {mission.investment && mission.investment > 0 && (
                        <div className="text-lg font-bold text-green-600">
                            Community Investment: <CurrencyFormatter value={mission.investment} />{" "}
                        </div>
                    )}
                </div>
            </div>
        </CardButton>
    );
    return linkActive ? <Link to={`/missions/${mission.id}`}>{card}</Link> : card;
};
