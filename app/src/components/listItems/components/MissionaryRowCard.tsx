
import { Link } from "react-router";

import EmptyAvatar from "../../avatar/EmptyAvatar";
import CardButton from "./MissionRowCard";
import type { churchOrganization, missionaries } from "server/db/schema";

interface Props {
    missionary: typeof missionaries;
    linkActive?: boolean;
    sponsoringOrg?: typeof churchOrganization;
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
