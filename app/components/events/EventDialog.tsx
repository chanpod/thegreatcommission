import { useState } from 'react'
import { format, addHours, setHours, setMinutes } from 'date-fns'
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

interface Event {
    id?: string
    title: string
    description?: string
    start: Date
    end: Date
    allDay?: boolean
    type?: 'local' | 'recurring' | 'mission'
    location?: string
}

interface EventDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    event?: Event
    onSubmit: (event: Event) => void
    onDelete?: () => void
    mode: 'create' | 'edit'
}

export function EventDialog({
    open,
    onOpenChange,
    event: initialEvent,
    onSubmit,
    onDelete,
    mode
}: EventDialogProps) {
    const [event, setEvent] = useState<Event>(
        initialEvent || {
            title: '',
            description: '',
            type: 'local',
            location: '',
            allDay: false,
            start: new Date(),
            end: addHours(new Date(), 1),
        }
    )

    const handleDateChange = (date: Date | undefined, isStart: boolean) => {
        if (!date) return

        if (isStart) {
            setEvent((prev) => ({
                ...prev,
                start: date,
                end: prev.end && date > prev.end ? addHours(date, 1) : prev.end,
            }))
        } else {
            setEvent((prev) => ({
                ...prev,
                end: date,
            }))
        }
    }

    const handleTimeChange = (time: string, isStart: boolean) => {
        const [hours, minutes] = time.split(':').map(Number)

        if (isStart) {
            setEvent((prev) => {
                const newStart = setMinutes(setHours(prev.start, hours), minutes)
                const newEnd = prev.end && newStart > prev.end ? addHours(newStart, 1) : prev.end
                return {
                    ...prev,
                    start: newStart,
                    end: newEnd,
                }
            })
        } else {
            setEvent((prev) => ({
                ...prev,
                end: setMinutes(setHours(prev.end, hours), minutes),
            }))
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-foreground">
                        {mode === 'create' ? 'Create New Event' : 'Edit Event'}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'create' ? 'Add a new event to your calendar' : 'Modify your event details'}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={event.title}
                            onChange={(e) =>
                                setEvent({
                                    ...event,
                                    title: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={event.description}
                            onChange={(e) =>
                                setEvent({
                                    ...event,
                                    description: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="type">Event Type</Label>
                        <Select
                            value={event.type}
                            onValueChange={(value) =>
                                setEvent({
                                    ...event,
                                    type: value as Event['type'],
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
                            value={event.location}
                            onChange={(e) =>
                                setEvent({
                                    ...event,
                                    location: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="allDay"
                            checked={event.allDay}
                            onCheckedChange={(checked) =>
                                setEvent({
                                    ...event,
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
                                selected={event.start}
                                onSelect={(date) => handleDateChange(date, true)}
                                initialFocus
                            />
                            {!event.allDay && (
                                <TimeField
                                    value={format(event.start, 'HH:mm')}
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
                                selected={event.end}
                                onSelect={(date) => handleDateChange(date, false)}
                                initialFocus
                            />
                            {!event.allDay && (
                                <TimeField
                                    value={format(event.end, 'HH:mm')}
                                    onChange={(value) => handleTimeChange(value, false)}
                                />
                            )}
                        </div>
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    {mode === 'edit' && onDelete && (
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={onDelete}
                            className="mr-auto"
                        >
                            Delete
                        </Button>
                    )}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={() => onSubmit(event)}
                        >
                            {mode === 'create' ? 'Create Event' : 'Update Event'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 
