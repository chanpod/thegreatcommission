import EmptyAvatar from "../../avatar/EmptyAvatar";
import RowItem, { primaryText, secondaryText } from "../RowItem";
import type { churchOrganization } from "server/db/schema";

type Props = {
    church: typeof churchOrganization;
};

const OrganizationListItem = ({ church }: Props) => {
    return (
        <RowItem>
            <div className="mr-3">
                <EmptyAvatar />
            </div>
            <div className="flex-1 min-w-0">
                <p className={primaryText}>{church.name}</p>
                <p className={secondaryText}>
                    {church.city}, {church.state}
                </p>
            </div>
            <div className={secondaryText}>{church.zip}</div>
        </RowItem>
    );
};

export default OrganizationListItem;
