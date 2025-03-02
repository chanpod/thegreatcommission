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
	sessions: CheckinSession[];
	checkins: ExtendedChildCheckin[];
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
				error: "Invalid organization",
			},
			{ status: 400 },
		);
	}

	try {
		const sessions =
			await childCheckinService.getActiveCheckinSessions(organization);

		// If there are sessions, fetch checkins for the first session
		let checkins = [];
		if (sessions.length > 0 && sessionId) {
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
		}

		return data({
			sessions,
			checkins,
		});
	} catch (error) {
		console.error("Error loading data:", error);
		return data(
			{
				sessions: [],
				checkins: [],
				error: "Failed to load check-in data",
			},
			{ status: 500 },
		);
	}
});

// Define the action data type
interface ActionData {
	success: boolean;
	checkins?: ExtendedChildCheckin[];
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
				message: "Child has been successfully checked out",
				checkins,
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
		error,
	} = loaderData;
	const fetcher = useFetcher<ActionData>();

	const checkins = fetcher.data?.checkins || initialCheckins;

	const [searchTerm, setSearchTerm] = useState("");
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
		} else if (fetcher.data && !fetcher.data.success && fetcher.data.error) {
			toast({
				title: "Error",
				description: fetcher.data.error,
				variant: "destructive",
			});
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

		fetcher.submit(formData, { method: "post" });
	};

	const handleRenameSession = (session: { id: string; name: string }) => {
		setSessionToRename(session);
		setIsRenameDialogOpen(true);
	};

	// Get initials for avatar fallback
	const getInitials = (firstName?: string, lastName?: string) => {
		return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
	};

	const sessionId = searchParams.get("sessionId");
	const activeSession = sessions.find((s) => s.id === sessionId);
	const filteredCheckins = checkins.filter((checkin) => {
		if (!checkin.child) return false;

		const childName =
			`${checkin.child.firstName} ${checkin.child.lastName}`.toLowerCase();
		return childName.includes(searchTerm.toLowerCase());
	});

	return (
		<div className="container mx-auto py-8">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold">Child Check-in List</h1>
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
													{session.name}
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
													<Button
														className="w-full"
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
														Check Out
													</Button>
												</CardFooter>
											</Card>
										))}
									</div>
								)}
							</CardContent>
						</Card>
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
