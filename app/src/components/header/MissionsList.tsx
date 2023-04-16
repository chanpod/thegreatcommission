import { Missions } from "@prisma/client";
import { map } from "lodash";

import { ISearchEntityTypes, SearchEntityType } from "./SearchBar";
import { MissionRowCard } from "../listItems/components/MissionRowCard";

interface Props {
    missions: Missions[];

    onSelected: (selected: ISearchEntityTypes, entityType: SearchEntityType) => void;
}

const MissionsList = ({ missions, onSelected }: Props) => {
    return (
        <ul className="max-w-md divide-y  divide-gray-200 dark:divide-gray-700">
            {map(missions, (mission: Missions) => {
                return (
                    <MissionRowCard
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
