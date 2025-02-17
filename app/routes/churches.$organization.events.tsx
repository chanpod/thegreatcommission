import { useState, useEffect } from "react";
import {
	Link,
	useSearchParams,
	useSubmit,
	useLoaderData,
	useParams,
	useNavigate,
	Outlet,
} from "react-router";
import { Button } from "~/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { Plus } from "lucide-react";
import {
	Calendar as BigCalendar,
	dateFnsLocalizer,
	Views,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay, isSameDay } from "date-fns";
import { enUS } from "date-fns/locale";
import type { Event } from "react-big-calendar";
import { db } from "~/server/dbConnection";
import { events } from "server/db/schema";
import { eq } from "drizzle-orm";
import { EventDialog } from "~/components/events/EventDialog";
import type { Route } from "../+types/root";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "~/components/ui/card";
import { Calendar, Clock, MapPin, Edit } from "lucide-react";

// Ensure you have the CSS imported
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
	"en-US": enUS,
};

const localizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek,
	getDay,
	locales,
});

type DbEvent = typeof events.$inferSelect;

export interface CalendarEvent extends Event {
	id: string;
	title: string;
	startDate: Date;
	endDate: Date;
	allDay?: boolean;
	description?: string;
	type?: "local" | "recurring" | "mission";
	location?: string;
}

export const loader = async ({ params }: Route.LoaderArgs) => {
	const organizationId = params.organization;
	if (!organizationId) {
		throw new Error("Organization ID is required");
	}

	const orgEvents = await db
		.select()
		.from(events)
		.where(eq(events.churchOrganizationId, organizationId));

	// Transform the database events into calendar events
	const calendarEvents: CalendarEvent[] = orgEvents.map((event) => ({
		id: event.id,
		title: event.title,
		start: event.startDate,
		end: event.endDate,
		allDay: event.allDay,
		description: event.description || undefined,
		type: event.type as "local" | "recurring" | "mission",
		location: event.location || undefined,
		startDate: event.startDate,
		endDate: event.endDate,
	}));

	// Pre-sort events into upcoming and previous
	const now = new Date();
	const upcomingEvents = calendarEvents.filter(
		(event) => new Date(event.startDate) >= now,
	);
	const previousEvents = calendarEvents.filter(
		(event) => new Date(event.startDate) < now,
	);

	return { events: calendarEvents, upcomingEvents, previousEvents };
};

