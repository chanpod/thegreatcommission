import { format } from "date-fns";
import { Clock, MapPin, Radio } from "lucide-react";
import type { events } from "server/db/schema";
import { formatDescription, cn } from "~/lib/utils";

interface ServiceTimesProps {
	services: Array<typeof events.$inferSelect>;
	liveStreamUrl?: string | null;
	isLive?: boolean;
}

export default function ServiceTimes({
	services,
	liveStreamUrl,
	isLive = false,
}: ServiceTimesProps) {
	return (
		<section id="services" className="py-12 bg-gray-100">
			<div className="container mx-auto px-4">
				<div className=" flex justify-center items-center gap-2 mb-6">
					<div className="flex relative items-center gap-2">
						<Clock className="h-5 w-5 text-gray-900" />
						<h2 className="text-2xl font-bold text-gray-900">Service Times</h2>
						{liveStreamUrl && isLive && (
							<a
								href={liveStreamUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="absolute  -top-3 -translate-y-1/2 flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700"
							>
								<span className="relative flex h-3 w-3">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
									<span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
								</span>
								<Radio className="h-4 w-4" />
								<span>LIVE</span>
							</a>
						)}
					</div>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{services.map((service) => (
						<div key={service.id} className="bg-white p-6 rounded-lg shadow-md">
							<h3 className="text-xl font-semibold mb-2 text-gray-900">
								{service.title}
							</h3>
							<div className="flex items-center space-x-2 text-sm text-gray-500">
								<Clock className="h-4 w-4" />
								<span>
									{format(service.startDate, "h:mm a")} -{" "}
									{format(service.endDate, "h:mm a")}
								</span>
							</div>
							{service.location && (
								<div className="flex items-center space-x-2 text-sm text-gray-500 mt-2">
									<MapPin className="h-4 w-4" />
									<span>{service.location}</span>
								</div>
							)}
							{service.description && (
								<p className="text-gray-600 mt-2">
									{formatDescription(service.description)}
								</p>
							)}
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
