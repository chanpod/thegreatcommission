import { useEffect, useState } from "react";
import { format, addHours, setHours, setMinutes } from "date-fns";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogClose,
} from "~/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Checkbox } from "~/components/ui/checkbox";
import { Calendar } from "~/components/ui/calendar";
import { TimeField } from "~/components/ui/time-field";
import { CalendarIcon } from "lucide-react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";
import type { events } from "server/db/schema";
import { cn } from "~/lib/utils";
import { RichTextEditor } from "~/components/messaging/RichTextEditor";
import { UploadButton } from "~/utils/uploadthing";
import { toast } from "sonner";
import { EventOrganizerSelector, type Organizer } from "./EventOrganizerSelector";

type Event = typeof events.$inferSelect & {
	heroImageUrl?: string;
	organizers?: Organizer[];
};

export interface EventDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	event?: Event;
	initialDate?: Date;
	onSubmit: (event: Event) => void;
	onDelete?: () => void;
	mode: "create" | "edit" | "view";
	isSubmitting?: boolean;
	showDeleteConfirm?: boolean;
	setShowDeleteConfirm?: (show: boolean) => void;
	churchOrganizationId?: string;
}

export function EventDialog({
	open,
	onOpenChange,
	event,
	initialDate,
	onSubmit,
	onDelete,
	mode = "create",
	isSubmitting = false,
	showDeleteConfirm = false,
	setShowDeleteConfirm,
	churchOrganizationId,
}: EventDialogProps) {
	// Initialize state with event data or defaults
	const [title, setTitle] = useState(event?.title || "");
	const [description, setDescription] = useState(event?.description || "");
	const [startDate, setStartDate] = useState<Date>(
		event?.startDate || initialDate || new Date()
	);
	const [endDate, setEndDate] = useState<Date>(
		event?.endDate || (initialDate ? addHours(initialDate, 1) : addHours(new Date(), 1))
	);
	const [allDay, setAllDay] = useState(event?.allDay || false);
	const [type, setType] = useState(event?.type || "local");
	const [location, setLocation] = useState(event?.location || "");
	const [heroImageUrl, setHeroImageUrl] = useState(event?.heroImageUrl || "");
	const [volunteersNeeded, setVolunteersNeeded] = useState<number | null>(
		event?.volunteersNeeded || null
	);
	const [investment, setInvestment] = useState<number | null>(
		event?.investment || null
	);
	const [fundingRaised, setFundingRaised] = useState<number | null>(
		event?.fundingRaised || null
	);
	const [organizers, setOrganizers] = useState<Organizer[]>(
		event?.organizers || []
	);

	// Use local state if no external state is provided
	const [localShowDeleteConfirm, setLocalShowDeleteConfirm] = useState(false);

	// Use either the provided state or local state
	const deleteConfirmOpen = setShowDeleteConfirm
		? showDeleteConfirm
		: localShowDeleteConfirm;
	const setDeleteConfirmOpen =
		setShowDeleteConfirm || setLocalShowDeleteConfirm;

	useEffect(() => {
		if (event) {
			setStartDate(new Date(event.startDate));
			setEndDate(new Date(event.endDate));
			setAllDay(event.allDay);
			setType(event.type);
			setLocation(event.location || "");
			setHeroImageUrl(event.heroImageUrl || "");
			setVolunteersNeeded(event.volunteersNeeded || null);
			setInvestment(event.investment || null);
			setFundingRaised(event.fundingRaised || null);
			setOrganizers(event.organizers || []);
		}
	}, [event]);

	const handleDateChange = (date: Date | undefined, isStart: boolean) => {
		if (!date) return;

		if (isStart) {
			setStartDate(date);
			setEndDate(
				endDate && date > endDate
					? addHours(date, 1)
					: endDate
			);
		} else {
			setEndDate(date);
		}
	};

	const handleTimeChange = (time: string, isStart: boolean) => {
		const [hours, minutes] = time.split(":").map(Number);

		if (isStart) {
			setStartDate(setMinutes(setHours(startDate, hours), minutes));
			setEndDate(
				endDate && setMinutes(setHours(startDate, hours), minutes) > endDate
					? addHours(setMinutes(setHours(startDate, hours), minutes), 1)
					: endDate
			);
		} else {
			setEndDate(setMinutes(setHours(endDate, hours), minutes));
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (mode === "edit" && !event?.id) return;

		const eventData = {
			...event,
			title,
			description,
			type,
			location,
			allDay,
			startDate,
			endDate,
			volunteersNeeded,
			investment,
			fundingRaised,
			organizers,
			...(mode === "edit" && { id: event?.id }),
		};

		onSubmit(eventData);
	};

	const handleImageUploadComplete = (res: { url: string }[]) => {
		if (res?.[0]) {
			setHeroImageUrl(res[0].url);
			toast.success("Hero image uploaded successfully");
		}
	};

	const handleOrganizersChange = (organizers: Organizer[]) => {
		setOrganizers(organizers);
	};

	return (
		<>
			<Dialog open={open}>
				<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
					<DialogHeader className="sticky top-0 bg-background z-10 pb-4 mb-4 border-b">
						<DialogTitle>
							{mode === "create" ? "Create New Event" : "Edit Event"}
						</DialogTitle>
						<DialogDescription>
							{mode === "create"
								? "Add a new event to your calendar"
								: "Modify your event details"}
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-6">
						<div>
							<Label>Title</Label>
							<Input
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="Enter event title..."
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="type">Event Type</Label>
							<Select
								value={type}
								onValueChange={(value) => setType(value as Event["type"])}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select event type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="local">Local Event</SelectItem>
									<SelectItem value="recurring">Recurring Service</SelectItem>
									<SelectItem value="mission">Mission Trip</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>Hero Image</Label>
							<div className="space-y-4">
								<UploadButton
									endpoint="imageUploader"
									onClientUploadComplete={handleImageUploadComplete}
									onUploadError={(error: Error) => {
										toast.error(`Upload failed: ${error.message}`);
									}}
								/>
								{heroImageUrl && (
									<div className="relative">
										<img
											src={heroImageUrl}
											alt="Event hero"
											className="w-full h-48 object-cover rounded-md"
										/>
										<Button
											type="button"
											variant="destructive"
											size="sm"
											className="absolute top-2 right-2"
											onClick={() => setHeroImageUrl("")}
										>
											Remove Image
										</Button>
									</div>
								)}
							</div>
						</div>
						<div>
							<Label>Description</Label>
							<RichTextEditor
								content={description}
								onContentChange={(content) => setDescription(content)}
								placeholder="Enter event description..."
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="location">Location</Label>
							<Input
								id="location"
								value={location}
								onChange={(e) => setLocation(e.target.value)}
							/>
						</div>
						<div className="flex items-center space-x-2">
							<Checkbox
								id="allDay"
								checked={allDay}
								onCheckedChange={(checked) => setAllDay(!!checked)}
							/>
							<Label htmlFor="allDay">All day event</Label>
						</div>
						<div className="grid gap-2">
							<Label>Start Date</Label>
							<div className="flex gap-4">
								<div className="relative flex-1">
									<Popover>
										<PopoverTrigger asChild>
											<Button
												variant={"outline"}
												className="w-full top-0 h-full px-3 py-2"
											>
												{startDate ? (
													format(startDate, "PPP")
												) : (
													<span>Pick a date</span>
												)}
												<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0" align="start">
											<Calendar
												mode="single"
												selected={startDate}
												onSelect={(date) => handleDateChange(date, true)}
												disabled={(date) => date < new Date()}
												initialFocus
											/>
										</PopoverContent>
									</Popover>
								</div>
								{!allDay && (
									<TimeField
										value={format(startDate, "HH:mm")}
										onChange={(value) => handleTimeChange(value, true)}
									/>
								)}
							</div>
						</div>
						<div className="grid gap-2">
							<Label>End Date</Label>
							<div className="flex gap-4">
								<div className="relative flex-1">
									<Popover>
										<PopoverTrigger asChild>
											<Button
												variant={"outline"}
												className="w-full top-0 h-full px-3 py-2"
											>
												{endDate ? (
													format(endDate, "PPP")
												) : (
													<span>Pick a date</span>
												)}
												<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0" align="start">
											<Calendar
												mode="single"
												selected={endDate}
												onSelect={(date) => handleDateChange(date, false)}
												disabled={(date) =>
													date < new Date() || date < startDate
												}
												initialFocus
											/>
										</PopoverContent>
									</Popover>
								</div>
								{!allDay && (
									<TimeField
										value={format(endDate, "HH:mm")}
										onChange={(value) => handleTimeChange(value, false)}
									/>
								)}
							</div>
						</div>
						{type === "mission" && (
							<>
								<div className="grid gap-2">
									<Label htmlFor="volunteersNeeded">Volunteers Needed</Label>
									<Input
										id="volunteersNeeded"
										type="number"
										value={volunteersNeeded || ""}
										onChange={(e) =>
											setVolunteersNeeded(Number.parseInt(e.target.value) || 0)
										}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="investment">Investment Goal</Label>
									<Input
										id="investment"
										type="number"
										value={investment || ""}
										onChange={(e) =>
											setInvestment(Number.parseInt(e.target.value) || 0)
										}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="fundingRaised">Funding Raised</Label>
									<Input
										id="fundingRaised"
										type="number"
										value={fundingRaised || ""}
										onChange={(e) =>
											setFundingRaised(Number.parseInt(e.target.value) || 0)
										}
									/>
								</div>
							</>
						)}
						{churchOrganizationId && (
							<div className="border rounded-md p-4">
								<EventOrganizerSelector
									churchOrganizationId={churchOrganizationId}
									organizers={organizers}
									onChange={handleOrganizersChange}
								/>
							</div>
						)}
						<DialogFooter className="sticky bottom-0 bg-background pt-4 mt-4 border-t gap-2 sm:gap-0">
							{mode === "edit" && onDelete && (
								<Button
									type="button"
									variant="destructive"
									onClick={() => setDeleteConfirmOpen(true)}
									className="mr-auto"
								>
									Delete
								</Button>
							)}
							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										// Only allow closing if not submitting
										if (!isSubmitting) {
											onOpenChange(false);
										}
									}}
									disabled={isSubmitting}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting ? (
										<>
											<span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
											{mode === "create" ? "Creating..." : "Updating..."}
										</>
									) : mode === "create" ? (
										"Create Event"
									) : (
										"Update Event"
									)}
								</Button>
							</div>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<AlertDialog open={deleteConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Are you sure you want to delete this event?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the
							event
							<strong> {title}</strong> and remove it from our servers.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isSubmitting}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								// Prevent the dialog from closing automatically
								e.preventDefault();
								e.stopPropagation();

								// Set isSubmitting to true immediately
								if (onDelete) {
									onDelete();
								}
							}}
							disabled={isSubmitting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isSubmitting ? (
								<>
									<span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
									Deleting...
								</>
							) : (
								"Delete"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
