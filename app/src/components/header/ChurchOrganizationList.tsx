
import { Link } from "react-router";
import EmptyAvatar from "../avatar/EmptyAvatar";
import Row from "../listItems/Row";
import RowItem from "../listItems/RowItem";
import { SearchEntityType } from "./SearchBar";
import type { ISearchEntityTypes } from "./SearchBar";
import { map } from "lodash-es";
import type { churchOrganization } from "server/db/schema";

interface Props {
    churches: typeof churchOrganization[];
    onSelected: (selected: ISearchEntityTypes, entityType: SearchEntityType) => void;
}

const ChurchOrganizationList = ({ churches, onSelected }: Props) => {
    return (
        <ul className="max-w-md divide-y  divide-gray-200 dark:divide-gray-700">
            {map(churches, (church: typeof churchOrganization) => {
                return (
                    <div className="cursor-pointer" key={church.id} onClick={() => onSelected(church, SearchEntityType.ChurchOrganization)}>
                        <Row>
                            <RowItem>
                                <div className="flex-shrink-0">
                                    <EmptyAvatar />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{church.name}</p>
                                    <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                                        {church.city}, {church.state}
                                    </p>
                                </div>
                                <div className="inline-flex items-center text-base font-semibold ">{church.zip}</div>
                            </RowItem>
                        </Row>
                    </div>
                );
            })}
        </ul>
    );
};

export default ChurchOrganizationList;
