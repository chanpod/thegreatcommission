import { Missions } from "@prisma/client";
import React from "react";
import EmptyAvatar from "../../emptyAvatar/EmptyAvatar";
import RowItem, { primaryText, secondaryText } from "../RowItem";

interface Props {
    mission: Missions;
}

const MissionRowItem = ({ mission }: Props) => {
    return (
        <RowItem>
            <div className="mr-3">
                <EmptyAvatar />
            </div>
            <div className="flex-1 min-w-0">
                <p className={primaryText}>{mission.title}</p>
                <p className={secondaryText}>{mission.description}</p>
            </div>
        </RowItem>
    );
};

export default MissionRowItem;
