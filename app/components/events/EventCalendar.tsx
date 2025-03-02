import React, { useState, useEffect, useRef } from "react";
import {
	ChevronLeft,
	ChevronRight,
	Plus,
	Calendar as CalendarIcon,
	CalendarDays,
	CalendarRange,
	MapPin,
	RefreshCw,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";
import {
	format,
	addMonths,
	subMonths,
	startOfMonth,
	endOfMonth,
	eachDayOfInterval,
	isSameMonth,
	isToday,
	isSameDay,
	addWeeks,
	subWeeks,
	startOfWeek,
	endOfWeek,
	isWithinInterval,
	getWeek,
} from "date-fns";

// Types for our events (compatible with the existing app)
export interface CalendarEvent {
	id: string;
	title: string;
	start: string; // ISO string
	end: string; // ISO string
	allDay?: boolean;
	description?: string;
	type?: "local" | "recurring" | "mission";
	location?: string;
}

type CalendarView = "month" | "week";

interface EventCalendarProps {
	events: CalendarEvent[];
	onDateClick?: (date: Date) => void;
	onEventClick?: (event: CalendarEvent) => void;
	onEditEvent?: (event: CalendarEvent) => void;
	onViewEvent?: (event: CalendarEvent) => void;
	onAddEvent?: (date: Date) => void;
	themeColors?: {
		primary: string;
		secondary: string;
		accent: string;
	};
	permissions?: {
		canAdd: boolean;
		canEdit: boolean;
		canDelete: boolean;
	};
	initialDate?: Date;
	initialView?: CalendarView;
	calendarView?: CalendarView;
	onCalendarViewChange?: (view: CalendarView) => void;
}

const EventCalendar: React.FC<EventCalendarProps> = ({
	events = [],
	onDateClick,
	onEventClick,
	onEditEvent,
	onViewEvent,
	onAddEvent,
	themeColors = { primary: "#3b82f6", secondary: "#1e293b", accent: "#8b5cf6" },
	permissions = { canAdd: true, canEdit: true, canDelete: true },
	initialDate,
	initialView = "month",
	calendarView,
	onCalendarViewChange,
}) => {
	const [currentMonth, setCurrentMonth] = useState(initialDate || new Date());
	const [selectedDate, setSelectedDate] = useState(initialDate || new Date());
	const [calendarDays, setCalendarDays] = useState<Date[]>([]);
	const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([]);
	const [view, setView] = useState<CalendarView>(calendarView || initialView);

	// Style variables based on theme colors
	const styles = {
		primary: themeColors.primary,
		secondary: themeColors.secondary,
		accent: themeColors.accent,
		primaryLight: `${themeColors.primary}15`,
		primaryDark: `${themeColors.primary}dd`,
		todayBackground: `${themeColors.accent}20`,
	};

	// Update view when calendarView prop changes
	useEffect(() => {
		if (calendarView && calendarView !== view) {
			setView(calendarView);
		}
	}, [calendarView, view]);

	// Generate calendar days based on view
	useEffect(() => {
		if (view === "month") {
			generateMonthView();
		} else {
			generateWeekView();
		}
	}, [currentMonth, view]);

	// Generate days for month view
	const generateMonthView = () => {
		const firstDay = startOfMonth(currentMonth);
		const lastDay = endOfMonth(currentMonth);

		// Get days from previous month to fill first row
		const prevMonthDays = [];
		const firstDayOfWeek = firstDay.getDay();

		if (firstDayOfWeek > 0) {
			const prevMonth = subMonths(firstDay, 1);
			const lastDayOfPrevMonth = endOfMonth(prevMonth);
			const daysToFill = firstDayOfWeek;

			for (let i = daysToFill - 1; i >= 0; i--) {
				const day = new Date(lastDayOfPrevMonth);
				day.setDate(lastDayOfPrevMonth.getDate() - i);
				prevMonthDays.push(day);
			}
		}

		// Get all days of current month
		const currentMonthDays = eachDayOfInterval({
			start: firstDay,
			end: lastDay,
		});

		// Get days from next month to fill last row
		const nextMonthDays = [];
		const daysFromCurrentAndPrev =
			prevMonthDays.length + currentMonthDays.length;
		const totalCells = Math.ceil(daysFromCurrentAndPrev / 7) * 7;
		const daysToAdd = totalCells - daysFromCurrentAndPrev;

		if (daysToAdd > 0) {
			const nextMonth = addMonths(firstDay, 1);
			for (let i = 1; i <= daysToAdd; i++) {
				const day = new Date(nextMonth);
				day.setDate(i);
				nextMonthDays.push(day);
			}
		}

		setCalendarDays([...prevMonthDays, ...currentMonthDays, ...nextMonthDays]);
	};

	// Generate days for week view
	const generateWeekView = () => {
		const weekStart = startOfWeek(currentMonth);
		const weekEnd = endOfWeek(currentMonth);
		const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
		setCalendarDays(weekDays);
	};

	// Update selected events when date changes
	useEffect(() => {
		const dateEvents = events.filter((event) =>
			isSameDay(new Date(event.start), selectedDate),
		);
		setSelectedEvents(dateEvents);
	}, [selectedDate, events]);

	// Navigation based on view
	const next = () => {
		if (view === "month") {
			setCurrentMonth(addMonths(currentMonth, 1));
		} else {
			setCurrentMonth(addWeeks(currentMonth, 1));
		}
	};

	const prev = () => {
		if (view === "month") {
			setCurrentMonth(subMonths(currentMonth, 1));
		} else {
			setCurrentMonth(subWeeks(currentMonth, 1));
		}
	};

	// Change view
	const changeView = (newView: CalendarView) => {
		setView(newView);
		onCalendarViewChange?.(newView);
	};

	// Get events for a specific day
	const getEventsForDay = (day: Date) => {
		return events.filter((event) => {
			// For regular events, check if they occur on this day
			const eventStart = new Date(event.start);
			const isOnThisDay = isSameDay(eventStart, day);

			// For recurring events, check if they should appear on this day
			if (event.type === "recurring" && day >= eventStart) {
				// Check if it's the same day of week (weekly recurrence)
				const isSameDayOfWeek = eventStart.getDay() === day.getDay();
				return isSameDayOfWeek;
			}

			// Return true if it's a regular event on this day
			return isOnThisDay;
		});
	};

	// Event type colors (matching existing app)
	const eventTypeColors: Record<string, string> = {
		mission: "#ef4444", // Red
		local: "#22c55e", // Green
		recurring: "#8b5cf6", // Purple/accent
	};

	// Format the header title based on view
	const getHeaderTitle = () => {
		if (view === "month") {
			return format(currentMonth, "MMMM yyyy");
		}

		const weekStart = startOfWeek(currentMonth);
		const weekEnd = endOfWeek(currentMonth);
		if (isSameMonth(weekStart, weekEnd)) {
			return `${format(weekStart, "MMMM d")} - ${format(weekEnd, "d, yyyy")}`;
		}
		return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
	};

	return (
		<div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
			<div className="flex flex-col md:flex-row h-full">
				<div className="flex-1 flex flex-col min-h-[500px]">
					{/* Calendar Header */}
					<div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-100">
						<div className="flex items-center space-x-1 sm:space-x-2">
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 sm:h-9 sm:w-9 text-gray-500 hover:text-gray-700"
								onClick={(e) => {
									e.stopPropagation();
									prev();
								}}
							>
								<ChevronLeft size={18} className="sm:hidden" />
								<ChevronLeft size={20} className="hidden sm:block" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 sm:h-9 sm:w-9 text-gray-500 hover:text-gray-700"
								onClick={(e) => {
									e.stopPropagation();
									next();
								}}
							>
								<ChevronRight size={18} className="sm:hidden" />
								<ChevronRight size={20} className="hidden sm:block" />
							</Button>
							<h2 className="text-base sm:text-lg font-medium text-gray-800 ml-1 sm:ml-2">
								{getHeaderTitle()}
							</h2>
						</div>

						<div className="flex items-center">
							<div className="bg-gray-200 rounded-md p-0.5 mr-2 sm:mr-3 hidden sm:flex">
								<button
									type="button"
									className={cn(
										"px-3 py-1 text-sm rounded-md transition-colors",
										view === "month"
											? "bg-white text-primary-600 font-medium shadow-sm"
											: "text-gray-700 hover:text-gray-900",
									)}
									onClick={(e) => {
										e.stopPropagation();
										changeView("month");
									}}
								>
									Month
								</button>
								<button
									type="button"
									className={cn(
										"px-3 py-1 text-sm rounded-md transition-colors",
										view === "week"
											? "bg-white text-primary-600 font-medium shadow-sm"
											: "text-gray-700 hover:text-gray-900",
									)}
									onClick={(e) => {
										e.stopPropagation();
										changeView("week");
									}}
								>
									Week
								</button>
							</div>

							{/* Mobile view toggle */}
							<div className="sm:hidden flex mr-2 bg-gray-200 rounded-md p-0.5">
								<button
									type="button"
									className={cn(
										"p-1 rounded-md transition-colors",
										view === "month"
											? "bg-white text-primary-600 shadow-sm"
											: "text-gray-700",
									)}
									onClick={(e) => {
										e.stopPropagation();
										changeView("month");
									}}
								>
									<CalendarDays size={16} />
								</button>
								<button
									type="button"
									className={cn(
										"p-1 rounded-md transition-colors",
										view === "week"
											? "bg-white text-primary-600 shadow-sm"
											: "text-gray-700",
									)}
									onClick={(e) => {
										e.stopPropagation();
										changeView("week");
									}}
								>
									<CalendarRange size={16} />
								</button>
							</div>

							<Button
								variant="outline"
								size="sm"
								className="h-8 sm:h-9 border-gray-200 text-gray-700 text-xs sm:text-sm"
								onClick={(e) => {
									e.stopPropagation();
									setCurrentMonth(new Date());
								}}
							>
								Today
							</Button>
						</div>
					</div>

					{/* Calendar Grid */}
					<div className="flex flex-col md:flex-row">
						<div className="w-full md:w-3/4">
							{/* Day Headers */}
							<div className="grid grid-cols-7 text-center py-2 sm:py-3 text-xs sm:text-sm text-gray-500 border-b border-gray-100 bg-white">
								{["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
									<div key={day + i} className="py-1">
										<span className="hidden sm:inline">
											{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i]}
										</span>
										<span className="sm:hidden">{day}</span>
									</div>
								))}
							</div>

							{/* Calendar Days */}
							<div
								className={cn(
									"grid grid-cols-7 divide-x divide-gray-100 divide-y divide-gray-100 border-t border-gray-100",
									view === "week" && "min-h-[400px] sm:min-h-[500px]",
									"md:month-view-grid week-view-grid",
								)}
							>
								{calendarDays.map((day, i) => {
									const dayEvents = getEventsForDay(day);
									const isOtherMonth =
										view === "month" && !isSameMonth(day, currentMonth);
									const isCurrentDay = isToday(day);
									const isSelected = isSameDay(day, selectedDate);

									return (
										<div
											key={i}
											className={cn(
												"min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 transition-colors relative group",
												isOtherMonth ? "bg-gray-50/50" : "bg-white",
												isCurrentDay ? "shadow-inner" : "",
												isSelected ? "ring-1 ring-primary-300" : "",
												"hover:bg-gray-50/70 cursor-pointer",
												view === "week" && "h-full",
											)}
											style={{
												opacity: isOtherMonth ? 0.5 : 1,
												backgroundColor: isCurrentDay
													? styles.todayBackground
													: "",
												boxShadow: isCurrentDay
													? `inset 0 0 0 1px ${styles.accent}40`
													: "",
											}}
											onClick={(e) => {
												e.stopPropagation();
												setSelectedDate(day);
												onDateClick?.(day);
											}}
											role="button"
											tabIndex={0}
											onKeyDown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													e.stopPropagation();
													setSelectedDate(day);
													onDateClick?.(day);
												}
											}}
										>
											{/* Day Number */}
											<div
												className={cn(
													"text-right mb-1 sm:mb-2 font-medium text-xs sm:text-sm",
													isCurrentDay ? "font-bold" : "",
													isOtherMonth ? "text-gray-400" : "text-gray-700",
												)}
											>
												{format(day, view === "month" ? "d" : "EEE d")}
											</div>

											{/* Events */}
											<div
												className={cn(
													"overflow-y-auto space-y-1 sm:space-y-1.5",
													view === "month"
														? "max-h-[50px] sm:max-h-[70px]"
														: "max-h-[340px] sm:max-h-[440px]",
												)}
											>
												{(view === "month"
													? dayEvents.slice(0, 3)
													: dayEvents
												).map((event) => (
													<div
														key={event.id}
														className="text-xs rounded-md py-0.5 sm:py-1 px-1 sm:px-2 truncate shadow-sm relative group"
														style={{
															backgroundColor: event.type
																? eventTypeColors[event.type]
																: styles.primary,
															color: "#fff",
														}}
														onClick={(e) => {
															e.stopPropagation();
															setSelectedDate(day);
															onDateClick?.(day);
														}}
														role="button"
														tabIndex={0}
														onKeyDown={(e) => {
															if (e.key === "Enter" || e.key === " ") {
																e.stopPropagation();
																setSelectedDate(day);
																onDateClick?.(day);
															}
														}}
														title="Click to view events for this day"
													>
														{view === "week" && !event.allDay && (
															<span className="inline-block mr-1 font-semibold">
																{format(new Date(event.start), "h:mm a")}
															</span>
														)}
														{event.title}
														<span className="hidden group-hover:inline-block absolute right-1 top-1/2 -translate-y-1/2 text-white opacity-80 text-[8px]">
															View day
														</span>
													</div>
												))}

												{view === "month" && dayEvents.length > 3 && (
													<div className="text-xs text-right pr-1 text-gray-500 font-medium">
														+{dayEvents.length - 3} more
													</div>
												)}
											</div>
										</div>
									);
								})}
							</div>
						</div>

						{/* Event Details Panel */}
						<div className="w-full md:w-1/4 border-l border-gray-100">
							<div className="p-3 sm:p-5">
								<div className="flex justify-between items-center mb-3 sm:mb-5">
									<h3
										className="font-medium text-sm sm:text-base text-gray-700"
										style={{ color: styles.secondary }}
									>
										{format(selectedDate, "MMM d, yyyy")}
										<span className="hidden sm:inline">
											{format(selectedDate, " (EEEE)")}
										</span>
									</h3>
									{permissions.canAdd && (
										<Button
											size="sm"
											className="h-8 sm:h-9 rounded-full shadow-sm text-xs sm:text-sm"
											style={{ backgroundColor: styles.primary }}
											onClick={(e) => {
												e.stopPropagation();
												onAddEvent?.(selectedDate);
											}}
										>
											<Plus size={14} className="sm:hidden mr-1" />
											<Plus size={16} className="hidden sm:block mr-1" />
											<span className="sm:hidden">Add</span>
											<span className="hidden sm:inline">Add</span>
										</Button>
									)}
								</div>

								{selectedEvents.length > 0 ? (
									<div className="space-y-2 sm:space-y-3 max-h-[400px] overflow-y-auto pr-1">
										<h4 className="font-medium text-xs uppercase tracking-wider text-gray-500 mb-1 sm:mb-2">
											Events ({selectedEvents.length})
										</h4>
										{selectedEvents.map((event) => (
											<div
												key={event.id}
												className="p-2 sm:p-3 rounded-md border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-white"
											>
												<div className="flex justify-between items-start">
													<h4 className="font-medium text-sm sm:text-base text-gray-800 mb-1">
														{event.title}
													</h4>
													<div
														className="w-3 h-3 sm:w-4 sm:h-4 rounded-full"
														style={{
															backgroundColor: event.type
																? eventTypeColors[event.type]
																: styles.primary,
														}}
													></div>
												</div>
												<div className="text-xs sm:text-sm text-gray-500 mb-1">
													{event.allDay
														? "All day"
														: `${format(new Date(event.start), "h:mm a")} - ${format(new Date(event.end), "h:mm a")}`}
												</div>
												{event.location && (
													<div className="text-xs sm:text-sm text-gray-500 flex items-center mb-2">
														<MapPin size={12} className="mr-1" />
														{event.location}
													</div>
												)}
												{event.type === "recurring" && (
													<div className="text-xs sm:text-sm text-purple-600 flex items-center mb-2">
														<RefreshCw size={12} className="mr-1" />
														Recurring event
													</div>
												)}

												{/* Action buttons */}
												<div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-100">
													{permissions.canEdit && (
														<button
															className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center transition-colors"
															onClick={(e) => {
																e.stopPropagation();
																onEditEvent?.(event);
															}}
														>
															<svg
																width="12"
																height="12"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																strokeWidth="2"
																strokeLinecap="round"
																strokeLinejoin="round"
																className="mr-1"
															>
																<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
																<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
															</svg>
															Edit
														</button>
													)}
													<button
														className="text-xs px-2 py-1 rounded bg-primary-50 hover:bg-primary-100 text-primary-700 flex items-center transition-colors"
														onClick={(e) => {
															e.stopPropagation();
															onViewEvent?.(event);
														}}
													>
														<svg
															width="12"
															height="12"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															strokeWidth="2"
															strokeLinecap="round"
															strokeLinejoin="round"
															className="mr-1"
														>
															<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
															<polyline points="15 3 21 3 21 9"></polyline>
															<line x1="10" y1="14" x2="21" y2="3"></line>
														</svg>
														View
													</button>
												</div>
											</div>
										))}
									</div>
								) : (
									<div className="text-center py-6 sm:py-10 bg-gray-50 rounded-lg">
										<div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2 sm:mb-3">
											<CalendarIcon
												size={18}
												className="sm:hidden text-gray-500"
											/>
											<CalendarIcon
												size={22}
												className="hidden sm:block text-gray-500"
											/>
										</div>
										<p className="text-sm sm:text-base text-gray-500">
											No events scheduled for this day
										</p>
										{permissions.canAdd && (
											<Button
												size="sm"
												className="mt-2 sm:mt-3 h-8 sm:h-9 rounded-full shadow-sm text-xs sm:text-sm"
												style={{ backgroundColor: styles.primary }}
												onClick={(e) => {
													e.stopPropagation();
													onAddEvent?.(selectedDate);
												}}
											>
												<Plus size={14} className="sm:hidden mr-1" />
												<Plus size={16} className="hidden sm:block mr-1" />
												<span className="sm:hidden">Add</span>
												<span className="hidden sm:inline">Add Event</span>
											</Button>
										)}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Add CSS for responsive behavior */}
				<style>
					{`
					@media (max-width: 768px) {
						.week-view-grid {
							display: grid;
						}
						.month-view-grid {
							display: none;
						}
					}
					@media (min-width: 769px) {
						.week-view-grid {
							display: grid;
						}
						.month-view-grid {
							display: grid;
						}
					}
					`}
				</style>
			</div>
		</div>
	);
};

export default EventCalendar;
