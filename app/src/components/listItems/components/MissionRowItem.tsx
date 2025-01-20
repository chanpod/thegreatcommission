import { DollarSign as CurrencyDollarIcon } from "lucide-react";
import { Link } from "react-router";
import EmptyAvatar from "../../avatar/EmptyAvatar";
import Row from "../Row";
import RowItem, { primaryText, secondaryText } from "../RowItem";
import type { missions } from "server/db/schema";

interface Props {
    mission: typeof missions;
    linkActive?: boolean;
}

const MissionRowItem = ({ mission, linkActive }: Props) => {
    const rowItem = (
        <RowItem className="border-white border-solid border-2 rounded-sm" >
            <div className="mr-3 ">
                <EmptyAvatar />
            </div>
            <div className="flex-1 min-w-0">
                <div className={`${primaryText} text-1xl`}>{mission.title}</div>
                <p className={secondaryText}>{mission.description}</p>
            </div>
            <div className="flex-1 min-w-0 justify-end flex">
                <div className="text-green-400 text-1xl flex items-center">
                    <CurrencyDollarIcon className="w-5 h-5" /> {mission?.investment ?? 0}
                </div>
            </div>
        </RowItem>
    );

    return <Row>{linkActive ? <Link to={`/missions/${mission.id}`}>{rowItem}</Link> : rowItem}</Row>;
};

export default MissionRowItem;