export const action = async ({ request, params }: Route.ActionArgs) => {
	const formData = await request.formData();
	const action = formData.get("action");

	if (action === "create") {
		const eventData = {
			title: formData.get("title") as string,
			description: formData.get("description") as string,
			startDate: new Date(formData.get("startDate") as string),
			endDate: new Date(formData.get("endDate") as string),
			allDay: formData.get("allDay") === "true",
			type: formData.get("type") as string,
			location: formData.get("location") as string,
			heroImageUrl: (formData.get("heroImageUrl") as string) || null,
			volunteersNeeded: Number(formData.get("volunteersNeeded")) || null,
			investment: Number(formData.get("investment")) || null,
			fundingRaised: Number(formData.get("fundingRaised")) || null,
			churchOrganizationId: params.organization,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const newEvent = await db.insert(events).values(eventData).returning();
		return { success: true, event: newEvent[0] };
	}

	if (action === "update") {
		const eventId = formData.get("eventId") as string;
		const eventData = {
			title: formData.get("title") as string,
			description: formData.get("description") as string,
			startDate: new Date(formData.get("startDate") as string),
			endDate: new Date(formData.get("endDate") as string),
			allDay: formData.get("allDay") === "true",
			type: formData.get("type") as string,
			location: formData.get("location") as string,
			heroImageUrl: (formData.get("heroImageUrl") as string) || null,
			volunteersNeeded: Number(formData.get("volunteersNeeded")) || null,
			investment: Number(formData.get("investment")) || null,
			fundingRaised: Number(formData.get("fundingRaised")) || null,
			updatedAt: new Date(),
		};

		const updatedEvent = await db
			.update(events)
			.set(eventData)
			.where(eq(events.id, eventId))
			.returning();

		return { success: true, event: updatedEvent[0] };
	}

	if (action === "delete") {
		const eventId = formData.get("eventId") as string;
		await db.delete(events).where(eq(events.id, eventId));
		return { success: true };
	}

	throw new Error("Invalid action");
};

function EventCard({
	event,
	onEdit,
}: { event: CalendarEvent; onEdit: () => void }) {
	const typeColors = {
		local: "rounded px-2 py-1 bg-blue-100 text-blue-800",
		recurring: "rounded px-2 py-1 bg-green-100 text-green-800",
		mission: "rounded px-2 py-1 bg-purple-100 text-purple-800",
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex justify-between items-start">
					<div>
						<CardTitle>{event.title}</CardTitle>
						<CardDescription>{event.description}</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						<span className={typeColors[event.type as keyof typeof typeColors]}>
							{event.type}
						</span>
						<Button
							variant="ghost"
							size="icon"
							onClick={onEdit}
							className="h-8 w-8"
						>
							<Edit className="h-4 w-4" />
							<span className="sr-only">Edit event</span>
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-2">
				<div className="flex items-center text-sm text-gray-500">
					<Calendar className="w-4 h-4 mr-2" />
					<span>
						{format(event.startDate, "MMM d, yyyy")}
						{!isSameDay(event.startDate, event.endDate) &&
							` - ${format(event.endDate, "MMM d, yyyy")}`}
					</span>
				</div>
				<div className="flex items-center text-sm text-gray-500">
					<Clock className="w-4 h-4 mr-2" />
					<span>
						{format(event.startDate, "h:mm a")} -{" "}
						{format(event.endDate, "h:mm a")}
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
	);
}

export default function EventsLayout() {
	const { events, upcomingEvents, previousEvents } =
		useLoaderData<typeof loader>();
	const [searchParams, setSearchParams] = useSearchParams();
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [listTab, setListTab] = useState("upcoming");
	const organization = useParams().organization;
	const navigate = useNavigate();
	const submit = useSubmit();

	// Get view from search params, default to calendar
	const view = searchParams.get("view") || "calendar";

	// Update search params when view changes
	const handleViewChange = (newView: string) => {
		searchParams.set("view", newView);
		setSearchParams(searchParams);
	};

	// Handle create action from URL
	useEffect(() => {
		if (searchParams.get("action") === "create") {
			setIsCreateDialogOpen(true);
			// Remove the action param after opening dialog
			searchParams.delete("action");
			setSearchParams(searchParams);
		}
	}, [searchParams, setSearchParams]);

	const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
		setIsCreateDialogOpen(true);
	};

	const handleSelectEvent = (event: CalendarEvent) => {
		navigate(
			`/churches/${organization}/events/${event.id}/edit?${searchParams.toString()}`,
		);
	};

	const handleCreateEvent = (event: DbEvent) => {
		const formData = new FormData();
		formData.append("action", "create");
		formData.append("title", event.title);
		formData.append("description", event.description || "");
		formData.append("startDate", event.startDate.toISOString());
		formData.append("endDate", event.endDate.toISOString());
		formData.append("allDay", String(event.allDay));
		formData.append("type", event.type);
		formData.append("location", event.location || "");

		submit(formData, { method: "post" });
		setIsCreateDialogOpen(false);
	};

	return (
		<div className="container mx-auto p-4 space-y-4">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">Events</h1>
				<Button onClick={() => setIsCreateDialogOpen(true)}>
					<Plus className="w-4 h-4 mr-2" />
					Create Event
				</Button>
			</div>

			<Tabs value={view} onValueChange={handleViewChange} className="w-full">
				<TabsList>
					<TabsTrigger value="calendar">Calendar View</TabsTrigger>
					<TabsTrigger value="list">List View</TabsTrigger>
				</TabsList>

				<TabsContent value="calendar" className="mt-4">
					<div className="flex-1 min-h-[600px]">
						<BigCalendar
							localizer={localizer}
							events={events}
							startAccessor="start"
							endAccessor="end"
							style={{ height: "100%", minHeight: "600px" }}
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
					</div>
				</TabsContent>

				<TabsContent value="list" className="mt-4">
					<div className="space-y-6">
						<Tabs
							value={searchParams.get("listTab") || "upcoming"}
							onValueChange={(value) => {
								searchParams.set("listTab", value);
								setSearchParams(searchParams);
								setListTab(value);
							}}
						>
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
										<EventCard
											key={event.id}
											event={event}
											onEdit={() => handleSelectEvent(event)}
										/>
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
										<EventCard
											key={event.id}
											event={event}
											onEdit={() => handleSelectEvent(event)}
										/>
									))
								)}
							</TabsContent>
						</Tabs>
					</div>
				</TabsContent>
			</Tabs>

			<EventDialog
				open={isCreateDialogOpen}
				onOpenChange={setIsCreateDialogOpen}
				onSubmit={handleCreateEvent}
				mode="create"
			/>
			<Outlet />
		</div>
	);
}
