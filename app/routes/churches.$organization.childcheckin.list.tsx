import { useEffect, useState } from "react";
import {
	useFetcher,
	useLoaderData,
	useNavigate,
	useParams,
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

import type {
	AuthorizedPickupPerson,
	ChildCheckin,
	Room,
	User,
} from "@/server/db/schema";
import {
	ArrowRightCircle,
	CheckIcon,
	InfoIcon,
	MessageSquare,
	Search,
	X,
} from "lucide-react";
import { data } from "react-router";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { createAuthLoader } from "~/server/auth/authLoader";

// Define extended types for the checkin data with additional properties
interface ExtendedChildCheckin extends ChildCheckin {
	guardians?: User[];
	authorizedPickupPersons?: AuthorizedPickupPerson[];
	child?: {
		id: string;
		firstName: string;
		lastName: string;
		dateOfBirth?: Date;
		allergies?: string;
		specialNotes?: string;
		photoUrl?: string;
		familyId?: string;
	};
	checkedOutBy?: {
		id: string;
		firstName?: string;
		lastName?: string;
	} | null;
}

// Define the loader data type
interface LoaderData {
	rooms: (Room & { activeCount: number })[];
	checkins: ExtendedChildCheckin[];
	checkedOutToday: ExtendedChildCheckin[];
	error?: string;
}

// Add this helper function somewhere appropriate in the file, like near the top or with other utility functions
export function formatAge(ageInMonths: number): string {
	if (ageInMonths < 12) {
		return `${ageInMonths} ${ageInMonths === 1 ? 'month' : 'months'}`;
	} else if (ageInMonths < 36) {
		const years = Math.floor(ageInMonths / 12);
		const months = ageInMonths % 12;

		if (months === 0) {
			return `${years} ${years === 1 ? 'year' : 'years'}`;
		} else {
			return `${years} ${years === 1 ? 'year' : 'years'} ${months} ${months === 1 ? 'month' : 'months'}`;
		}
	} else {
		const years = Math.round(ageInMonths / 12);
		return `${years} ${years === 1 ? 'year' : 'years'}`;
	}
}

// Loader to fetch rooms and checkins
export const loader = createAuthLoader(async ({ params, request }) => {
	const { organization } = params;
	const searchParams = new URLSearchParams(request.url.split("?")[1]);
	const roomId = searchParams.get("roomId");

	if (!organization) {
		return data(
			{
				rooms: [],
				checkins: [],
				checkedOutToday: [],
				error: "Invalid organization",
			},
			{ status: 400 },
		);
	}

	try {
		// Get active rooms
		const rooms = await childCheckinService.getActiveRooms(organization);

		// Get active checkins for the selected room or the first room
		let checkins: ExtendedChildCheckin[] = [];
		let checkedOutToday: ExtendedChildCheckin[] = [];
		let selectedRoomId = roomId;

		// If no room is selected but rooms exist, use the first one
		if (!selectedRoomId && rooms.length > 0) {
			selectedRoomId = rooms[0].id;
		}

		if (selectedRoomId) {
			// Get active checkins for the selected room
			checkins = await childCheckinService.getActiveCheckins(selectedRoomId);

			// Get checked out children for today
			checkedOutToday =
				await childCheckinService.getCheckedOutChildrenToday(selectedRoomId);

			// For each checkin, fetch the family information
			for (const checkin of checkins) {
				if (checkin.child?.familyId) {
					const familyData =
						await childCheckinService.getFamilyWithChildrenAndGuardians(
							checkin.child.familyId,
						);
					if (familyData) {
						(checkin as ExtendedChildCheckin).guardians = familyData.guardians;
					}
				}

				// Fetch authorized pickup persons
				const pickupPersons =
					await childCheckinService.getAuthorizedPickupPersons(checkin.id);
				(checkin as ExtendedChildCheckin).authorizedPickupPersons =
					pickupPersons;
			}

			// For each checked out checkin, fetch the family information
			for (const checkin of checkedOutToday) {
				if (checkin.child?.familyId) {
					const familyData =
						await childCheckinService.getFamilyWithChildrenAndGuardians(
							checkin.child.familyId,
						);
					if (familyData) {
						(checkin as ExtendedChildCheckin).guardians = familyData.guardians;
					}
				}

				// Fetch authorized pickup persons
				const pickupPersons =
					await childCheckinService.getAuthorizedPickupPersons(checkin.id);
				(checkin as ExtendedChildCheckin).authorizedPickupPersons =
					pickupPersons;
			}
		}

		// For each room, get the count of active check-ins
		const roomsWithCounts = await Promise.all(
			rooms.map(async (room) => {
				const activeCount = await childCheckinService.getActiveCheckinsCount(
					room.id,
				);
				return {
					...room,
					activeCount,
				};
			}),
		);

		return data({
			rooms: roomsWithCounts,
			checkins,
			checkedOutToday,
		});
	} catch (error) {
		console.error("Error in child checkin list loader:", error);
		return data(
			{
				rooms: [],
				checkins: [],
				checkedOutToday: [],
				error: "An error occurred while loading data",
			},
			{ status: 500 },
		);
	}
});

// Define the action data type
interface ActionData {
	success: boolean;
	action?: string;
	checkins?: ExtendedChildCheckin[];
	checkedOutToday?: ExtendedChildCheckin[];
	rooms?: Room[];
	message?: string;
	error?: string;
}

// Action to handle form submissions
export const action = createAuthLoader(async ({ params, request }) => {
	const { organization } = params;

	if (!organization) {
		return data(
			{ success: false, error: "Invalid organization" },
			{ status: 400 },
		);
	}

	const formData = await request.formData();
	const action = formData.get("_action");

	try {
		if (action === "checkout") {
			const checkinId = formData.get("checkinId");
			const userId = formData.get("userId");
			const roomId = formData.get("roomId");

			if (!checkinId || !userId || !roomId) {
				return data(
					{ success: false, error: "Missing required fields" },
					{ status: 400 },
				);
			}

			await childCheckinService.checkoutChild(
				checkinId.toString(),
				userId.toString(),
			);

			// Fetch updated checkins list
			const checkins = await childCheckinService.getActiveCheckins(
				roomId.toString(),
			);

			// Fetch today's checked out children
			const checkedOutToday =
				await childCheckinService.getCheckedOutChildrenToday(roomId.toString());

			// For each checkin, fetch the family information
			for (const checkin of checkins) {
				if (checkin.child?.familyId) {
					const familyData =
						await childCheckinService.getFamilyWithChildrenAndGuardians(
							checkin.child.familyId,
						);
					if (familyData) {
						(checkin as ExtendedChildCheckin).guardians = familyData.guardians;
					}
				}

				// Fetch authorized pickup persons
				const pickupPersons =
					await childCheckinService.getAuthorizedPickupPersons(checkin.id);
				(checkin as ExtendedChildCheckin).authorizedPickupPersons =
					pickupPersons;
			}

			// For each checked out checkin, fetch the family information
			for (const checkin of checkedOutToday) {
				if (checkin.child?.familyId) {
					const familyData =
						await childCheckinService.getFamilyWithChildrenAndGuardians(
							checkin.child.familyId,
						);
					if (familyData) {
						(checkin as ExtendedChildCheckin).guardians = familyData.guardians;
					}
				}

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
				action: "checkout",
				checkedOutToday,
			});
		}

		if (action === "renameRoom") {
			const roomId = formData.get("roomId");
			const newName = formData.get("newName");

			if (!roomId || !newName) {
				return data(
					{ success: false, error: "Room ID and new name are required" },
					{ status: 400 },
				);
			}

			const updatedRoom = await childCheckinService.updateRoomName(
				roomId.toString(),
				newName.toString(),
			);

			// Fetch updated rooms list
			const rooms = await childCheckinService.getActiveRooms(organization);

			// For each room, get the count of active check-ins
			const roomsWithCounts = await Promise.all(
				rooms.map(async (room) => {
					const activeCount = await childCheckinService.getActiveCheckinsCount(
						room.id,
					);
					return {
						...room,
						activeCount,
					};
				}),
			);

			return data({
				success: true,
				message: "Room has been successfully renamed",
				rooms: roomsWithCounts,
			});
		}

		// Move child to different room
		if (action === "moveToRoom") {
			const checkinId = formData.get("checkinId");
			const newRoomId = formData.get("newRoomId");

			if (!checkinId || !newRoomId) {
				return data(
					{ success: false, error: "Check-in ID and new room ID are required" },
					{ status: 400 },
				);
			}

			const result = await childCheckinService.updateChildRoom(
				checkinId.toString(),
				newRoomId.toString(),
			);

			if (!result.success) {
				return data({ success: false, error: result.message }, { status: 400 });
			}

			// Fetch updated checkins list for both the old and new rooms
			const currentRoomId = formData.get("currentRoomId") || newRoomId;
			const checkins = await childCheckinService.getActiveCheckins(
				currentRoomId.toString(),
			);

			// Fetch today's checked out children
			const checkedOutToday =
				await childCheckinService.getCheckedOutChildrenToday(
					currentRoomId.toString(),
				);

			// For each checkin, fetch the family information
			for (const checkin of checkins) {
				if (checkin.child?.familyId) {
					const familyData =
						await childCheckinService.getFamilyWithChildrenAndGuardians(
							checkin.child.familyId,
						);
					if (familyData) {
						(checkin as ExtendedChildCheckin).guardians = familyData.guardians;
					}
				}

				// Fetch authorized pickup persons
				const pickupPersons =
					await childCheckinService.getAuthorizedPickupPersons(checkin.id);
				(checkin as ExtendedChildCheckin).authorizedPickupPersons =
					pickupPersons;
			}

			// Get updated rooms list with count
			const rooms = await childCheckinService.getActiveRooms(organization);
			for (const room of rooms) {
				const count = await childCheckinService.getActiveCheckinsCount(room.id);
				(room as any).activeCount = count;
			}

			return data({
				success: true,
				message: "Child has been moved to new room",
				checkins,
				checkedOutToday,
				rooms,
			});
		}

		return data({ success: false, error: "Invalid action" }, { status: 400 });
	} catch (error) {
		console.error("Error in child checkin list action:", error);
		return data(
			{
				success: false,
				error: "An error occurred while processing your request",
			},
			{ status: 500 },
		);
	}
});

