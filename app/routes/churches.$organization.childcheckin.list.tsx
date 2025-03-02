import { useState, useEffect } from "react";
import {
	useParams,
	useNavigate,
	Link,
	useLoaderData,
	useFetcher,
	useSearchParams,
} from "react-router";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { childCheckinService } from "~/services/ChildCheckinService";
import { useToast } from "~/hooks/use-toast";
import { createAuthLoader } from "~/server/auth/authLoader";
import { data } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import type {
	ChildCheckin,
	Guardian,
	AuthorizedPickupPerson,
	CheckinSession,
} from "@/server/db/schema";
import { Switch } from "~/components/ui/switch";

// Define extended types for the checkin data with additional properties
interface ExtendedChildCheckin extends ChildCheckin {
	guardians?: Guardian[];
	authorizedPickupPersons?: AuthorizedPickupPerson[];
	child?: {
		id: string;
		firstName: string;
		lastName: string;
		dateOfBirth?: Date;
		allergies?: string;
		specialNotes?: string;
		photoUrl?: string;
	};
}

// Define the loader data type
interface LoaderData {
	sessions: (CheckinSession & { activeCount: number })[];
	checkins: ExtendedChildCheckin[];
	checkedOutToday: ExtendedChildCheckin[];
	error?: string;
}

// Loader to fetch sessions and checkins
export const loader = createAuthLoader(async ({ params, request }) => {
	const { organization } = params;
	const searchParams = new URLSearchParams(request.url.split("?")[1]);
	const sessionId = searchParams.get("sessionId");

	if (!organization) {
		return data(
			{
				sessions: [],
				checkins: [],
				checkedOutToday: [],
				error: "Invalid organization",
			},
			{ status: 400 },
		);
	}

	try {
		// Get all active sessions
		const sessions =
			await childCheckinService.getActiveCheckinSessions(organization);

		// Fetch active count for each session
		const sessionsWithCounts = await Promise.all(
			sessions.map(async (session) => {
				const activeCount = await childCheckinService.getActiveCheckinsCount(
					session.id,
				);
				return {
					...session,
					activeCount,
				};
			}),
		);

		// If there are sessions, fetch checkins for the first session
		let checkins = [];
		let checkedOutToday = [];

		if (sessions.length > 0 && sessionId) {
			// Get active (not checked out) checkins
			checkins = await childCheckinService.getActiveCheckins(sessionId);

			// For each checkin, fetch the guardian information
			for (const checkin of checkins) {
				const guardians = await childCheckinService.getGuardiansForChild(
					checkin.childId,
				);

				(checkin as ExtendedChildCheckin).guardians = guardians || [];

				// Fetch authorized pickup persons
				const pickupPersons =
					await childCheckinService.getAuthorizedPickupPersons(checkin.id);
				(checkin as ExtendedChildCheckin).authorizedPickupPersons =
					pickupPersons || [];
			}

			// Get checked out children from today
			checkedOutToday =
				await childCheckinService.getCheckedOutChildrenToday(sessionId);

			// For each checked out checkin, fetch the guardian information
			for (const checkin of checkedOutToday) {
				const guardians = await childCheckinService.getGuardiansForChild(
					checkin.childId,
				);

				(checkin as ExtendedChildCheckin).guardians = guardians || [];

				// Fetch authorized pickup persons
				const pickupPersons =
					await childCheckinService.getAuthorizedPickupPersons(checkin.id);
				(checkin as ExtendedChildCheckin).authorizedPickupPersons =
					pickupPersons || [];
			}
		}

		return data({
			sessions: sessionsWithCounts,
			checkins,
			checkedOutToday,
		});
	} catch (error) {
		console.error("Error loading data:", error);
		return data(
			{
				sessions: [],
				checkins: [],
				checkedOutToday: [],
				error: "Failed to load child check-in data",
			},
			{ status: 500 },
		);
	}
});

// Define the action data type
interface ActionData {
	success: boolean;
	checkins?: ExtendedChildCheckin[];
	checkedOutToday?: ExtendedChildCheckin[];
	sessions?: CheckinSession[];
	message?: string;
	error?: string;
}

