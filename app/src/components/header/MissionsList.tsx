import { ChurchOrganization, Missionary, Missions } from "@prisma/client";
import { Link } from "@remix-run/react";
import EmptyAvatar from "../avatar/EmptyAvatar";
import Row from "../listItems/Row";
import RowItem from "../listItems/RowItem";
import MissionRowItem from "../listItems/components/MissionRowItem";
import { ISearchEntityTypes } from "./SearchBar";
import { map } from "lodash";

interface Props {
    missions: Missions[];

    onSelected: (selected: ISearchEntityTypes) => void;
}

const MissionsList = ({ missions, onSelected }: Props) => {
    return (
        <ul className="max-w-md divide-y flex-col divide-gray-200 dark:divide-gray-700">
            {map(missions, (mission: Missions) => {
                return (
                    <div key={mission.id} onClick={() => onSelected(mission)} className="cursor-pointer">
                        <MissionRowItem mission={mission} />
                    </div>
                );
            })}
        </ul>
    );
};

export default MissionsList;
