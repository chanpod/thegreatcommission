
import React, { useEffect, useState } from "react";
import { convertAddressToLocation } from "../forms/createChurch/CreateChurchForm";
import { MapPin as MapPinIcon } from "lucide-react";
import type { churchOrganization } from "server/db/schema";
interface Props {
    org: typeof churchOrganization;
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
        <div className="flex items-center space-x-2 text-gray-900">
            {org?.city}, {org?.state} {org?.zip}
            <a
                target="_blank"
                className="flex items-center text-blue-600 hover:text-blue-800"
                href={`https://www.google.com/maps/search/?api=1&query=${location?.lat},${location?.lng}`}
            >
                <MapPinIcon className="h-5 w-5" />
            </a>
        </div>
    );
};

export default OrgLocation;
