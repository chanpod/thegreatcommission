import { format } from "date-fns";
import { Clock, MapPin } from "lucide-react";
import type { events } from "server/db/schema";
import { formatDescription } from "~/lib/utils";

interface ServiceTimesProps {
	services: Array<typeof events.$inferSelect>;
}

export default function ServiceTimes({ services }: ServiceTimesProps) {
	return (
		<section id="services" className="py-12 bg-gray-100">
			<div className="container mx-auto px-4">
				<h2 className="text-3xl font-bold text-center mb-8">Service Times</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{services.map((service) => (
						<div key={service.id} className="bg-white p-6 rounded-lg shadow-md">
							<h3 className="text-xl font-semibold mb-2">{service.title}</h3>
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
