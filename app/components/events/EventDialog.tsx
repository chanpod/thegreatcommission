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
} from "~/components/ui/dialog";
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

type Event = typeof events.$inferSelect & {
	heroImageUrl?: string;
};

interface EventDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	event?: Event;
	onSubmit: (event: Event) => void;
	onDelete?: () => void;
	mode: "create" | "edit";
}

export function EventDialog({
	open,
	onOpenChange,
	event: initialEvent,
	onSubmit,
	onDelete,
	mode,
}: EventDialogProps) {
	const [event, setEvent] = useState<Event>(() => {
		if (initialEvent) {
			return {
				...initialEvent,
				// Ensure dates are Date objects
				startDate: new Date(initialEvent.startDate),
				endDate: new Date(initialEvent.endDate),
			};
		}
		return {
			title: "",
			description: "",
			type: "local",
			location: "",
			allDay: false,
			startDate: new Date(),
			endDate: addHours(new Date(), 1),
			churchOrganizationId: "",
			createdAt: new Date(),
			updatedAt: new Date(),
		} as Event;
	});

	useEffect(() => {
		if (initialEvent) {
			setEvent({
				...initialEvent,
				startDate: new Date(initialEvent.startDate ?? new Date()),
				endDate: new Date(initialEvent.endDate ?? new Date()),
			});
		}
	}, [initialEvent]);

	const handleDateChange = (date: Date | undefined, isStart: boolean) => {
		if (!date) return;

		if (isStart) {
			setEvent((prev) => ({
				...prev,
				startDate: date,
				endDate:
					prev.endDate && date > prev.endDate
						? addHours(date, 1)
						: prev.endDate,
			}));
		} else {
			setEvent((prev) => ({
				...prev,
				endDate: date,
			}));
		}
	};

	const handleTimeChange = (time: string, isStart: boolean) => {
		const [hours, minutes] = time.split(":").map(Number);

		if (isStart) {
			setEvent((prev) => {
				const newStart = setMinutes(setHours(prev.startDate, hours), minutes);
				const newEnd =
					prev.endDate && newStart > prev.endDate
						? addHours(newStart, 1)
						: prev.endDate;
				return {
					...prev,
					startDate: newStart,
					endDate: newEnd,
				};
			});
		} else {
			setEvent((prev) => ({
				...prev,
				endDate: setMinutes(setHours(prev.endDate, hours), minutes),
			}));
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (mode === "edit" && !event.id) return;

		const eventData = {
			...event,
			// Ensure these are properly formatted for submission
			startDate: event.startDate,
			endDate: event.endDate,
			// Include the ID for edit mode
			...(mode === "edit" && { id: event.id }),
		};

		onSubmit(eventData);
	};

	const handleImageUploadComplete = (res: { url: string }[]) => {
		if (res?.[0]) {
			setEvent((prev) => ({ ...prev, heroImageUrl: res[0].url }));
			toast.success("Hero image uploaded successfully");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
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
							value={event.title}
							onChange={(e) =>
								setEvent({
									...event,
									title: e.target.value,
								})
							}
							placeholder="Enter event title..."
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="type">Event Type</Label>
						<Select
							value={event.type}
							onValueChange={(value) =>
								setEvent({
									...event,
									type: value as Event["type"],
								})
							}
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
							{event.heroImageUrl && (
								<div className="relative">
									<img
										src={event.heroImageUrl}
										alt="Event hero"
										className="w-full h-48 object-cover rounded-md"
									/>
									<Button
										type="button"
										variant="destructive"
										size="sm"
										className="absolute top-2 right-2"
										onClick={() =>
											setEvent((prev) => ({ ...prev, heroImageUrl: "" }))
										}
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
							content={event.description}
							onContentChange={(content) =>
								setEvent({
									...event,
									description: content,
								})
							}
							placeholder="Enter event description..."
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="location">Location</Label>
						<Input
							id="location"
							value={event.location || ""}
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
							<div className="relative flex-1">
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant={"outline"}
											className="w-full top-0 h-full px-3 py-2"
										>
											{event.startDate ? (
												format(event.startDate, "PPP")
											) : (
												<span>Pick a date</span>
											)}
											<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<Calendar
											mode="single"
											selected={event.startDate}
											onSelect={(date) => handleDateChange(date, true)}
											disabled={(date) => date < new Date()}
											initialFocus
										/>
									</PopoverContent>
								</Popover>
							</div>
							{!event.allDay && (
								<TimeField
									value={format(event.startDate, "HH:mm")}
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
											{event.endDate ? (
												format(event.endDate, "PPP")
											) : (
												<span>Pick a date</span>
											)}
											<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<Calendar
											mode="single"
											selected={event.endDate}
											onSelect={(date) => handleDateChange(date, false)}
											disabled={(date) =>
												date < new Date() || date < event.startDate
											}
											initialFocus
										/>
									</PopoverContent>
								</Popover>
							</div>
							{!event.allDay && (
								<TimeField
									value={format(event.endDate, "HH:mm")}
									onChange={(value) => handleTimeChange(value, false)}
								/>
							)}
						</div>
					</div>
					{event.type === "mission" && (
						<>
							<div className="grid gap-2">
								<Label htmlFor="volunteersNeeded">Volunteers Needed</Label>
								<Input
									id="volunteersNeeded"
									type="number"
									value={event.volunteersNeeded || ""}
									onChange={(e) =>
										setEvent({
											...event,
											volunteersNeeded: Number.parseInt(e.target.value) || 0,
										})
									}
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="investment">Investment Goal</Label>
								<Input
									id="investment"
									type="number"
									value={event.investment || ""}
									onChange={(e) =>
										setEvent({
											...event,
											investment: Number.parseInt(e.target.value) || 0,
										})
									}
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="fundingRaised">Funding Raised</Label>
								<Input
									id="fundingRaised"
									type="number"
									value={event.fundingRaised || ""}
									onChange={(e) =>
										setEvent({
											...event,
											fundingRaised: Number.parseInt(e.target.value) || 0,
										})
									}
								/>
							</div>
						</>
					)}
					<DialogFooter className="sticky bottom-0 bg-background pt-4 mt-4 border-t gap-2 sm:gap-0">
						{mode === "edit" && onDelete && (
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
							<Button type="submit">
								{mode === "create" ? "Create Event" : "Update Event"}
							</Button>
						</div>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
