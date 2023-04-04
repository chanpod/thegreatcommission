import { ChurchOrganization, Missionary } from "@prisma/client";
import { Link } from "@remix-run/react";
import EmptyAvatar from "../avatar/EmptyAvatar";
import Row from "../listItems/Row";
import RowItem from "../listItems/RowItem";

interface Props {
    missionaries: Missionary[];

    onSelected: (selected: ChurchOrganization | Missionary) => void;
}

const MissionariesList = ({ missionaries, onSelected }: Props) => {
    return (
        <ul className="max-w-md divide-y flex-col divide-gray-200 dark:divide-gray-700">
            {missionaries?.map((missionary: Missionary) => {
                return (
                    <div key={missionary.id} onClick={() => onSelected(missionary)} className="cursor-pointer">
                        <Row>
                            <RowItem>
                                <div className="flex-shrink-0">
                                    <EmptyAvatar />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium  truncate">
                                        {missionary.firstName}, {missionary.lastName}
                                    </p>
                                    <p className="text-sm  truncate ">
                                        {missionary.city} {missionary.city ? "," : null} {missionary.state}
                                    </p>
                                </div>
                            </RowItem>
                        </Row>
                    </div>
                );
            })}
        </ul>
    );
};

export default MissionariesList;
