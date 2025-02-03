import { Link } from "react-router";
import missionsStockPhoto from "~/src/assets/images/missionsStockPhoto.jpg";
import CurrencyFormatter from "../../forms/currencyFormat/CurrencyFormatter";
import { ShieldCheck as ShieldCheckIcon } from "lucide-react";
import { motion } from "framer-motion";
import type { events } from "server/db/schema";
import type { ReactNode } from "react";

interface CardButtonProps {
    children: ReactNode;
}

export const CardButton = ({ children }: CardButtonProps) => {
    const handleClick = () => {
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

type Event = typeof events.$inferSelect;

interface Props {
    mission: Event;
    linkActive?: boolean;
}

export const MissionRowCard = ({ mission, linkActive }: Props) => {
    const card = (
        <CardButton>
            <div className="flex items-center p-4 border relative border-gray-300 mb-4 rounded-lg shadow-md">
                <div style={{ minWidth: "5em" }} className="w-20 h-20 mr-4 bg-gray-300 rounded-full overflow-hidden">
                    <img src={missionsStockPhoto} className="h-full w-full" alt="Mission" />
                </div>
                <div className="flex-grow">
                    <div className="text-xl font-bold">{mission.title}</div>
                    <div className="text-sm text-gray-500 mb-1">{mission.description}</div>
                    {mission.investment && mission.investment > 0 && (
                        <div className="text-lg font-bold text-green-600">
                            Community Investment: <CurrencyFormatter value={mission.investment} />{" "}
                        </div>
                    )}
                    {mission.volunteersNeeded && mission.volunteersNeeded > 0 && (
                        <div className="text-sm text-gray-600">
                            Volunteers needed: {mission.volunteersNeeded}
                        </div>
                    )}
                </div>
            </div>
        </CardButton>
    );
    return linkActive ? <Link to={`/churches/${mission.churchOrganizationId}/events/${mission.id}`}>{card}</Link> : card;
};
