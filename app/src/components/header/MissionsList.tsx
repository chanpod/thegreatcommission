
import { map } from "lodash-es";

import { SearchEntityType } from "./SearchBar";
import type { ISearchEntityTypes } from "./SearchBar";
import MissionRowItem from "../listItems/components/MissionRowItem";
import type { missions } from "server/db/schema";

interface Props {
    missions: typeof missions[];

    onSelected: (selected: ISearchEntityTypes, entityType: SearchEntityType) => void;
}

const MissionsList = ({ missions, onSelected }: Props) => {
    return (
        <ul className="max-w-md divide-y  divide-gray-200 dark:divide-gray-700">
            {map(missions, (mission: typeof missions) => {
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
