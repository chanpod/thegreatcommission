import { ChurchOrganization } from "@prisma/client";
import { Link } from "@remix-run/react";
import React from "react";
import EmptyAvatar from "../../avatar/EmptyAvatar";
import Row from "../Row";
import RowItem, { primaryText, secondaryText } from "../RowItem";

type Props = {
    church: ChurchOrganization;
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
