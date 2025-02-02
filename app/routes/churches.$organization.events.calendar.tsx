import { Calendar as BigCalendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { useState, useEffect } from 'react'
import { useSearchParams, useSubmit, useLoaderData, useParams } from 'react-router'
import type { Event } from 'react-big-calendar'
import { db } from '~/server/dbConnection'
import { events } from 'server/db/schema'
import { eq } from 'drizzle-orm'
import { EventDialog } from '~/components/events/EventDialog'

// Ensure you have the CSS imported
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = {
    'en-US': enUS,
}

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
})

interface CalendarEvent extends Event {
    id: string
    title: string
    start: Date
    end: Date
    allDay?: boolean
    description?: string
    type?: 'local' | 'recurring' | 'mission'
    location?: string
}

// Loader function to get events for the calendar view
export async function loader({ params }: Route.LoaderArgs) {
    const organizationId = params.organization
    if (!organizationId) {
        throw new Error('Organization ID is required')
    }

    const orgEvents = await db.select().from(events).where(eq(events.churchOrganizationId, organizationId))

    // Transform the database events into calendar events
    const calendarEvents: CalendarEvent[] = orgEvents.map(event => ({
        id: event.id,
        title: event.title,
        start: event.startDate,
        end: event.endDate,
        allDay: event.allDay,
        description: event.description || undefined,
        type: event.type as 'local' | 'recurring' | 'mission',
        location: event.location || undefined,
    }))

    return { events: calendarEvents }
}

export default function ChurchCalendar() {
    const { events } = useLoaderData<typeof loader>()
    const [searchParams, setSearchParams] = useSearchParams()
    const [view, setView] = useState(Views.MONTH)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
    const organization = useParams().organization
    const submit = useSubmit()

    // Handle create action from URL
    useEffect(() => {
        if (searchParams.get('action') === 'create') {
            setIsCreateDialogOpen(true)
            // Remove the action param after opening dialog
            searchParams.delete('action')
            setSearchParams(searchParams)
        }
    }, [searchParams, setSearchParams])

    const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
        setIsCreateDialogOpen(true)
    }

    const handleSelectEvent = (event: CalendarEvent) => {
        setSelectedEvent(event)
        setIsEditDialogOpen(true)
    }

    const handleCreateEvent = (event: CalendarEvent) => {
        const formData = new FormData()
        formData.append('action', 'create')
        formData.append('title', event.title)
        formData.append('description', event.description || '')
        formData.append('startDate', event.start.toISOString())
        formData.append('endDate', event.end.toISOString())
        formData.append('allDay', String(event.allDay))
        formData.append('type', event.type || 'local')
        formData.append('location', event.location || '')

        submit(formData, { method: 'post', action: `/churches/${organization}/events` })
        setIsCreateDialogOpen(false)
    }

    const handleUpdateEvent = (event: CalendarEvent) => {
        const formData = new FormData()
        formData.append('action', 'update')
        formData.append('id', event.id)
        formData.append('title', event.title)
        formData.append('description', event.description || '')
        formData.append('startDate', event.start.toISOString())
        formData.append('endDate', event.end.toISOString())
        formData.append('allDay', String(event.allDay))
        formData.append('type', event.type || 'local')
        formData.append('location', event.location || '')

        submit(formData, { method: 'post', action: `/churches/${organization}/events` })
        setIsEditDialogOpen(false)
    }

    const handleDeleteEvent = () => {
        if (selectedEvent) {
            const formData = new FormData()
            formData.append('action', 'delete')
            formData.append('id', selectedEvent.id)

            submit(formData, { method: 'post', action: `/churches/${organization}/events` })
            setIsEditDialogOpen(false)
            setSelectedEvent(null)
        }
    }

    return (
        <div className="flex-1 min-h-[600px]">
            <BigCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%', minHeight: '600px' }}
                selectable
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                defaultView={Views.MONTH}
                views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                step={30}
                timeslots={2}
                toolbar={true}
                popup
                className="bg-white shadow-lg rounded-lg"
            />

            <EventDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onSubmit={handleCreateEvent}
                mode="create"
            />

            <EventDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                event={selectedEvent || undefined}
                onSubmit={handleUpdateEvent}
                onDelete={handleDeleteEvent}
                mode="edit"
            />
        </div>
    )
}