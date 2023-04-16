import { ChurchOrganization, Missions } from "@prisma/client";
import { Link } from "@remix-run/react";
import missionsStockPhoto from "~/src/assets/images/missionsStockPhoto.jpg";
import CurrencyFormatter from "../../forms/currencyFormat/CurrencyFormatter";

import { motion } from "framer-motion";

// Define the Button component
const Button = ({ children }: any) => {
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

export default Button;

interface Props {
    mission: Missions;
    linkActive?: boolean;
    sponsoringOrg?: ChurchOrganization;
}

export const MissionRowCard = ({ mission, linkActive, sponsoringOrg }: Props) => {
    const card = (
        <Button>
            <div className="card-container rounded-lg shadow-md">
                <div className="card-image rounded-full overflow-hidden">
                    <img src={missionsStockPhoto} className="h-full w-full" alt="Mission" />
                </div>
                <div className="card-content">
                    <div className="event-title">{mission.title}</div>
                    {sponsoringOrg && <div className="event-sponsor mb-4">Org: {sponsoringOrg?.name}</div>}
                    <div className="event-description">
                        Help clean up the local park and promote environmental sustainability.
                    </div>
                    {mission.investment && mission.investment > 0 && (
                        <div className="event-investment">
                            Community Investment: <CurrencyFormatter value={mission.investment} />{" "}
                        </div>
                    )}
                </div>
            </div>
        </Button>
    );
    return linkActive ? <Link to={`/missions/${mission.id}`}>{card}</Link> : card;
};
