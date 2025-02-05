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
        <h2 className="text-3xl font-bold text-center mb-8">Upcoming Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-gray-100 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{format(event.startDate, 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center text-sm text-gray-500 mt-2">
                <Clock className="w-4 h-4 mr-2" />
                <span>{format(event.startDate, 'h:mm a')} - {format(event.endDate, 'h:mm a')}</span>
              </div>
              {event.location && (
                <div className="flex items-center text-sm text-gray-500 mt-2">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{event.location}</span>
                </div>
              )}
              {event.description && (
                <p className="text-gray-600 mt-2">{event.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

