import { format } from "date-fns";
import { Calendar, Clock, MapPin } from "lucide-react";
import type { events } from "server/db/schema";

interface EventsProps {
	events: Array<typeof events.$inferSelect>;
}

export default function Events({ events }: EventsProps) {
	return (
		<section id="events" className="py-12">
			<div className="container mx-auto px-4">
				<h2 className="text-2xl font-bold mb-6 text-primary">
					Upcoming Events
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{events.map((event) => (
						<div
							key={event.id}
							className="bg-white rounded-lg shadow-md border-l-4 accent-border hover:shadow-lg transition-shadow"
						>
							<div className="p-6">
								<h3 className="text-xl font-semibold mb-2 text-primary">
									{event.title}
								</h3>
								<div className="space-y-2 text-gray-600">
									<div className="flex items-center">
										<Calendar className="h-4 w-4 mr-2 text-accent" />
										<span>{format(event.startDate, "MMMM d, yyyy")}</span>
									</div>
									<div className="flex items-center">
										<Clock className="h-4 w-4 mr-2 text-accent" />
										<span>{format(event.startDate, "h:mm a")}</span>
									</div>
									{event.location && (
										<div className="flex items-center">
											<MapPin className="h-4 w-4 mr-2 text-accent" />
											<span>{event.location}</span>
										</div>
									)}
								</div>
								{event.description && (
									<p className="mt-4 text-gray-600 line-clamp-3">
										{event.description}
									</p>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
