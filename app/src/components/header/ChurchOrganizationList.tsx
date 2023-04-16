import { ChurchOrganization, Missionary } from "@prisma/client";
import { Link } from "@remix-run/react";
import EmptyAvatar from "../avatar/EmptyAvatar";
import Row from "../listItems/Row";
import RowItem from "../listItems/RowItem";
import { ISearchEntityTypes, SearchEntityType } from "./SearchBar";
import { map } from "lodash";

interface Props {
    churches: ChurchOrganization[];
    onSelected: (selected: ISearchEntityTypes, entityType: SearchEntityType) => void;
}

const ChurchOrganizationList = ({ churches, onSelected }: Props) => {
    return (
        <ul className="max-w-md divide-y  divide-gray-200 dark:divide-gray-700">
            {map(churches, (church: ChurchOrganization) => {
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
