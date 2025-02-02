import { Outlet, Link, useLocation } from 'react-router'
import { Button } from '~/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Plus } from 'lucide-react'
import { db } from '~/server/dbConnection'
import { events } from 'server/db/schema'
import { eq } from 'drizzle-orm'
import type { Route } from '../+types/root'

// Action function to handle CRUD operations
export async function action({ request, params }: Route.ActionArgs) {
    const organizationId = params.organization
    if (!organizationId) {
        throw new Error('Organization ID is required')
    }

    const formData = await request.formData()
    const action = formData.get('action')

    switch (action) {
        case 'create': {
            const eventData = {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                startDate: new Date(formData.get('startDate') as string),
                endDate: new Date(formData.get('endDate') as string),
                allDay: formData.get('allDay') === 'true',
                type: formData.get('type') as string,
                location: formData.get('location') as string,
                recurrence: formData.get('recurrence') as string,
                lat: Number.parseInt(formData.get('lat') as string) || null,
                lng: Number.parseInt(formData.get('lng') as string) || null,
                volunteersNeeded: Number.parseInt(formData.get('volunteersNeeded') as string) || null,
                investment: Number.parseInt(formData.get('investment') as string) || null,
                fundingRaised: Number.parseInt(formData.get('fundingRaised') as string) || null,
                churchOrganizationId: organizationId,
                updatedAt: new Date(),
            }

            const newEvent = await db.insert(events).values(eventData)
            return { event: newEvent }
        }

        case 'update': {
            const eventId = formData.get('id') as string
            if (!eventId) {
                throw new Error('Event ID is required for updates')
            }

            const eventData = {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                startDate: new Date(formData.get('startDate') as string),
                endDate: new Date(formData.get('endDate') as string),
                allDay: formData.get('allDay') === 'true',
                type: formData.get('type') as string,
                location: formData.get('location') as string,
                recurrence: formData.get('recurrence') as string,
                lat: Number.parseInt(formData.get('lat') as string) || null,
                lng: Number.parseInt(formData.get('lng') as string) || null,
                volunteersNeeded: Number.parseInt(formData.get('volunteersNeeded') as string) || null,
                investment: Number.parseInt(formData.get('investment') as string) || null,
                fundingRaised: Number.parseInt(formData.get('fundingRaised') as string) || null,
                updatedAt: new Date(),
            }

            await db
                .update(events)
                .set(eventData)
                .where(eq(events.id, eventId))

            return { success: true }
        }

        case 'delete': {
            const eventId = formData.get('id') as string
            if (!eventId) {
                throw new Error('Event ID is required for deletion')
            }

            await db
                .delete(events)
                .where(eq(events.id, eventId))

            return { success: true }
        }

        default:
            throw new Error('Invalid action')
    }
}

export default function EventsLayout() {
    const location = useLocation()
    const currentView = location.pathname.endsWith('/list') ? 'list' : 'calendar'

    return (
        <div className="container mx-auto p-4 space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Events</h1>
                <Button asChild>
                    <Link to="calendar?action=create">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Event
                    </Link>
                </Button>
            </div>

            <Tabs value={currentView} className="w-full">
                <TabsList>
                    <TabsTrigger value="calendar" asChild>
                        <Link to="calendar">Calendar View</Link>
                    </TabsTrigger>
                    <TabsTrigger value="list" asChild>
                        <Link to="list">List View</Link>
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <Outlet />
        </div>
    )
} 
