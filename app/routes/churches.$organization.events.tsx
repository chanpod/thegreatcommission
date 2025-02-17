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
import {
	Calendar,
	Clock,
	MapPin,
	Edit,
	LayoutGrid,
	CalendarDays,
	ExternalLink,
} from "lucide-react";
import { cn } from "~/lib/utils";

// Ensure you have the CSS imported
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
	PermissionsService,
	type PermissionSet,
} from "@/server/services/PermissionsService";
import { authenticator } from "~/server/auth/strategies/authenticaiton";

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

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const organizationId = params.organization;
	if (!organizationId) {
		throw new Error("Organization ID is required");
	}

	const user = await authenticator.isAuthenticated(request);
	if (!user) {
		throw new Error("User is not authenticated");
	}

	const orgEvents = await db
		.select()
		.from(events)
		.where(eq(events.churchOrganizationId, organizationId));

	const permissionsService = new PermissionsService();
	const permissions = await permissionsService.getEventPermissions(
		user.id,
		organizationId,
	);

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

	return {
		events: calendarEvents,
		upcomingEvents,
		previousEvents,
		permissions,
	};
};

export const action = async ({ request, params }: Route.ActionArgs) => {
	const formData = await request.formData();
	const action = formData.get("action");
	const user = await authenticator.isAuthenticated(request);
	if (!user) {
		throw new Error("User is not authenticated");
	}

	const permissionsService = new PermissionsService();
	const permissions = await permissionsService.getEventPermissions(
		user.id,
		params.organization,
	);

	if (action === "create") {
		if (!permissions.canAdd) {
			throw new Error("You are not authorized to create events");
		}

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
		if (!permissions.canEdit) {
			throw new Error("You are not authorized to edit events");
		}

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
		if (!permissions.canDelete) {
			throw new Error("You are not authorized to delete events");
		}

		const eventId = formData.get("eventId") as string;
		await db.delete(events).where(eq(events.id, eventId));
		return { success: true };
	}

	throw new Error("Invalid action");
};