// Action to handle form submissions
export const action = createAuthLoader(async ({ params, request }) => {
	const { organization } = params;
	const searchParams = new URLSearchParams(request.url.split("?")[1]);
	const sessionId = searchParams.get("sessionId");

	if (!organization) {
		return data(
			{ success: false, error: "Invalid organization" },
			{ status: 400 },
		);
	}

	const formData = await request.formData();
	const action = formData.get("_action");

	try {
		if (action === "getCheckins") {
			const sessionId = formData.get("sessionId");

			if (!sessionId) {
				return data(
					{ success: false, error: "Session ID is required" },
					{ status: 400 },
				);
			}

			const checkins = await childCheckinService.getActiveCheckins(
				sessionId.toString(),
			);

			// For each checkin, fetch the guardian information
			for (const checkin of checkins) {
				const guardians = await childCheckinService.getGuardiansForChild(
					checkin.childId,
				);
				(checkin as ExtendedChildCheckin).guardians = guardians;

				// Fetch authorized pickup persons
				const pickupPersons =
					await childCheckinService.getAuthorizedPickupPersons(checkin.id);
				(checkin as ExtendedChildCheckin).authorizedPickupPersons =
					pickupPersons;
			}

			return data({
				success: true,
				checkins,
			});
		}

		if (action === "checkout") {
			const checkinId = formData.get("checkinId");
			const guardianId = formData.get("guardianId");
			const sessionId = formData.get("sessionId");

			if (!checkinId || !guardianId || !sessionId) {
				return data(
					{ success: false, error: "Missing required fields" },
					{ status: 400 },
				);
			}

			await childCheckinService.checkoutChild(
				checkinId.toString(),
				guardianId.toString(),
			);

			// Fetch updated checkins list
			const checkins = await childCheckinService.getActiveCheckins(
				sessionId.toString(),
			);

			// Fetch today's checked out children
			const checkedOutToday =
				await childCheckinService.getCheckedOutChildrenToday(
					sessionId.toString(),
				);

			// For each checkin, fetch the guardian information
			for (const checkin of checkins) {
				const guardians = await childCheckinService.getGuardiansForChild(
					checkin.childId,
				);
				(checkin as ExtendedChildCheckin).guardians = guardians;

				// Fetch authorized pickup persons
				const pickupPersons =
					await childCheckinService.getAuthorizedPickupPersons(checkin.id);
				(checkin as ExtendedChildCheckin).authorizedPickupPersons =
					pickupPersons;
			}

			// For each checked out checkin, fetch the guardian information
			for (const checkin of checkedOutToday) {
				const guardians = await childCheckinService.getGuardiansForChild(
					checkin.childId,
				);
				(checkin as ExtendedChildCheckin).guardians = guardians;

				// Fetch authorized pickup persons
				const pickupPersons =
					await childCheckinService.getAuthorizedPickupPersons(checkin.id);
				(checkin as ExtendedChildCheckin).authorizedPickupPersons =
					pickupPersons;
			}

			return data({
				success: true,
				message: "Child has been successfully checked out",
				checkins,
				checkedOutToday,
			});
		}

		if (action === "renameSession") {
			const sessionId = formData.get("sessionId");
			const newName = formData.get("newName");

			if (!sessionId || !newName) {
				return data(
					{ success: false, error: "Session ID and new name are required" },
					{ status: 400 },
				);
			}

			await childCheckinService.updateSessionName(
				sessionId.toString(),
				newName.toString(),
			);

			// Fetch updated sessions list
			const sessions =
				await childCheckinService.getActiveCheckinSessions(organization);

			return data({
				success: true,
				message: "Session has been successfully renamed",
				sessions,
			});
		}

		return data({ success: false, error: "Invalid action" }, { status: 400 });
	} catch (error) {
		console.error("Error processing action:", error);
		return data(
			{ success: false, error: "Failed to process action" },
			{ status: 500 },
		);
	}
});

// RenameSessionDialog component
interface RenameSessionDialogProps {
	isOpen: boolean;
	onClose: () => void;
	session: {
		id: string;
		name: string;
	} | null;
}

