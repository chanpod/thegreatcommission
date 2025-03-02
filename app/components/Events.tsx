import { format } from "date-fns";
import { Calendar, Clock, MapPin, CalendarX, ArrowRight } from "lucide-react";
import type { events } from "server/db/schema";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";

interface EventsProps {
	events: Array<typeof events.$inferSelect>;
	churchId?: string;
}

export default function Events({ events, churchId }: EventsProps) {
	const eventsPageUrl = churchId ? `/churches/${churchId}/events` : "/events";

	return (
		<section id="events" className="py-12">
			<div className="container mx-auto px-4">
				<h2 className="text-2xl font-bold mb-6">Upcoming Events</h2>

				{events.length > 0 ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						{events.map((event) => (
							<Link
								key={event.id}
								to={`/events/${event.id}/details`}
								className="block bg-white rounded-lg shadow-md border-l-4 accent-border hover:shadow-lg transition-shadow"
							>
								<div className="p-6">
									<h3 className="text-xl font-semibold mb-2 text-primary">
										{event.title}
									</h3>
									<div className="space-y-2 text-gray-600">
										<div className="flex items-center">
											<Calendar className="h-4 w-4 mr-2 text-accent" />
											<span>
												{format(new Date(event.startDate), "MMMM d, yyyy")}
											</span>
										</div>
										<div className="flex items-center">
											<Clock className="h-4 w-4 mr-2 text-accent" />
											<span>{format(new Date(event.startDate), "h:mm a")}</span>
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
											{event.description.replace(/<[^>]*>/g, "")}
										</p>
									)}
								</div>
							</Link>
						))}
					</div>
				) : (
					<div className="bg-white rounded-lg shadow-md p-8 text-center">
						<CalendarX className="h-12 w-12 mx-auto text-gray-400 mb-4" />
						<h3 className="text-xl font-semibold mb-2 text-gray-700">
							No Upcoming Events
						</h3>
						<p className="text-gray-600">
							Check back soon for upcoming events and activities.
						</p>
					</div>
				)}

				{events.length > 0 && (
					<div className="mt-8 text-center">
						<Button asChild variant="outline" className="group">
							<Link to={eventsPageUrl} className="inline-flex items-center">
								View All Events
								<ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
							</Link>
						</Button>
					</div>
				)}
			</div>
		</section>
	);
}