function EventCard({
	event,
	onEdit,
	permissions,
}: { event: CalendarEvent; onEdit: () => void; permissions: PermissionSet }) {
	const params = useParams();
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
						{permissions.canEdit && (
							<Button
								variant="ghost"
								size="icon"
								onClick={onEdit}
								className="h-8 w-8"
							>
								<Edit className="h-4 w-4" />
								<span className="sr-only">Edit event</span>
							</Button>
						)}
						<Button variant="ghost" size="icon" className="h-8 w-8" asChild>
							<Link
								to={`/churches/${params.organization}/events/${event.id}/details`}
							>
								<ExternalLink className="h-4 w-4" />
								<span className="sr-only">View details</span>
							</Link>
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
	const { events, upcomingEvents, previousEvents, permissions } =
		useLoaderData<typeof loader>();
	const [searchParams, setSearchParams] = useSearchParams();
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [listTab, setListTab] = useState("upcoming");
	const organization = useParams().organization;
	const navigate = useNavigate();
	const submit = useSubmit();

	// Get view from search params, default to calendar
	const view = searchParams.get("view") || "calendar";
	const calendarView = searchParams.get("calendarView") || Views.MONTH;
	const currentDate = searchParams.get("date")
		? new Date(searchParams.get("date")!)
		: new Date();

	// Update search params when view changes
	const handleViewChange = (newView: string) => {
		searchParams.set("view", newView);
		setSearchParams(searchParams);
	};

	// Handle calendar navigation and view changes
	const handleCalendarChange = (date: Date, view: string) => {
		searchParams.set("date", date.toISOString());
		searchParams.set("calendarView", view);
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

	const handleSelectEvent = (event: CalendarEvent, e: React.MouseEvent) => {
		// Show a small popup menu with Edit and Details options
		const menu = document.createElement("div");
		menu.className =
			"absolute bg-white shadow-lg rounded-lg p-2 space-y-2 z-50";
		menu.style.left = `${e.clientX}px`;
		menu.style.top = `${e.clientY}px`;

		const editButton = document.createElement("button");
		editButton.className =
			"flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md";
		editButton.innerHTML =
			'<svg class="w-4 h-4"><use href="#edit-icon"/></svg> Edit Event';
		editButton.onclick = () => {
			navigate(
				`/churches/${organization}/events/${event.id}/edit?${searchParams.toString()}`,
			);
			document.body.removeChild(menu);
		};

		const detailsButton = document.createElement("button");
		detailsButton.className =
			"flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md";
		detailsButton.innerHTML =
			'<svg class="w-4 h-4"><use href="#external-link-icon"/></svg> View Details';
		detailsButton.onclick = () => {
			navigate(`/events/${event.id}/details?${searchParams.toString()}`);
			document.body.removeChild(menu);
		};

		if (permissions.canEdit) {
			menu.appendChild(editButton);
		}
		menu.appendChild(detailsButton);
		document.body.appendChild(menu);

		// Close menu when clicking outside
		const closeMenu = (e: MouseEvent) => {
			if (!menu.contains(e.target as Node)) {
				document.body.removeChild(menu);
				document.removeEventListener("click", closeMenu);
			}
		};
		setTimeout(() => document.addEventListener("click", closeMenu), 0);
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

	const CustomToolbar = (toolbar: any) => {
		const goToBack = () => {
			toolbar.onNavigate("PREV");
		};
		const goToNext = () => {
			toolbar.onNavigate("NEXT");
		};
		const goToCurrent = () => {
			toolbar.onNavigate("TODAY");
		};

		return (
			<div className="flex justify-between items-center p-4 border-b">
				<div className="flex items-center gap-2">
					<Button variant="secondary" size="sm" onClick={goToBack}>
						Previous
					</Button>
					<Button variant="secondary" size="sm" onClick={goToCurrent}>
						Today
					</Button>
					<Button variant="secondary" size="sm" onClick={goToNext}>
						Next
					</Button>
					<span className="text-lg font-semibold ml-4">{toolbar.label}</span>
				</div>
				<div className="flex bg-gray-100 rounded-lg p-1">
					{Object.entries(Views).map(([key, value]) => (
						<Button
							key={key}
							variant="ghost"
							size="sm"
							onClick={() => toolbar.onView(value)}
							className={cn(
								"rounded-lg",
								toolbar.view === value && "bg-white shadow-sm",
							)}
						>
							{key.charAt(0) + key.slice(1).toLowerCase()}
						</Button>
					))}
				</div>
			</div>
		);
	};

	return (
		<div className="container mx-auto p-4 space-y-4">
			{/* Add hidden SVG definitions for the popup menu icons */}
			<svg className="hidden" aria-hidden="true" role="presentation">
				<title>UI Icons</title>
				<symbol
					id="edit-icon"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
					<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
				</symbol>
				<symbol
					id="external-link-icon"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
					<polyline points="15 3 21 3 21 9" />
					<line x1="10" y1="14" x2="21" y2="3" />
				</symbol>
			</svg>
			<div className="flex justify-between items-center">
				<div className="flex items-center gap-4">
					<h1 className="text-2xl font-bold">Events</h1>
					<div className="flex bg-gray-100 rounded-lg p-1">
						<Button
							variant="ghost"
							size="sm"
							className={cn(
								"rounded-lg",
								view === "calendar" && "bg-white shadow-sm",
							)}
							onClick={() => handleViewChange("calendar")}
						>
							<CalendarDays className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className={cn(
								"rounded-lg",
								view === "list" && "bg-white shadow-sm",
							)}
							onClick={() => handleViewChange("list")}
						>
							<LayoutGrid className="h-4 w-4" />
						</Button>
					</div>
				</div>
				{permissions.canAdd && (
					<Button onClick={() => setIsCreateDialogOpen(true)}>
						<Plus className="w-4 h-4 mr-2" />
						Create Event
					</Button>
				)}
			</div>

			{view === "calendar" ? (
				<div className="flex-1 min-h-[600px]">
					<BigCalendar
						localizer={localizer}
						events={events}
						startAccessor="start"
						endAccessor="end"
						style={{ height: "100%", minHeight: "600px" }}
						selectable
						onSelectSlot={handleSelectSlot}
						onSelectEvent={(calEvent, e) => handleSelectEvent(calEvent, e)}
						date={currentDate}
						view={calendarView}
						onNavigate={(date) => handleCalendarChange(date, calendarView)}
						onView={(view) => handleCalendarChange(currentDate, view)}
						defaultView={Views.MONTH}
						views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
						step={30}
						timeslots={2}
						components={{
							toolbar: CustomToolbar,
						}}
						popup
						className="bg-white shadow-lg rounded-lg overflow-hidden"
					/>
				</div>
			) : (
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
								<p className="text-center text-gray-500">No upcoming events</p>
							) : (
								upcomingEvents.map((event) => (
									<EventCard
										key={event.id}
										event={event}
										permissions={permissions}
										onEdit={() =>
											navigate(
												`/churches/${organization}/events/${event.id}/edit?${searchParams.toString()}`,
											)
										}
									/>
								))
							)}
						</TabsContent>

						<TabsContent value="previous" className="space-y-4 mt-4">
							{previousEvents.length === 0 ? (
								<p className="text-center text-gray-500">No previous events</p>
							) : (
								previousEvents.map((event) => (
									<EventCard
										key={event.id}
										event={event}
										permissions={permissions}
										onEdit={() =>
											navigate(
												`/churches/${organization}/events/${event.id}/edit?${searchParams.toString()}`,
											)
										}
									/>
								))
							)}
						</TabsContent>
					</Tabs>
				</div>
			)}
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
