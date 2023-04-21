import { ChurchOrganization } from "@prisma/client";
import React, { useEffect, useState } from "react";
import { convertAddressToLocation } from "../forms/createChurch/CreateChurchForm";
import { MapPinIcon } from "@heroicons/react/24/outline";
interface Props {
    org: ChurchOrganization;
}

const OrgLocation = ({ org }: Props) => {
    const [location, setLocation] = useState<Location | undefined>(undefined);
    useEffect(() => {
        convertAddress();
    }, []);

    async function convertAddress() {
        const location = await convertAddressToLocation(`${org?.street} ${org?.city}, ${org?.state} ${org?.zip}`);
        setLocation(location);
    }

    return (
        <div className="flex items-center">
            {org?.city}, {org?.state} {org?.zip}
            <a
                target="_blank"
                className="flex items-center"
                href={`https://www.google.com/maps/search/?api=1&query=${location?.lat},${location?.lng}`}
            >
                <MapPinIcon className="h-5 w-5" />
            </a>
        </div>
    );
};

export default OrgLocation;
