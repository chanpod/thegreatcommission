import { useState } from 'react'
import { format, isSameDay } from 'date-fns'
import { useLoaderData } from 'react-router'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/tabs'
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from '~/components/ui/card'
import { Calendar, Clock, MapPin } from 'lucide-react'
import { db } from '~/server/dbConnection'
import { events } from 'server/db/schema'
import { eq } from 'drizzle-orm'
import type { Route } from '~/+types/root'

interface Event {
    id: string
    title: string
    description: string | null
    start: Date
    end: Date
    type: 'local' | 'recurring' | 'mission'
    location: string | null
}

// Loader function to get events for the list view
export async function loader({ params }: { params: { organization: string } }) {
    const organizationId = params.organization
    if (!organizationId) {
        throw new Error('Organization ID is required')
    }

    const orgEvents = await db.select().from(events).where(eq(events.churchOrganizationId, organizationId))

    // Transform the database events into list events
    const listEvents: Event[] = orgEvents.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        start: event.startDate,
        end: event.endDate,
        type: event.type as 'local' | 'recurring' | 'mission',
        location: event.location,
    }))

    // Pre-sort events into upcoming and previous
    const now = new Date()
    const upcomingEvents = listEvents.filter(event => new Date(event.start) >= now)
    const previousEvents = listEvents.filter(event => new Date(event.start) < now)

    return { upcomingEvents, previousEvents }
}

function EventCard({ event }: { event: Event }) {
    const typeColors = {
        local: 'rounded px-2 py-1 bg-blue-100 text-blue-800',
        recurring: 'rounded px-2 py-1 bg-green-100 text-green-800',
        mission: 'rounded px-2 py-1 bg-purple-100 text-purple-800',
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{event.title}</CardTitle>
                        <CardDescription>{event.description}</CardDescription>
                    </div>
                    <span
                        className={
                            typeColors[event.type as keyof typeof typeColors]
                        }
                    >
                        {event.type}
                    </span>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                        {format(event.start, 'MMM d, yyyy')}
                        {!isSameDay(event.start, event.end) &&
                            ` - ${format(event.end, 'MMM d, yyyy')}`}
                    </span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>
                        {format(event.start, 'h:mm a')} -{' '}
                        {format(event.end, 'h:mm a')}
                    </span>
                </div>
                {event.location && (
                    <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{event.location}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default function EventsList() {
    const { upcomingEvents, previousEvents } = useLoaderData<typeof loader>()
    const [activeTab, setActiveTab] = useState('upcoming')

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
                    <TabsTrigger value="previous">Previous Events</TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="space-y-4 mt-4">
                    {upcomingEvents.length === 0 ? (
                        <p className="text-center text-gray-500">
                            No upcoming events
                        </p>
                    ) : (
                        upcomingEvents.map((event) => (
                            <EventCard key={event.id} event={event} />
                        ))
                    )}
                </TabsContent>

                <TabsContent value="previous" className="space-y-4 mt-4">
                    {previousEvents.length === 0 ? (
                        <p className="text-center text-gray-500">
                            No previous events
                        </p>
                    ) : (
                        previousEvents.map((event) => (
                            <EventCard key={event.id} event={event} />
                        ))
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
} 
