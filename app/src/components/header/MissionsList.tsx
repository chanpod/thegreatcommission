import { Missions } from "@prisma/client";
import { map } from "lodash";

import { ISearchEntityTypes, SearchEntityType } from "./SearchBar";
import { MissionRowCard } from "../listItems/components/MissionRowCard";
import MissionaryListItem from "../missions/MissionaryListItem";
import MissionRowItem from "../listItems/components/MissionRowItem";

interface Props {
    missions: Missions[];

    onSelected: (selected: ISearchEntityTypes, entityType: SearchEntityType) => void;
}

const MissionsList = ({ missions, onSelected }: Props) => {
    return (
        <ul className="max-w-md divide-y  divide-gray-200 dark:divide-gray-700">
            {map(missions, (mission: Missions) => {
                return (
                    <MissionRowItem
                        key={mission.id}
                        linkActive
                        mission={mission}
                        
                    />
                );
            })}
        </ul>
    );
};

export default MissionsList;
