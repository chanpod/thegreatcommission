import React, { useEffect, useState } from "react";
import { convertAddressToLocation } from "../forms/createChurch/CreateChurchForm";
import { MapPin as MapPinIcon } from "lucide-react";
import type { churchOrganization } from "server/db/schema";

interface Props {
	org: typeof churchOrganization.$inferSelect;
	className?: string;
}

const OrgLocation = ({ org, className = "" }: Props) => {
	const [location, setLocation] = useState<Location | undefined>(undefined);

	useEffect(() => {
		convertAddress();
	}, [org]);

	async function convertAddress() {
		if (org?.street && org?.city && org?.state && org?.zip) {
			const location = await convertAddressToLocation(
				`${org.street} ${org.city}, ${org.state} ${org.zip}`,
			);
			setLocation(location);
		}
	}

	if (!org?.city && !org?.state) return null;

	return (
		<div className={`flex items-center text-sm text-gray-500 ${className}`}>
			<MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
			<span>
				{org?.city}
				{org?.city && org?.state ? ", " : ""}
				{org?.state} {org?.zip}
			</span>
			{location && (
				<a
					target="_blank"
					rel="noopener noreferrer"
					className="ml-1 text-blue-600 hover:text-blue-800 hover:underline"
					href={`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`}
					title="View on Google Maps"
				>
					<span className="text-xs">(map)</span>
				</a>
			)}
		</div>
	);
};

export default OrgLocation;
