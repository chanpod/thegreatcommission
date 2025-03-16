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
		<section id="services" className="py-12 bg-white relative overflow-hidden">
			<div className="container mx-auto px-4 relative z-10">
				<div className="flex justify-center items-center gap-2 mb-6 relative">
					<Clock className="h-5 w-5 text-primary" />
					<h2 className="text-2xl font-bold text-primary">Service Times</h2>
					{liveStreamUrl && isLive && (
						<a
							href={liveStreamUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="absolute -top-3 -translate-y-1/2 flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300"
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
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{services.map((service) => (
						<div
							key={service.id}
							className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 accent-border relative overflow-hidden"
						>
							<h3 className="text-xl font-semibold mb-2 text-primary">
								{service.title}
							</h3>
							<div className="space-y-2">
								<div className="flex items-center text-sm">
									<Clock className="h-4 w-4 mr-2 text-accent" />
									<span className="text-gray-600">
										{format(service.startDate, "h:mm a")} -{" "}
										{format(service.endDate, "h:mm a")}
									</span>
								</div>
								{service.location && (
									<div className="flex items-center text-sm">
										<MapPin className="h-4 w-4 mr-2 text-accent" />
										<span className="text-gray-600">{service.location}</span>
									</div>
								)}
							</div>
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