function RenameSessionDialog({
	isOpen,
	onClose,
	session,
}: RenameSessionDialogProps) {
	const fetcher = useFetcher<ActionData>();
	const [newName, setNewName] = useState("");

	useEffect(() => {
		if (session) {
			setNewName(session.name);
		}
	}, [session]);

	useEffect(() => {
		if (fetcher.data?.success) {
			onClose();
		}
	}, [fetcher.data, onClose]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const formData = new FormData();
		formData.append("_action", "renameSession");
		formData.append("sessionId", session?.id || "");
		formData.append("newName", newName);

		fetcher.submit(formData, { method: "post" });
		// onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Rename Session</DialogTitle>
					<DialogDescription>
						Enter a new name for the session.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="name" className="text-right">
								Name
							</Label>
							<Input
								id="name"
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								className="col-span-3"
								autoFocus
							/>
						</div>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" disabled={!newName.trim()}>
							Save Changes
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export default function ChildCheckinList() {
	const { organization } = useParams();
	const navigate = useNavigate();
	const { toast } = useToast();
	const [searchParams, setSearchParams] = useSearchParams();
	const loaderData = useLoaderData<typeof loader>() as LoaderData;

	const {
		sessions: initialSessions,
		checkins: initialCheckins,
		checkedOutToday: initialCheckedOutToday,
		error,
	} = loaderData;
	const fetcher = useFetcher<ActionData>();

	const checkins = fetcher.data?.checkins || initialCheckins;
	const checkedOutToday =
		fetcher.data?.checkedOutToday || initialCheckedOutToday;

	const [searchTerm, setSearchTerm] = useState("");
	const [showCheckedOut, setShowCheckedOut] = useState(false);
	const [processingCheckinId, setProcessingCheckinId] = useState<string | null>(
		null,
	);
	const loading = fetcher.state === "submitting";
	const sessions = loaderData.sessions;
	// State for rename session dialog
	const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
	const [sessionToRename, setSessionToRename] = useState<{
		id: string;
		name: string;
	} | null>(null);

	// Show error toast if there's an error from the loader
	useEffect(() => {
		if (error) {
			toast({
				title: "Error",
				description: error,
				variant: "destructive",
			});
		}
	}, [error, toast]);

	// Update checkins when fetcher returns data
	useEffect(() => {
		if (fetcher.data?.success) {
			// Show success message if available
			if (fetcher.data.message) {
				toast({
					title: "Success",
					description: fetcher.data.message,
				});
			}
			// Reset processing state
			setProcessingCheckinId(null);
		} else if (fetcher.data && !fetcher.data.success && fetcher.data.error) {
			toast({
				title: "Error",
				description: fetcher.data.error,
				variant: "destructive",
			});
			// Reset processing state on error too
			setProcessingCheckinId(null);
		}
	}, [fetcher.data, toast]);

	const handleSessionChange = (sessionId: string) => {
		const urlSearchParams = new URLSearchParams(searchParams);
		urlSearchParams.set("sessionId", sessionId);
		setSearchParams(urlSearchParams);
	};

	const handleCheckout = (checkinId: string, guardianId: string) => {
		const formData = new FormData();
		formData.append("_action", "checkout");
		formData.append("checkinId", checkinId);
		formData.append("guardianId", guardianId);
		// Get the current sessionId from URL search params
		const currentSessionId = searchParams.get("sessionId");
		if (currentSessionId) {
			formData.append("sessionId", currentSessionId);
		} else {
			toast({
				title: "Error",
				description: "No active session selected for checkout",
				variant: "destructive",
			});
			return;
		}

		// Set the checkin being processed
		setProcessingCheckinId(checkinId);

		toast({
			title: "Processing...",
			description: "Processing checkout, please wait...",
		});
		fetcher.submit(formData, { method: "post" });
	};

	const handleRenameSession = (session: { id: string; name: string }) => {
		setSessionToRename(session);
		setIsRenameDialogOpen(true);
	};

	// Get initials for avatar fallback
	const getInitials = (firstName?: string, lastName?: string) => {
		if (!firstName && !lastName) return "?";
		const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : "";
		const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : "";
		return `${firstInitial}${lastInitial}`;
	};

	const calculateAge = (dateOfBirth: Date): number => {
		const today = new Date();
		let age = today.getFullYear() - dateOfBirth.getFullYear();
		const monthDifference = today.getMonth() - dateOfBirth.getMonth();

		if (
			monthDifference < 0 ||
			(monthDifference === 0 && today.getDate() < dateOfBirth.getDate())
		) {
			age--;
		}

		return age;
	};

	const sessionId = searchParams.get("sessionId");
	const activeSession = sessions.find((s) => s.id === sessionId);

	// Filter checkins based on search term
	const filterCheckins = (checkins: ExtendedChildCheckin[]) => {
		if (!searchTerm) return checkins;

		return checkins.filter((checkin) => {
			const childName =
				`${checkin.child?.firstName} ${checkin.child?.lastName}`.toLowerCase();
			const guardianName =
				checkin.guardians && checkin.guardians.length > 0
					? `${checkin.guardians[0].firstName} ${checkin.guardians[0].lastName}`.toLowerCase()
					: "";

			return (
				childName.includes(searchTerm.toLowerCase()) ||
				guardianName.includes(searchTerm.toLowerCase())
			);
		});
	};

	const filteredCheckins = filterCheckins(checkins);
	const filteredCheckedOutToday = filterCheckins(checkedOutToday);

	// Calculate total active checkins across all sessions
	const totalActiveCheckins = sessions.reduce(
		(total, session) => total + session.activeCount,
		0,
	);

	return (
		<div className="container mx-auto py-8">
			<div className="flex justify-between items-center mb-6">
				<div>
					<h1 className="text-3xl font-bold">Child Check-in List</h1>
					{totalActiveCheckins > 0 && (
						<div className="text-md text-muted-foreground mt-1">
							<Badge variant="secondary" className="mr-2">
								{totalActiveCheckins}
							</Badge>
							{totalActiveCheckins === 1 ? "child" : "children"} currently
							checked in
						</div>
					)}
				</div>
				<Button
					onClick={() => navigate(`/churches/${organization}/childcheckin`)}
				>
					New Check-in
				</Button>
			</div>

			{sessions.length === 0 ? (
				<Card>
					<CardHeader>
						<CardTitle>No Active Sessions</CardTitle>
						<CardDescription>
							There are no active check-in sessions.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="mb-4">
							Create a new check-in session to get started.
						</p>
						<Button
							onClick={() => navigate(`/churches/${organization}/childcheckin`)}
						>
							Create Session
						</Button>
					</CardContent>
				</Card>
			) : (
				<>
					<Card className="mb-6">
						<CardHeader>
							<CardTitle>Session Information</CardTitle>
							<CardDescription>
								Select a session to view checked-in children.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<Label htmlFor="session-select">Select Session</Label>
									<Select
										value={sessionId || ""}
										onValueChange={handleSessionChange}
									>
										<SelectTrigger id="session-select" className="w-full">
											<SelectValue placeholder="Select a session" />
										</SelectTrigger>
										<SelectContent>
											{sessions.map((session) => (
												<SelectItem key={session.id} value={session.id}>
													{session.name}{" "}
													<span className="text-muted-foreground ml-1">
														(
														<Badge
															variant="outline"
															className="text-xs py-0 px-1 ml-1 font-normal"
														>
															{session.activeCount}
														</Badge>{" "}
														active)
													</span>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div>
									<Label htmlFor="search">Search Children</Label>
									<Input
										id="search"
										placeholder="Search by name..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
									/>
								</div>
							</div>
							<div className="flex items-center gap-2 mt-4">
								<Switch
									id="show-checked-out"
									checked={showCheckedOut}
									onCheckedChange={setShowCheckedOut}
								/>
								<Label htmlFor="show-checked-out">
									Show children checked out today
								</Label>
							</div>
						</CardContent>
					</Card>

					{sessionId && (
						<Card>
							<CardHeader>
								<div className="flex justify-between items-center">
									<div>
										<CardTitle>{activeSession.name}</CardTitle>
										<CardDescription>
											Started:{" "}
											{new Date(activeSession.startTime).toLocaleString()}
										</CardDescription>
										<CardDescription className="mt-1">
											<Badge variant="secondary" className="mr-1">
												{activeSession.activeCount}
											</Badge>
											{activeSession.activeCount === 1 ? "child" : "children"}{" "}
											checked in
										</CardDescription>
									</div>
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleRenameSession(activeSession)}
									>
										Rename Session
									</Button>
								</div>
							</CardHeader>
							<CardContent>
								{filteredCheckins.length === 0 ? (
									<div className="text-center py-8">
										No children checked in for this session.
									</div>
								) : (
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
										{filteredCheckins.map((checkin) => (
											<Card key={checkin.id} className="overflow-hidden">
												<div className="flex items-center p-4 border-b">
													<Avatar className="h-16 w-16 mr-4">
														<AvatarImage
															src={checkin.child?.photoUrl}
															alt={`${checkin.child?.firstName} ${checkin.child?.lastName}`}
														/>
														<AvatarFallback>
															{getInitials(
																checkin.child?.firstName,
																checkin.child?.lastName,
															)}
														</AvatarFallback>
													</Avatar>
													<div>
														<h3 className="font-bold text-lg">
															{checkin.child?.firstName}{" "}
															{checkin.child?.lastName}
														</h3>
														<p className="text-sm text-muted-foreground">
															Checked in:{" "}
															{new Date(
																checkin.checkinTime,
															).toLocaleTimeString()}
														</p>
														<Badge className="mt-1">Checked In</Badge>
													</div>
												</div>
												<CardContent className="p-4">
													{checkin.child?.allergies && (
														<div className="mb-2">
															<span className="font-medium">Allergies:</span>{" "}
															{checkin.child?.allergies}
														</div>
													)}
													{checkin.child?.specialNotes && (
														<div className="mb-2">
															<span className="font-medium">Notes:</span>{" "}
															{checkin.child?.specialNotes}
														</div>
													)}
													<div className="mt-4">
														<h4 className="font-medium mb-2">Guardian:</h4>
														{checkin.guardians &&
														checkin.guardians.length > 0 ? (
															<div className="flex items-center">
																<Avatar className="h-10 w-10 mr-2">
																	<AvatarImage
																		src={checkin.guardians[0].photoUrl}
																		alt={`${checkin.guardians[0].firstName} ${checkin.guardians[0].lastName}`}
																	/>
																	<AvatarFallback>
																		{getInitials(
																			checkin.guardians[0].firstName,
																			checkin.guardians[0].lastName,
																		)}
																	</AvatarFallback>
																</Avatar>
																<div>
																	{checkin.guardians[0].firstName}{" "}
																	{checkin.guardians[0].lastName}
																	{checkin.guardians[0].phone && (
																		<div className="text-sm text-muted-foreground">
																			{checkin.guardians[0].phone}
																		</div>
																	)}
																</div>
															</div>
														) : (
															<div>No guardian information available</div>
														)}
													</div>

													{checkin.authorizedPickupPersons &&
														checkin.authorizedPickupPersons.length > 0 && (
															<div className="mt-4">
																<h4 className="font-medium mb-2">
																	Authorized for Pickup:
																</h4>
																<ul className="text-sm">
																	{checkin.authorizedPickupPersons.map(
																		(person) => (
																			<li key={person.id}>
																				{person.firstName} {person.lastName} (
																				{person.relationship})
																			</li>
																		),
																	)}
																</ul>
															</div>
														)}
												</CardContent>
												<CardFooter className="bg-muted/20 p-4">
													{checkin.status === "checked-out" ? (
														<div className="w-full text-center p-2 bg-green-100 text-green-800 rounded flex items-center justify-center">
															<svg
																xmlns="http://www.w3.org/2000/svg"
																className="h-5 w-5 mr-2"
																viewBox="0 0 20 20"
																fill="currentColor"
																aria-hidden="true"
																role="img"
															>
																<title>Checked Out Icon</title>
																<path
																	fillRule="evenodd"
																	d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
																	clipRule="evenodd"
																/>
															</svg>
															Checked Out{" "}
															{checkin.checkoutTime
																? `at ${new Date(checkin.checkoutTime).toLocaleTimeString()}`
																: ""}
														</div>
													) : (
														<Button
															className="w-full"
															disabled={
																loading ||
																(processingCheckinId !== null &&
																	processingCheckinId !== checkin.id)
															}
															onClick={() => {
																if (
																	checkin.guardians &&
																	checkin.guardians.length > 0
																) {
																	handleCheckout(
																		checkin.id,
																		checkin.guardians[0].id,
																	);
																} else {
																	toast({
																		title: "Error",
																		description:
																			"No guardian information available for checkout",
																		variant: "destructive",
																	});
																}
															}}
														>
															{loading && processingCheckinId === checkin.id ? (
																<>
																	<svg
																		className="animate-spin -ml-1 mr-3 h-4 w-4"
																		xmlns="http://www.w3.org/2000/svg"
																		fill="none"
																		viewBox="0 0 24 24"
																		aria-hidden="true"
																		role="img"
																	>
																		<title>Loading Spinner</title>
																		<circle
																			className="opacity-25"
																			cx="12"
																			cy="12"
																			r="10"
																			stroke="currentColor"
																			strokeWidth="4"
																		/>
																		<path
																			className="opacity-75"
																			fill="currentColor"
																			d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
																		/>
																	</svg>
																	Processing...
																</>
															) : (
																"Check Out"
															)}
														</Button>
													)}
												</CardFooter>
											</Card>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					)}

					{showCheckedOut && sessionId && (
						<>
							<div className="mt-8 mb-4">
								<h3 className="text-xl font-bold">
									Checked-out Children Today
									<span className="ml-2">
										<Badge variant="outline">
											{filteredCheckedOutToday.length}
										</Badge>
									</span>
								</h3>
								<p className="text-muted-foreground">
									These children have already been checked out today.
								</p>
							</div>

							{filteredCheckedOutToday.length === 0 ? (
								<div className="flex justify-center items-center p-8 bg-muted/20 rounded-lg">
									<p className="text-muted-foreground">
										No children have been checked out today.
									</p>
								</div>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{filteredCheckedOutToday.map((checkin) => (
										<Card
											key={checkin.id}
											className="overflow-hidden bg-muted/10"
										>
											<CardContent className="p-4">
												<div className="flex items-center gap-4 mb-4">
													<div
														className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-lg"
														aria-hidden="true"
													>
														{getInitials(
															checkin.child?.firstName,
															checkin.child?.lastName,
														)}
													</div>
													<div>
														<h3 className="font-bold">
															{checkin.child?.firstName}{" "}
															{checkin.child?.lastName}
														</h3>
														<p className="text-sm text-muted-foreground">
															{checkin.child?.dateOfBirth
																? `${calculateAge(
																		new Date(checkin.child.dateOfBirth),
																	)} years old`
																: "Age unknown"}
														</p>
													</div>
												</div>

												{checkin.checkoutTime && (
													<p className="text-sm text-muted-foreground mb-2">
														<span className="font-medium">Checked out:</span>{" "}
														{new Date(
															checkin.checkoutTime,
														).toLocaleTimeString()}
													</p>
												)}

												<div className="mb-2">
													<h4 className="font-medium mb-1">Checked out by:</h4>
													<div className="flex items-center gap-2">
														{checkin.guardians &&
														checkin.guardians.length > 0 ? (
															<div>
																{checkin.guardians[0].firstName}{" "}
																{checkin.guardians[0].lastName}
																{checkin.guardians[0].phone && (
																	<div className="text-sm text-muted-foreground">
																		{checkin.guardians[0].phone}
																	</div>
																)}
															</div>
														) : (
															<div>No guardian information available</div>
														)}
													</div>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							)}
						</>
					)}
				</>
			)}

			{/* Rename Session Dialog */}
			<RenameSessionDialog
				isOpen={isRenameDialogOpen}
				onClose={() => {
					setIsRenameDialogOpen(false);
					setSessionToRename(null);
				}}
				session={sessionToRename}
			/>
		</div>
	);
}