// Rename Room Dialog Component
function RenameRoomDialog({ isOpen, onClose, room }: RenameRoomDialogProps) {
	const [newName, setNewName] = useState("");
	const fetcher = useFetcher();

	const { organization } = useParams();

	useEffect(() => {
		if (room) {
			setNewName(room.name);
		}
	}, [room]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (room && newName) {
			const formData = new FormData();
			formData.append("_action", "renameRoom");
			formData.append("roomId", room.id);
			formData.append("newName", newName);
			fetcher.submit(formData, { method: "post" });
			onClose();
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Rename Room</DialogTitle>
					<DialogDescription>Enter a new name for this room.</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="newRoomName">Room Name</Label>
							<Input
								id="newRoomName"
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								required
							/>
						</div>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit">Save Changes</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// Move Room Dialog Component
interface MoveRoomDialogProps {
	isOpen: boolean;
	onClose: () => void;
	checkin: ExtendedChildCheckin | null;
	rooms: any[];
	currentRoomId: string;
	onMove: (checkinId: string, newRoomId: string) => void;
}

function MoveRoomDialog({
	isOpen,
	onClose,
	checkin,
	rooms,
	currentRoomId,
	onMove,
}: MoveRoomDialogProps) {
	const [selectedRoomId, setSelectedRoomId] = useState("");

	// Reset selected room when dialog opens with a new checkin
	useEffect(() => {
		if (isOpen && checkin) {
			setSelectedRoomId("");
		}
	}, [isOpen, checkin]);

	// Filter out the current room
	const availableRooms = rooms.filter((room) => room.id !== currentRoomId);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Move Child to Different Room</DialogTitle>
					<DialogDescription>
						Select a new room for {checkin?.child?.firstName}{" "}
						{checkin?.child?.lastName}
					</DialogDescription>
				</DialogHeader>
				<div className="py-4">
					<h3 className="text-sm font-medium mb-2">Available Rooms</h3>
					<div className="space-y-2">
						{availableRooms.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								No other rooms available. Please create a new room first.
							</p>
						) : (
							availableRooms.map((room) => (
								<div
									key={room.id}
									className={`p-3 border rounded-md cursor-pointer ${selectedRoomId === room.id
										? "border-primary bg-primary/5"
										: "hover:bg-muted/50"
										}`}
									onClick={() => setSelectedRoomId(room.id)}
								>
									<div className="flex justify-between items-center">
										<div>
											<div className="font-medium">{room.name}</div>
											<div className="text-sm text-muted-foreground">
												{room.minAge !== null && room.maxAge !== null ? (
													<span>
														Ages: {room.minAge}-{room.maxAge} months
													</span>
												) : room.minAge !== null ? (
													<span>Ages: {room.minAge}+ months</span>
												) : room.maxAge !== null ? (
													<span>Ages: Up to {room.maxAge} months</span>
												) : (
													<span>All ages</span>
												)}
											</div>
											<div className="text-sm text-muted-foreground">
												{room.activeCount} children checked in
											</div>
										</div>
										{selectedRoomId === room.id && (
											<CheckIcon className="h-4 w-4 text-primary" />
										)}
									</div>
								</div>
							))
						)}
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button
						onClick={() => {
							if (checkin && selectedRoomId) {
								onMove(checkin.id, selectedRoomId);
							}
						}}
						disabled={!selectedRoomId || !checkin}
					>
						Move to Room
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default function ChildCheckinList() {
	const loaderData = useLoaderData<LoaderData>();
	const { rooms, checkins, checkedOutToday, error } = loaderData;
	const navigate = useNavigate();

	const fetcher = useFetcher();

	const [searchParams, setSearchParams] = useSearchParams();
	const roomId = searchParams.get("roomId");
	const activeRoom = rooms.find((r) => r.id === roomId);
	const params = useParams();

	const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
	const [roomToRename, setRoomToRename] = useState<{
		id: string;
		name: string;
	} | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
	const [checkinToCheckout, setCheckinToCheckout] =
		useState<ExtendedChildCheckin | null>(null);
	const [messageDialogOpen, setMessageDialogOpen] = useState(false);
	const [messageText, setMessageText] = useState("");
	const [messageRecipient, setMessageRecipient] = useState<{
		name: string;
		phone: string;
	} | null>(null);
	const [showMoveRoomDialog, setShowMoveRoomDialog] = useState(false);
	const [checkinToMove, setCheckinToMove] =
		useState<ExtendedChildCheckin | null>(null);

	// Handle room change
	const handleRoomChange = (roomId: string) => {
		setSearchParams({ roomId });
	};

	// Handle checkout
	const handleCheckout = (checkinId: string, userId: string) => {
		// Make sure we have a checkin to work with
		if (!checkinToCheckout) {
			toast.error("Unable to find check-in record");
			return;
		}

		const formData = new FormData();
		formData.append("_action", "checkout");
		formData.append("checkinId", checkinId);
		formData.append("userId", userId);

		// Use the roomId from the checkin record itself, rather than from URL params
		// This ensures we always have a valid roomId
		formData.append("roomId", checkinToCheckout.roomId);

		// Submit the form but don't close the dialog yet - we'll wait for the request to complete
		fetcher.submit(formData, { method: "post" });
	};

	// Monitor fetcher state for checkout actions
	useEffect(() => {
		// Check if fetcher has completed a request and it was a checkout action
		if (fetcher.data?.success && fetcher.data.action === "checkout") {
			const formAction = fetcher.formData?.get("_action");

			// If it was a checkout action and it was successful, close the dialog
			if (formAction === "checkout") {
				// Close the dialog and reset state
				setShowCheckoutDialog(false);
				setCheckinToCheckout(null);

				// Show success message
				toast.success("Child checked out successfully");
			}
		} else if (
			fetcher.state === "idle" &&
			fetcher.data &&
			!fetcher.data.success
		) {
			// If the checkout failed, show an error message but keep the dialog open
			if (fetcher.formData?.get("_action") === "checkout") {
				toast.error(fetcher.data.error || "Failed to check out child");
			}
		}
	}, [fetcher.state, fetcher.data, fetcher.formData]);

	// Handle move room
	const handleMoveToRoom = (checkinId: string, newRoomId: string) => {
		const formData = new FormData();
		formData.append("_action", "moveToRoom");
		formData.append("checkinId", checkinId);
		formData.append("newRoomId", newRoomId);
		formData.append("currentRoomId", roomId || "");
		fetcher.submit(formData, { method: "post" });
		setShowMoveRoomDialog(false);
		setCheckinToMove(null);
	};

	// Handle rename room
	const handleRenameRoom = (room: { id: string; name: string }) => {
		setRoomToRename(room);
		setIsRenameDialogOpen(true);
	};

	// Get initials for avatar
	const getInitials = (firstName?: string, lastName?: string) => {
		if (!firstName || !lastName) return "?";
		return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
	};

	// Calculate age from date of birth
	const calculateAge = (dateOfBirth: Date): number => {
		if (!dateOfBirth) return 0;

		const dob = new Date(dateOfBirth);
		const today = new Date();

		// Calculate age in months
		const monthDiff =
			(today.getFullYear() - dob.getFullYear()) * 12 +
			(today.getMonth() - dob.getMonth());

		return monthDiff;
	};

	// Filter checkins based on search term
	const filterCheckins = (checkins: ExtendedChildCheckin[]) => {
		if (!searchTerm) return checkins;

		return checkins.filter((checkin) => {
			const childName =
				`${checkin.child?.firstName} ${checkin.child?.lastName}`.toLowerCase();
			const guardianNames = checkin.guardians
				?.map((g) => `${g.firstName} ${g.lastName}`.toLowerCase())
				.join(" ");

			return (
				childName.includes(searchTerm.toLowerCase()) ||
				(guardianNames && guardianNames.includes(searchTerm.toLowerCase()))
			);
		});
	};



	return (
		<div className="container mx-auto py-8">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold">Child Check-in List</h1>
				<Button
					onClick={() =>
						navigate(`/churches/${params.organization}/childcheckin`)
					}
				>
					New Check-in
				</Button>
			</div>

			{rooms.length === 0 ? (
				<Card>
					<CardHeader>
						<CardTitle>No Active Rooms</CardTitle>
						<CardDescription>
							There are no active check-in rooms. Please create a room first.
						</CardDescription>
					</CardHeader>
					<CardFooter>
						<Button
							onClick={() =>
								navigate(`/churches/${params.organization}/childcheckin`)
							}
						>
							Create a Room
						</Button>
					</CardFooter>
				</Card>
			) : (
				<>
					<div className="flex flex-col md:flex-row gap-4 mb-6">
						<div className="w-full md:w-1/3">
							<Card>
								<CardHeader>
									<CardTitle>Rooms</CardTitle>
									<CardDescription>
										Select a room to view checked-in children
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-2">
										<Label htmlFor="roomSelect">Select Room</Label>
										<Select
											value={roomId || rooms[0]?.id || ""}
											onValueChange={handleRoomChange}
										>
											<SelectTrigger id="roomSelect">
												<SelectValue placeholder="Select a room" />
											</SelectTrigger>
											<SelectContent>
												{rooms.map((room) => (
													<SelectItem key={room.id} value={room.id}>
														{room.name}{" "}
														<span className="text-muted-foreground">
															({room.activeCount})
														</span>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									{activeRoom && (
										<div className="mt-4">
											<div className="flex justify-between items-center">
												<h3 className="text-lg font-medium">
													{activeRoom.name}
												</h3>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleRenameRoom(activeRoom)}
												>
													Rename
												</Button>
											</div>
											<div className="text-sm text-muted-foreground mt-1">
												{activeRoom.minAge !== null &&
													activeRoom.maxAge !== null ? (
													<span>
														Ages: {formatAge(activeRoom.minAge)}-{formatAge(activeRoom.maxAge)}
													</span>
												) : activeRoom.minAge !== null ? (
													<span>Ages: {formatAge(activeRoom.minAge)}+</span>
												) : activeRoom.maxAge !== null ? (
													<span>Ages: Up to {formatAge(activeRoom.maxAge)}</span>
												) : (
													<span>All ages</span>
												)}
											</div>
											<div className="text-sm text-muted-foreground">
												Started:{" "}
												{new Date(activeRoom.startTime).toLocaleString()}
											</div>
											<div className="mt-2">
												<Badge variant="secondary">
													{activeRoom.activeCount} active check-ins
												</Badge>
											</div>
										</div>
									)}

									<div className="mt-6">
										<h3 className="text-lg font-medium mb-2">All Rooms</h3>
										<div className="space-y-2">
											{rooms.map((room) => (
												<div
													key={room.id}
													className={`p-3 border rounded-md cursor-pointer ${room.id === roomId
														? "border-primary bg-primary/5"
														: "hover:bg-muted/50"
														}`}
													onClick={() => handleRoomChange(room.id)}
												>
													<div className="flex justify-between items-center">
														<div>
															<div className="font-medium">{room.name}</div>
															<div className="text-sm text-muted-foreground">
																{room.activeCount} children
															</div>
														</div>
														{room.activeCount > 0 && (
															<Badge variant="outline">
																{room.activeCount}
															</Badge>
														)}
													</div>
												</div>
											))}
										</div>
									</div>
								</CardContent>
							</Card>
						</div>

						<div className="w-full md:w-2/3">
							<Card>
								<CardHeader>
									<CardTitle>
										{activeRoom ? `${activeRoom.name} Check-ins` : "Check-ins"}
									</CardTitle>
									<CardDescription>
										{checkins.length} active check-ins
										{checkedOutToday.length > 0 &&
											`, ${checkedOutToday.length} checked out today`}
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="relative mb-4">
										<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
										<Input
											placeholder="Search by child or guardian name"
											className="pl-8"
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
										/>
										{searchTerm && (
											<Button
												variant="ghost"
												size="sm"
												className="absolute right-1 top-1 h-7 w-7 p-0"
												onClick={() => setSearchTerm("")}
											>
												<X className="h-4 w-4" />
											</Button>
										)}
									</div>

									<Tabs defaultValue="active">
										<TabsList className="mb-4">
											<TabsTrigger value="active">
												Active ({filterCheckins(checkins).length})
											</TabsTrigger>
											<TabsTrigger value="checked-out">
												Checked Out Today (
												{filterCheckins(checkedOutToday).length})
											</TabsTrigger>
										</TabsList>

										<TabsContent value="active">
											{filterCheckins(checkins).length === 0 ? (
												<div className="text-center py-8 text-muted-foreground">
													{searchTerm
														? "No matching check-ins found"
														: "No active check-ins for this room"}
												</div>
											) : (
												<div className="space-y-4">
													{filterCheckins(checkins).map((checkin) => (
														<Card key={checkin.id}>
															<CardContent className="p-4">
																<div className="flex justify-between items-start">
																	<div className="flex items-start space-x-4">
																		<Avatar className="h-12 w-12">
																			{checkin.child?.photoUrl ? (
																				<AvatarImage
																					src={checkin.child.photoUrl}
																					alt={`${checkin.child?.firstName} ${checkin.child?.lastName}`}
																				/>
																			) : (
																				<AvatarFallback>
																					{getInitials(
																						checkin.child?.firstName,
																						checkin.child?.lastName,
																					)}
																				</AvatarFallback>
																			)}
																		</Avatar>
																		<div>
																			<h3 className="font-medium">
																				{checkin.child?.firstName}{" "}
																				{checkin.child?.lastName}
																			</h3>
																			{checkin.child?.dateOfBirth && (
																				<p className="text-sm text-muted-foreground">
																					Age:{" "}
																					{calculateAge(
																						checkin.child.dateOfBirth,
																					) >= 24
																						? `${Math.floor(calculateAge(checkin.child.dateOfBirth) / 12)} years`
																						: `${calculateAge(checkin.child.dateOfBirth)} months`}
																				</p>
																			)}
																			{checkin.child?.allergies && (
																				<p className="text-sm text-red-500">
																					Allergies: {checkin.child.allergies}
																				</p>
																			)}
																			{checkin.child?.specialNotes && (
																				<div className="flex items-center text-sm text-amber-600 mt-1">
																					<InfoIcon className="h-3 w-3 mr-1" />
																					<span>Has special notes</span>
																				</div>
																			)}
																			<p className="text-sm text-muted-foreground mt-1">
																				Checked in:{" "}
																				{new Date(
																					checkin.checkinTime,
																				).toLocaleTimeString()}
																			</p>
																		</div>
																	</div>
																	<div className="space-x-2">
																		<Button
																			variant="outline"
																			size="sm"
																			className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
																			onClick={() => {
																				setCheckinToMove(checkin);
																				setShowMoveRoomDialog(true);
																			}}
																		>
																			Change Room
																		</Button>
																		<Button
																			variant="outline"
																			size="sm"
																			className="text-red-600 hover:text-red-700 hover:bg-red-50"
																			onClick={() => {
																				setCheckinToCheckout(checkin);
																				setShowCheckoutDialog(true);
																			}}
																		>
																			Check Out
																		</Button>
																	</div>
																</div>

																<div className="mt-4 pt-4 border-t">
																	<h4 className="text-sm font-medium mb-2">
																		Guardians
																	</h4>
																	<div className="space-y-2">
																		{checkin.guardians?.map((user) => (
																			<div
																				key={user.id}
																				className="flex justify-between items-center"
																			>
																				<div className="flex items-center space-x-2">
																					<Avatar className="h-8 w-8">
																						{user.photoUrl ? (
																							<AvatarImage
																								src={user.photoUrl}
																								alt={`${user.firstName} ${user.lastName}`}
																							/>
																						) : (
																							<AvatarFallback>
																								{getInitials(
																									user.firstName,
																									user.lastName,
																								)}
																							</AvatarFallback>
																						)}
																					</Avatar>
																					<div>
																						<p className="text-sm font-medium">
																							{user.firstName} {user.lastName}
																						</p>
																						{user.phone && (
																							<p className="text-xs text-muted-foreground">
																								{user.phone}
																							</p>
																						)}
																					</div>
																				</div>
																				{user.phone && (
																					<Button
																						variant="ghost"
																						size="sm"
																						onClick={() => {
																							setMessageRecipient({
																								name: `${user.firstName} ${user.lastName}`,
																								phone: user.phone,
																							});
																							setMessageDialogOpen(true);
																						}}
																					>
																						<MessageSquare className="h-4 w-4" />
																					</Button>
																				)}
																			</div>
																		))}
																	</div>

																	{checkin.authorizedPickupPersons &&
																		checkin.authorizedPickupPersons.length >
																		0 && (
																			<div className="mt-4">
																				<h4 className="text-sm font-medium mb-2">
																					Authorized for Pickup
																				</h4>
																				<div className="space-y-1">
																					{checkin.authorizedPickupPersons.map(
																						(person) => (
																							<div
																								key={person.id}
																								className="text-sm"
																							>
																								{person.firstName}{" "}
																								{person.lastName} (
																								{person.relationship})
																							</div>
																						),
																					)}
																				</div>
																			</div>
																		)}
																</div>
															</CardContent>
														</Card>
													))}
												</div>
											)}
										</TabsContent>

										<TabsContent value="checked-out">
											{filterCheckins(checkedOutToday).length === 0 ? (
												<div className="text-center py-8 text-muted-foreground">
													{searchTerm
														? "No matching checked-out children found"
														: "No children have been checked out today"}
												</div>
											) : (
												<div className="space-y-4">
													{filterCheckins(checkedOutToday).map((checkin) => (
														<Card key={checkin.id}>
															<CardContent className="p-4">
																<div className="flex justify-between items-start">
																	<div className="flex items-start space-x-4">
																		<Avatar className="h-12 w-12">
																			{checkin.child?.photoUrl ? (
																				<AvatarImage
																					src={checkin.child.photoUrl}
																					alt={`${checkin.child?.firstName} ${checkin.child?.lastName}`}
																				/>
																			) : (
																				<AvatarFallback>
																					{getInitials(
																						checkin.child?.firstName,
																						checkin.child?.lastName,
																					)}
																				</AvatarFallback>
																			)}
																		</Avatar>
																		<div>
																			<h3 className="font-medium">
																				{checkin.child?.firstName}{" "}
																				{checkin.child?.lastName}
																			</h3>
																			{checkin.child?.dateOfBirth && (
																				<p className="text-sm text-muted-foreground">
																					Age:{" "}
																					{calculateAge(
																						checkin.child.dateOfBirth,
																					)}{" "}
																					months
																				</p>
																			)}
																			<div className="flex items-center text-sm text-green-600 mt-1">
																				<ArrowRightCircle className="h-3 w-3 mr-1" />
																				<span>
																					Checked out:{" "}
																					{checkin.checkoutTime
																						? new Date(
																							checkin.checkoutTime,
																						).toLocaleTimeString()
																						: "Unknown"}
																					{checkin.checkedOutBy && (
																						<span className="ml-1">
																							by{" "}
																							{checkin.checkedOutBy.firstName ||
																								""}{" "}
																							{checkin.checkedOutBy.lastName ||
																								""}
																						</span>
																					)}
																				</span>
																			</div>
																		</div>
																	</div>
																</div>
															</CardContent>
														</Card>
													))}
												</div>
											)}
										</TabsContent>
									</Tabs>
								</CardContent>
							</Card>
						</div>
					</div>
				</>
			)}

			{/* Checkout Dialog */}
			<Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Check Out Child</DialogTitle>
						<DialogDescription>
							Are you sure you want to check out{" "}
							{checkinToCheckout?.child?.firstName}{" "}
							{checkinToCheckout?.child?.lastName}?
						</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<h3 className="text-sm font-medium mb-2">Select Guardian</h3>
						<div className="space-y-2">
							{checkinToCheckout?.guardians?.map((user) => (
								<div
									key={user.id}
									className="flex items-center justify-between p-2 border rounded-md"
								>
									<div className="flex items-center space-x-2">
										<Avatar className="h-8 w-8">
											{user.photoUrl ? (
												<AvatarImage
													src={user.photoUrl}
													alt={`${user.firstName} ${user.lastName}`}
												/>
											) : (
												<AvatarFallback>
													{getInitials(user.firstName, user.lastName)}
												</AvatarFallback>
											)}
										</Avatar>
										<div>
											<p className="text-sm font-medium">
												{user.firstName} {user.lastName}
											</p>
										</div>
									</div>
									<Button
										size="sm"
										onClick={() => {
											if (checkinToCheckout) {
												handleCheckout(checkinToCheckout.id, user.id);
											}
										}}
										disabled={
											fetcher.state !== "idle" &&
											fetcher.formData?.get("_action") === "checkout"
										}
									>
										{fetcher.state !== "idle" &&
											fetcher.formData?.get("_action") === "checkout" &&
											fetcher.formData.get("userId") === user.id
											? "Checking out..."
											: "Select"}
									</Button>
								</div>
							))}

							{checkinToCheckout?.authorizedPickupPersons &&
								checkinToCheckout.authorizedPickupPersons.length > 0 && (
									<>
										<h3 className="text-sm font-medium mt-4 mb-2">
											Authorized Pickup Persons
										</h3>
										<div className="text-sm text-muted-foreground">
											<p>
												The following people are authorized for pickup but are
												not in the system as guardians:
											</p>
											<ul className="list-disc pl-5 mt-2">
												{checkinToCheckout.authorizedPickupPersons.map(
													(person) => (
														<li key={person.id}>
															{person.firstName} {person.lastName} (
															{person.relationship})
														</li>
													),
												)}
											</ul>
										</div>
									</>
								)}
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowCheckoutDialog(false)}
							disabled={
								fetcher.state !== "idle" &&
								fetcher.formData?.get("_action") === "checkout"
							}
						>
							Cancel
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Message Dialog */}
			<Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Send Message</DialogTitle>
						<DialogDescription>
							Send a message to {messageRecipient?.name}
						</DialogDescription>
					</DialogHeader>
					<form>
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="message">Message</Label>
								<Textarea
									id="message"
									value={messageText}
									onChange={(e) => setMessageText(e.target.value)}
									placeholder="Enter your message here..."
									rows={5}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setMessageDialogOpen(false)}
							>
								Cancel
							</Button>
							<Button
								onClick={() => {
									// TODO: Implement message sending
									toast.success("Message sent successfully");
									setMessageDialogOpen(false);
									setMessageText("");
								}}
							>
								Send Message
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Rename Room Dialog */}
			<RenameRoomDialog
				isOpen={isRenameDialogOpen}
				onClose={() => setIsRenameDialogOpen(false)}
				room={roomToRename}
			/>

			{/* Move Room Dialog */}
			<MoveRoomDialog
				isOpen={showMoveRoomDialog}
				onClose={() => setShowMoveRoomDialog(false)}
				checkin={checkinToMove}
				rooms={rooms}
				currentRoomId={roomId || ""}
				onMove={handleMoveToRoom}
			/>
		</div>
	);
}
