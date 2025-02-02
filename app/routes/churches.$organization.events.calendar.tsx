import { Calendar as BigCalendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addHours, setHours, setMinutes } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { useState, useEffect } from 'react'
import { useSearchParams, useSubmit, useLoaderData, useParams } from 'react-router'
import type { Event } from 'react-big-calendar'
import type { Route } from '~/+types/root'
import { db } from '~/server/dbConnection'
import { events } from 'server/db/schema'
import { eq } from 'drizzle-orm'
import { Button } from '~/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/select'
import { Checkbox } from '~/components/ui/checkbox'
import { Calendar } from '~/components/ui/calendar'
import { TimeField } from '~/components/ui/time-field'

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
    const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
        title: '',
        description: '',
        type: 'local',
        location: '',
        allDay: false,
        start: new Date(),
        end: addHours(new Date(), 1),
    })
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
        setNewEvent({
            ...newEvent,
            start,
            end,
            allDay: view === Views.MONTH,
        })
        setIsCreateDialogOpen(true)
    }

    const handleSelectEvent = (event: CalendarEvent) => {
        setSelectedEvent(event)
        setIsEditDialogOpen(true)
    }

    const handleCreateEvent = () => {
        if (newEvent.title && newEvent.start && newEvent.end) {
            const formData = new FormData()
            formData.append('action', 'create')
            formData.append('title', newEvent.title)
            formData.append('description', newEvent.description || '')
            formData.append('startDate', newEvent.start.toISOString())
            formData.append('endDate', newEvent.end.toISOString())
            formData.append('allDay', String(newEvent.allDay))
            formData.append('type', newEvent.type || 'local')
            formData.append('location', newEvent.location || '')

            submit(formData, { method: 'post', action: `/churches/${organization}/events` })
            setIsCreateDialogOpen(false)
            setNewEvent({
                title: '',
                description: '',
                type: 'local',
                location: '',
                allDay: false,
                start: new Date(),
                end: addHours(new Date(), 1),
            })
        }
    }

    const handleUpdateEvent = () => {
        if (selectedEvent) {
            const formData = new FormData()
            formData.append('action', 'update')
            formData.append('id', selectedEvent.id)
            formData.append('title', selectedEvent.title)
            formData.append('description', selectedEvent.description || '')
            formData.append('startDate', selectedEvent.start.toISOString())
            formData.append('endDate', selectedEvent.end.toISOString())
            formData.append('allDay', String(selectedEvent.allDay))
            formData.append('type', selectedEvent.type || 'local')
            formData.append('location', selectedEvent.location || '')

            submit(formData, { method: 'post', action: `/churches/${organization}/events` })
            setIsEditDialogOpen(false)
            setSelectedEvent(null)
        }
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

    const handleDateChange = (date: Date | undefined, isStart: boolean) => {
        if (!date) return

        if (isStart) {
            setNewEvent((prev) => ({
                ...prev,
                start: date,
                end: prev.end && date > prev.end ? addHours(date, 1) : prev.end,
            }))
        } else {
            setNewEvent((prev) => ({
                ...prev,
                end: date,
            }))
        }
    }

    const handleTimeChange = (time: string, isStart: boolean) => {
        const [hours, minutes] = time.split(':').map(Number)

        if (isStart) {
            setNewEvent((prev) => {
                const newStart = setMinutes(setHours(prev.start || new Date(), hours), minutes)
                const newEnd = prev.end && newStart > prev.end ? addHours(newStart, 1) : prev.end
                return {
                    ...prev,
                    start: newStart,
                    end: newEnd,
                }
            })
        } else {
            setNewEvent((prev) => ({
                ...prev,
                end: setMinutes(setHours(prev.end || addHours(new Date(), 1), hours), minutes),
            }))
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

            {/* Create Event Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Create New Event</DialogTitle>
                        <DialogDescription>
                            Add a new event to your calendar
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={newEvent.title}
                                onChange={(e) =>
                                    setNewEvent({
                                        ...newEvent,
                                        title: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={newEvent.description}
                                onChange={(e) =>
                                    setNewEvent({
                                        ...newEvent,
                                        description: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="type">Event Type</Label>
                            <Select
                                value={newEvent.type}
                                onValueChange={(value) =>
                                    setNewEvent({
                                        ...newEvent,
                                        type: value as CalendarEvent['type'],
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select event type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="local">
                                        Local Event
                                    </SelectItem>
                                    <SelectItem value="recurring">
                                        Recurring Service
                                    </SelectItem>
                                    <SelectItem value="mission">
                                        Mission Trip
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                value={newEvent.location}
                                onChange={(e) =>
                                    setNewEvent({
                                        ...newEvent,
                                        location: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="allDay"
                                checked={newEvent.allDay}
                                onCheckedChange={(checked) =>
                                    setNewEvent({
                                        ...newEvent,
                                        allDay: !!checked,
                                    })
                                }
                            />
                            <Label htmlFor="allDay">All day event</Label>
                        </div>
                        <div className="grid gap-2">
                            <Label>Start Date</Label>
                            <div className="flex gap-4">
                                <Calendar
                                    mode="single"
                                    selected={newEvent.start}
                                    onSelect={(date) => handleDateChange(date, true)}
                                    initialFocus
                                />
                                {!newEvent.allDay && (
                                    <TimeField
                                        value={format(newEvent.start || new Date(), 'HH:mm')}
                                        onChange={(value) => handleTimeChange(value, true)}
                                    />
                                )}
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>End Date</Label>
                            <div className="flex gap-4">
                                <Calendar
                                    mode="single"
                                    selected={newEvent.end}
                                    onSelect={(date) => handleDateChange(date, false)}
                                    initialFocus
                                />
                                {!newEvent.allDay && (
                                    <TimeField
                                        value={format(newEvent.end || addHours(new Date(), 1), 'HH:mm')}
                                        onChange={(value) => handleTimeChange(value, false)}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsCreateDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleCreateEvent}>Create Event</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Event Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Event</DialogTitle>
                        <DialogDescription>
                            Modify your event details
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-title">Title</Label>
                            <Input
                                id="edit-title"
                                value={selectedEvent?.title}
                                onChange={(e) =>
                                    setSelectedEvent(
                                        selectedEvent
                                            ? {
                                                ...selectedEvent,
                                                title: e.target.value,
                                            }
                                            : null
                                    )
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                                id="edit-description"
                                value={selectedEvent?.description}
                                onChange={(e) =>
                                    setSelectedEvent(
                                        selectedEvent
                                            ? {
                                                ...selectedEvent,
                                                description: e.target.value,
                                            }
                                            : null
                                    )
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-type">Event Type</Label>
                            <Select
                                value={selectedEvent?.type}
                                onValueChange={(value) =>
                                    setSelectedEvent(
                                        selectedEvent
                                            ? {
                                                ...selectedEvent,
                                                type: value as CalendarEvent['type'],
                                            }
                                            : null
                                    )
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select event type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="local">
                                        Local Event
                                    </SelectItem>
                                    <SelectItem value="recurring">
                                        Recurring Service
                                    </SelectItem>
                                    <SelectItem value="mission">
                                        Mission Trip
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-location">Location</Label>
                            <Input
                                id="edit-location"
                                value={selectedEvent?.location}
                                onChange={(e) =>
                                    setSelectedEvent(
                                        selectedEvent
                                            ? {
                                                ...selectedEvent,
                                                location: e.target.value,
                                            }
                                            : null
                                    )
                                }
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="edit-allDay"
                                checked={selectedEvent?.allDay}
                                onCheckedChange={(checked) =>
                                    setSelectedEvent(
                                        selectedEvent
                                            ? {
                                                ...selectedEvent,
                                                allDay: !!checked,
                                            }
                                            : null
                                    )
                                }
                            />
                            <Label htmlFor="edit-allDay">All day event</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteEvent}
                        >
                            Delete
                        </Button>
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsEditDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleUpdateEvent}>
                                Update Event
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}