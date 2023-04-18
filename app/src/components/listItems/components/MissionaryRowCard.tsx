import { ChurchOrganization, Missionary } from "@prisma/client";
import { Link } from "@remix-run/react";
import missionsStockPhoto from "~/src/assets/images/missionsStockPhoto.jpg";

import CardButton from "./MissionRowCard";
import EmptyAvatar from "../../avatar/EmptyAvatar";

interface Props {
    missionary: Missionary;
    linkActive?: boolean;
    sponsoringOrg?: ChurchOrganization;
}

export const MissionaryRowCard = ({ missionary, linkActive, sponsoringOrg }: Props) => {
    const card = (
        <CardButton>
            <div className="flex space-x-3 items-center p-4 border border-gray-300 mb-4 rounded-lg shadow-md">
                <div>
                    <EmptyAvatar />
                </div>
                <div className="flex-grow">
                    <div className="text-xl font-bold">
                        {missionary.firstName} {missionary.lastName}
                    </div>
                </div>
            </div>
        </CardButton>
    );
    return linkActive ? <Link to={`/missionaries/${missionary.id}`}>{card}</Link> : card;
};
