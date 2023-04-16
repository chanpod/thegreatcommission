import { Missions } from "@prisma/client";
import React from "react";
import EmptyAvatar from "../../avatar/EmptyAvatar";
import RowItem, { primaryText, secondaryText } from "../RowItem";
import Row from "../Row";
import { Link } from "@remix-run/react";
import { CurrencyDollarIcon } from "@heroicons/react/24/outline";

interface Props {
    mission: Missions;
    linkActive?: boolean;
}

const MissionRowItem = ({ mission, linkActive }: Props) => {
    const rowItem = (
        <RowItem className="h-28">
            <div className="mr-3 ">
                <EmptyAvatar />
            </div>
            <div className="flex-1 min-w-0">
                <div className={`${primaryText} text-2xl`}>{mission.title}</div>
                <p className={secondaryText}>{mission.description}</p>
            </div>
            <div className="flex-1 min-w-0 justify-end flex">
                <div className="text-green-400 text-3xl flex items-center">
                    <CurrencyDollarIcon className="w-8 h-8" /> {mission?.investment ?? 0}
                </div>
            </div>
        </RowItem>
    );

    return <Row>{linkActive ? <Link to={`/missions/${mission.id}`}>{rowItem}</Link> : rowItem}</Row>;
};

export default MissionRowItem;
