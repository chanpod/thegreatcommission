import { useState, useRef, useEffect } from "react";
import {
	useParams,
	useNavigate,
	useLoaderData,
	useFetcher,
	useActionData,
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
import { Textarea } from "~/components/ui/textarea";
import { toast } from "sonner";
import { childCheckinService } from "../services/ChildCheckinService";
import { fileUploadService } from "../services/FileUploadService";
import { QRCodeSVG } from "qrcode.react";
import { createAuthLoader } from "~/server/auth/authLoader";
import { data, redirect } from "react-router";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Badge } from "~/components/ui/badge";
import { Checkbox } from "~/components/ui/checkbox";
import { formatAge } from "./churches.$organization.childcheckin.list";

// Loader to fetch initial data
export const loader = createAuthLoader(async ({ params }) => {
	const { organization } = params;

	if (!organization) {
		return data(
			{ success: false, error: "Invalid organization" },
			{ status: 400 },
		);
	}

	try {
		// Get active rooms
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
			rooms: roomsWithCounts,
		});
	} catch (error) {
		console.error("Error in child checkin loader:", error);
		return data(
			{
				success: false,
				error: "An error occurred while loading data",
			},
			{ status: 500 },
		);
	}
});

// Define the loader data type
type LoaderData = {
	sessions: Array<{
		id: string;
		name: string;
		startTime: string | Date;
		churchOrganizationId: string;
		activeCount: number;
	}>;
	error?: string;
};

// Session type
type Session = {
	id: string;
	name: string;
	startTime: string | Date;
	churchOrganizationId: string;
	activeCount: number;
};

// Define types for the component
type Room = {
	id: string;
	name: string;
	minAge?: number | null;
	maxAge?: number | null;
	startTime: string | Date;
	churchOrganizationId: string;
	activeCount: number;
};

type Child = {
	id: string;
	firstName: string;
	lastName: string;
	dateOfBirth: string | Date;
	allergies?: string;
	specialNotes?: string;
	photoUrl?: string;
	familyId?: string;
};

type User = {
	id: string;
	firstName: string;
	lastName: string;
	email?: string;
	phone?: string;
	photoUrl?: string;
};

type Family = {
	id: string;
	name: string;
	churchOrganizationId: string;
};

type FamilyWithDetails = {
	family: Family;
	children: Child[];
	guardians: User[];
};

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
		// Create room
		if (action === "createRoom") {
			const roomName = formData.get("roomName");
			const minAge = formData.get("minAge");
			const maxAge = formData.get("maxAge");

			if (!roomName) {
				return data(
					{ success: false, error: "Room name is required" },
					{ status: 400 },
				);
			}

			const roomData = {
				name: roomName.toString(),
				minAge: minAge ? Number.parseInt(minAge.toString()) : null,
				maxAge: maxAge ? Number.parseInt(maxAge.toString()) : null,
				churchOrganizationId: organization,
				startTime: new Date(),
				updatedAt: new Date(),
			};

			const newRoom = await childCheckinService.createRoom(roomData);
			return data({ success: true, room: newRoom });
		}

		// Search for family by phone number
		if (action === "searchFamily") {
			const phone = formData.get("phone");

			if (!phone) {
				return data(
					{
						success: false,
						error: "Phone number is required",
						action: "searchFamily",
					},
					{ status: 400 },
				);
			}

			// Find family by phone number
			const familyResult = await childCheckinService.findFamilyByPhone(
				phone.toString(),
				organization,
			);

			if (!familyResult) {
				return data(
					{
						success: false,
						error: "No family found with this phone number",
						action: "searchFamily",
					},
					{ status: 404 },
				);
			}

			// Get family details with children and guardians
			const familyData =
				await childCheckinService.getFamilyWithChildrenAndGuardians(
					familyResult.family.id,
				);

			if (!familyData) {
				return data(
					{
						success: false,
						error: "Failed to load family details",
						action: "searchFamily",
					},
					{ status: 500 },
				);
			}

			return data({
				success: true,
				familyData,
				action: "searchFamily",
			});
		}

		// Handle family check-in
		if (action === "familyCheckin") {
			const userId = formData.get("userId");
			const childIds = formData.getAll("childIds[]");
			const manualRoomId = formData.get("roomId"); // Optional override

			if (!userId || childIds.length === 0) {
				return data(
					{
						success: false,
						error: "Missing required fields for family check-in",
					},
					{ status: 400 },
				);
			}

			// Check in each selected child
			const checkins = [];
			const errors = [];

			for (const childId of childIds) {
				// First check if the child is already checked in
				const isCheckedIn = await childCheckinService.isChildCheckedIn(
					childId.toString(),
				);

				if (isCheckedIn) {
					errors.push(
						`Child ID ${childId} is already checked in somewhere. Please check them out first.`,
					);
					continue;
				}

				let roomId;

				// If a room ID was manually specified, use it, otherwise auto-assign
				if (manualRoomId) {
					roomId = manualRoomId.toString();
				} else {
					// Auto-assign room based on child's age
					const bestRoom = await childCheckinService.findBestRoomForChild(
						childId.toString(),
						organization,
					);

					if (!bestRoom) {
						errors.push(
							`No suitable room found for child ID ${childId}. Please create a room first.`,
						);
						continue;
					}

					roomId = bestRoom.id;
				}

				const checkinData = {
					childId: childId.toString(),
					roomId: roomId,
					checkedInByUserId: userId.toString(),
					updatedAt: new Date(),
				};

				try {
					const newCheckin =
						await childCheckinService.checkinChild(checkinData);
					checkins.push(newCheckin);
				} catch (error) {
					errors.push(
						`Failed to check in child ID ${childId}: ${error.message}`,
					);
				}
			}

			if (checkins.length === 0 && errors.length > 0) {
				return data(
					{
						success: false,
						error: errors.join(", "),
					},
					{ status: 400 },
				);
			}

			// Generate QR code URL for the first check-in
			const host = new URL(request.url).origin;
			const qrCodeUrl = `${host}/churches/${organization}/childcheckin/verify/${checkins[0].secureId}`;

			return data({
				success: true,
				message: "Children have been successfully checked in",
				checkins,
				qrCodeUrl,
			});
		}

		// Complete individual check-in
		if (action === "completeCheckin") {
			// Get data from form
			const childFirstName = formData.get("childFirstName");
			const childLastName = formData.get("childLastName");
			const dateOfBirth = formData.get("dateOfBirth");
			const allergies = formData.get("allergies");
			const specialNotes = formData.get("specialNotes");
			const childPhotoUrl = formData.get("childPhotoUrl");

			const guardianFirstName = formData.get("guardianFirstName");
			const guardianLastName = formData.get("guardianLastName");
			const phone = formData.get("phone");
			const email = formData.get("email");
			const guardianPhotoUrl = formData.get("guardianPhotoUrl");

			const roomId = formData.get("roomId");
			const pickupPersonsJson = formData.get("authorizedPickups");

			// Validate required fields
			if (
				!childFirstName ||
				!childLastName ||
				!dateOfBirth ||
				!guardianFirstName ||
				!guardianLastName ||
				!roomId
			) {
				return data(
					{
						success: false,
						error: "Missing required fields",
					},
					{ status: 400 },
				);
			}

			// Process and upload photos if available
			let processedChildPhotoUrl = undefined;
			let processedGuardianPhotoUrl = undefined;

			if (childPhotoUrl) {
				try {
					processedChildPhotoUrl = await fileUploadService.uploadFromDataUrl(
						childPhotoUrl.toString(),
						`child-${childFirstName}-${childLastName}`,
					);
				} catch (error) {
					console.error("Error uploading child photo:", error);
				}
			}

			if (guardianPhotoUrl) {
				try {
					processedGuardianPhotoUrl = await fileUploadService.uploadFromDataUrl(
						guardianPhotoUrl.toString(),
						`guardian-${guardianFirstName}-${guardianLastName}`,
					);
				} catch (error) {
					console.error("Error uploading guardian photo:", error);
				}
			}

			// Check if user already exists by phone
			let user = null;
			if (phone) {
				user = await childCheckinService.getUserByPhone(phone.toString());
			}

			// Create or update user
			if (!user) {
				// Create new user
				const userData = {
					firstName: guardianFirstName?.toString(),
					lastName: guardianLastName?.toString(),
					phone: phone ? phone.toString() : undefined,
					email: email ? email.toString() : undefined,
					photoUrl: processedGuardianPhotoUrl,
					churchOrganizationId: organization,
					updatedAt: new Date(),
				};
				user = await childCheckinService.createUser(userData);
			}

			// Create or get family
			const familyName = `${guardianLastName} Family`;
			let family = null;

			// Check if user already has a family in this organization
			const userFamilies = await childCheckinService.getFamiliesForUser(
				user.id,
			);
			const orgFamily = userFamilies.find(
				(f) => f.churchOrganizationId === organization,
			);

			if (orgFamily) {
				family = orgFamily;
			} else {
				// Create new family
				const familyData = {
					name: familyName,
					churchOrganizationId: organization,
					updatedAt: new Date(),
				};
				family = await childCheckinService.createFamily(familyData);

				// Link user to family
				await childCheckinService.linkUserToFamily({
					userId: user.id,
					familyId: family.id,
					relationship: "parent",
					isPrimaryGuardian: true,
					updatedAt: new Date(),
				});
			}

			// Create child record
			const childData = {
				firstName: childFirstName?.toString(),
				lastName: childLastName?.toString(),
				dateOfBirth: new Date(dateOfBirth.toString()),
				allergies: allergies ? allergies?.toString() : undefined,
				specialNotes: specialNotes ? specialNotes?.toString() : undefined,
				photoUrl: processedChildPhotoUrl,
				familyId: family.id,
				churchOrganizationId: organization,
				updatedAt: new Date(),
			};
			const newChild = await childCheckinService.createChild(childData);

			// Create checkin record
			const checkinData = {
				childId: newChild.id,
				roomId: roomId.toString(),
				checkedInByUserId: user.id,
				updatedAt: new Date(),
			};
			const newCheckin = await childCheckinService.checkinChild(checkinData);

			// Add authorized pickup persons if any
			if (pickupPersonsJson) {
				const authorizedPickups = JSON.parse(pickupPersonsJson.toString());
				for (const pickup of authorizedPickups) {
					await childCheckinService.addAuthorizedPickupPerson({
						firstName: pickup.firstName,
						lastName: pickup.lastName,
						relationship: pickup.relationship,
						childCheckinId: newCheckin.id,
						updatedAt: new Date(),
					});
				}
			}

			// Generate QR code URL
			const host = new URL(request.url).origin;
			const qrCodeUrl = `${host}/churches/${organization}/childcheckin/verify/${newCheckin.secureId}`;

			return data({
				success: true,
				message: "Child has been successfully checked in",
				checkin: newCheckin,
				qrCodeUrl,
			});
		}

		// Rename room
		if (action === "renameRoom") {
			const roomId = formData.get("roomId");
			const newName = formData.get("newName");
			const minAge = formData.get("minAge");
			const maxAge = formData.get("maxAge");

			if (!roomId || !newName) {
				return data(
					{ success: false, error: "Room ID and new name are required" },
					{ status: 400 },
				);
			}

			const updatedRoom = await childCheckinService.updateRoomName(
				roomId.toString(),
				newName.toString(),
				minAge ? parseInt(minAge.toString()) : 0,
				maxAge ? parseInt(maxAge.toString()) : 12,
			);

			return data({
				success: true,
				message: "Room has been renamed",
				room: updatedRoom,
			});
		}

		return data({ success: false, error: "Invalid action" }, { status: 400 });
	} catch (error) {
		console.error("Error in child checkin action:", error);
		return data(
			{
				success: false,
				error: "An error occurred while processing your request",
			},
			{ status: 500 },
		);
	}
});

// RenameSessionDialog component
interface RenameSessionDialogProps {
	isOpen: boolean;
	onClose: () => void;
	session: Room | null;
	onRename: (sessionId: string, newName: string, minAge: number, maxAge: number) => void;
}

function RenameSessionDialog({
	isOpen,
	onClose,
	session,
	onRename,
}: RenameSessionDialogProps) {
	const [newName, setNewName] = useState("");
	const [minAge, setMinAge] = useState(session?.minAge ?? 0);
	const [maxAge, setMaxAge] = useState(session?.maxAge ?? 12);

	useEffect(() => {
		if (session) {
			setNewName(session.name);
		}
	}, [session]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (session && newName.trim()) {
			onRename(session.id, newName, minAge, maxAge);
			onClose();
		}
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
						<div className="flex flex-col gap-4">
							<div>
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
							<div className="flex  gap-4">
								<div className="">
									<Label htmlFor="minAge" className="text-right">
										Min Age (months)
									</Label>
									<Input
										id="minAge"
										type="number"
										value={minAge}
										defaultValue={session?.minAge ?? ""}
										onChange={(e) => setMinAge(parseInt(e.target.value))}
										className="col-span-3"
										placeholder="e.g., 0"
									/>
								</div>
								<div className="">
									<Label htmlFor="maxAge" className="text-right">
										Max Age (months)
									</Label>
									<Input
										id="maxAge"
										type="number"
										value={maxAge}
										defaultValue={session?.maxAge ?? ""}
										onChange={(e) => setMaxAge(parseInt(e.target.value))}
										className="col-span-3"
										placeholder="e.g., 24"
									/>
								</div>
							</div>
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

export default function ChildCheckin() {
	const { organization } = useParams();
	const navigate = useNavigate();
	const loaderData = useLoaderData<typeof loader>();
	const fetcher = useFetcher();
	const actionData = useActionData<typeof action>();

	// State for tabs
	const [activeTab, setActiveTab] = useState("room");
	const [checkinComplete, setCheckinComplete] = useState(false);
	const [qrCodeUrl, setQrCodeUrl] = useState("");

	// State for create room dialog
	const [isCreateRoomDialogOpen, setIsCreateRoomDialogOpen] = useState(false);

	// State for child info
	const [childInfo, setChildInfo] = useState({
		firstName: "",
		lastName: "",
		dateOfBirth: "",
		allergies: "",
		specialNotes: "",
		photoUrl: "",
	});

	// State for guardian info
	const [guardianInfo, setGuardianInfo] = useState({
		firstName: "",
		lastName: "",
		phone: "",
		email: "",
		photoUrl: "",
	});

	// State for authorized pickup persons
	const [authorizedPickups, setAuthorizedPickups] = useState<any[]>([]);

	// State for photos
	const [childPhoto, setChildPhoto] = useState<string | null>(null);
	const [guardianPhoto, setGuardianPhoto] = useState<string | null>(null);

	// Refs for camera
	const childVideoRef = useRef(null);
	const childCanvasRef = useRef(null);
	const guardianVideoRef = useRef(null);
	const guardianCanvasRef = useRef(null);

	// State for active room
	const [activeRoom, setActiveRoom] = useState<Room | null>(null);
	const [rooms, setRooms] = useState<Room[]>([]);
	const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
	const [roomToRename, setRoomToRename] = useState<Room | null>(null);

	// State for family check-in
	const [phoneNumber, setPhoneNumber] = useState("");
	const [isSearchingFamily, setIsSearchingFamily] = useState(false);
	const [familyData, setFamilyData] = useState<FamilyWithDetails | null>(null);
	const [selectedChildren, setSelectedChildren] = useState<string[]>([]);

	// Load rooms from loader data
	useEffect(() => {
		if (loaderData?.rooms) {
			setRooms(loaderData.rooms);
		}
	}, [loaderData]);

	// Handle successful room creation
	useEffect(() => {
		if (fetcher.data?.success && fetcher.data?.room) {
			// Add the new room to the list
			setRooms((prevRooms) => [
				...prevRooms,
				{ ...fetcher.data.room, activeCount: 0 },
			]);

			// Set it as the active room
			setActiveRoom(fetcher.data.room);

			// Show success message
			toast.success("Room created successfully");
		}
	}, [fetcher.data]);

	// Handle successful checkin
	useEffect(() => {
		if (
			fetcher.data?.success &&
			fetcher.data?.message === "Child has been successfully checked in"
		) {
			setCheckinComplete(true);
			setQrCodeUrl(fetcher.data.qrCodeUrl);
			setActiveTab("complete");
			toast.success("Child checked in successfully");
		}
	}, [fetcher.data]);

	// Handle successful family search
	useEffect(() => {
		if (fetcher.data?.success && fetcher.data?.familyData) {
			setFamilyData(fetcher.data.familyData);
			setIsSearchingFamily(false);
			toast.success("Family found");
		} else if (fetcher.data?.error && fetcher.data?.action === "searchFamily") {
			setIsSearchingFamily(false);
			toast.error(fetcher.data.error);
		}
	}, [fetcher.data]);

	// Handle family check-in response
	useEffect(() => {
		// Only process if we have fetcher data
		if (!fetcher.data) return;

		// Check if this is a family check-in response
		const isFamilyCheckin =
			fetcher.data._action === "familyCheckin" ||
			fetcher.formData?.get("_action") === "familyCheckin";

		if (
			fetcher.data.success &&
			fetcher.data.message === "Children have been successfully checked in"
		) {
			// Reset selection after successful check-in
			setSelectedChildren([]);

			// Retrieve stored children info from sessionStorage
			try {
				const storedChildrenInfo = sessionStorage.getItem(
					"selectedChildrenInfo",
				);
				if (storedChildrenInfo) {
					const childrenInfo = JSON.parse(storedChildrenInfo);

					// Create a success message with children's names
					if (childrenInfo.length > 0) {
						const childrenNames = childrenInfo
							.map((child) => child.name)
							.join(", ");
						toast.success(`Successfully checked in: ${childrenNames}`);

						// Clear the stored info
						sessionStorage.removeItem("selectedChildrenInfo");
					} else {
						toast.success(
							`Successfully checked in ${fetcher.data.checkins?.length || 0} children`,
						);
					}
				} else {
					toast.success(
						`Successfully checked in ${fetcher.data.checkins?.length || 0} children`,
					);
				}
			} catch (error) {
				// Fallback if sessionStorage access fails
				toast.success(
					`Successfully checked in ${fetcher.data.checkins?.length || 0} children`,
				);
			}

			// If QR code is available, show it
			if (fetcher.data.qrCodeUrl) {
				setQrCodeUrl(fetcher.data.qrCodeUrl);
				setCheckinComplete(true);
				setActiveTab("complete");
			}
		} else if (fetcher.data.error && isFamilyCheckin) {
			toast.error(fetcher.data.error);
		}
	}, [fetcher.data, fetcher.formData]);

	// Handle child info changes
	const handleChildInfoChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setChildInfo((prev) => ({ ...prev, [name]: value }));
	};

	// Handle guardian info changes
	const handleGuardianInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setGuardianInfo((prev) => ({ ...prev, [name]: value }));
	};

	// Handle phone number change
	const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setPhoneNumber(e.target.value);
	};

	// Handle search family by phone
	const handleSearchFamily = (e: React.FormEvent) => {
		e.preventDefault();
		if (!phoneNumber) {
			toast.error("Please enter a phone number");
			return;
		}

		setIsSearchingFamily(true);
		const formData = new FormData();
		formData.append("_action", "searchFamily");
		formData.append("phone", phoneNumber);
		fetcher.submit(formData, { method: "post" });
	};

	// Handle child selection for family check-in
	const handleChildSelection = (childId: string) => {
		setSelectedChildren((prev) => {
			if (prev.includes(childId)) {
				return prev.filter((id) => id !== childId);
			} else {
				return [...prev, childId];
			}
		});
	};

	// Handle family check-in submission
	const handleFamilyCheckin = () => {
		if (selectedChildren.length === 0) {
			toast.error("Please select at least one child");
			return;
		}

		if (!familyData?.guardians[0]?.id) {
			toast.error("No guardian found for this family");
			return;
		}

		// Get the names of selected children for better success messaging
		const selectedChildrenInfo = familyData.children
			.filter((child) => selectedChildren.includes(child.id))
			.map((child) => ({
				id: child.id,
				name: `${child.firstName} ${child.lastName}`,
			}));

		if (selectedChildrenInfo.length === 0) {
			toast.error("Could not find selected children's information");
			return;
		}

		const formData = new FormData();
		formData.append("_action", "familyCheckin");
		// Room ID is now optional - if provided, it will override auto-assignment
		if (activeRoom) {
			formData.append("roomId", activeRoom.id);
		}
		formData.append("userId", familyData.guardians[0].id);

		// Store the selected children's info in sessionStorage for success message
		sessionStorage.setItem(
			"selectedChildrenInfo",
			JSON.stringify(selectedChildrenInfo),
		);

		// Add selected child ids to form
		for (const child of selectedChildrenInfo) {
			formData.append("childIds[]", child.id);
		}

		fetcher.submit(formData, { method: "post" });
	};

	// Function to start camera for child
	const startChildCamera = async () => {
		try {
			if (childVideoRef.current) {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: true,
				});
				childVideoRef.current.srcObject = stream;
			}
		} catch (err) {
			console.error("Error accessing camera:", err);
			toast.error("Could not access camera. Please check permissions.");
		}
	};

	// Function to start camera for guardian
	const startGuardianCamera = async () => {
		try {
			if (guardianVideoRef.current) {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: true,
				});
				guardianVideoRef.current.srcObject = stream;
			}
		} catch (err) {
			console.error("Error accessing camera:", err);
			toast.error("Could not access camera. Please check permissions.");
		}
	};

	// Function to capture child photo
	const captureChildPhoto = () => {
		if (childVideoRef.current && childCanvasRef.current) {
			const video = childVideoRef.current;
			const canvas = childCanvasRef.current;
			const context = canvas.getContext("2d");

			// Set canvas dimensions to match video
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;

			// Draw video frame to canvas
			context.drawImage(video, 0, 0, canvas.width, canvas.height);

			// Get data URL from canvas
			const photoDataUrl = canvas.toDataURL("image/jpeg");
			setChildPhoto(photoDataUrl);
			setChildInfo({
				...childInfo,
				photoUrl: photoDataUrl,
			});

			// Stop the camera stream
			const stream = video.srcObject;
			if (stream) {
				const tracks = stream.getTracks();
				for (const track of tracks) {
					track.stop();
				}
				video.srcObject = null;
			}
		}
	};

	// Function to capture guardian photo
	const captureGuardianPhoto = () => {
		if (guardianVideoRef.current && guardianCanvasRef.current) {
			const video = guardianVideoRef.current;
			const canvas = guardianCanvasRef.current;
			const context = canvas.getContext("2d");

			// Set canvas dimensions to match video
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;

			// Draw video frame to canvas
			context.drawImage(video, 0, 0, canvas.width, canvas.height);

			// Get data URL from canvas
			const photoDataUrl = canvas.toDataURL("image/jpeg");
			setGuardianPhoto(photoDataUrl);
			setGuardianInfo({
				...guardianInfo,
				photoUrl: photoDataUrl,
			});

			// Stop the camera stream
			const stream = video.srcObject;
			if (stream) {
				const tracks = stream.getTracks();
				for (const track of tracks) {
					track.stop();
				}
				video.srcObject = null;
			}
		}
	};

	// Function to add authorized pickup person
	const handleAddAuthorizedPickup = (e) => {
		e.preventDefault();
		const newPickup = {
			firstName: e.target.firstName.value,
			lastName: e.target.lastName.value,
			relationship: e.target.relationship.value,
			id: Date.now().toString(), // Add unique ID for key prop
		};
		setAuthorizedPickups([...authorizedPickups, newPickup]);
		e.target.reset();
	};

	// Function to complete checkin process
	const handleCompleteCheckin = () => {
		if (
			guardianInfo.firstName &&
			guardianInfo.lastName &&
			childInfo.dateOfBirth
		) {
			const formData = new FormData();

			// Add action type
			formData.append("_action", "completeCheckin");

			// Add child info
			formData.append("childFirstName", childInfo.firstName);
			formData.append("childLastName", childInfo.lastName);
			formData.append("dateOfBirth", childInfo.dateOfBirth);
			formData.append("allergies", childInfo.allergies);
			formData.append("specialNotes", childInfo.specialNotes);
			formData.append("childPhotoUrl", childInfo.photoUrl);

			// Add guardian info
			formData.append("guardianFirstName", guardianInfo.firstName);
			formData.append("guardianLastName", guardianInfo.lastName);
			formData.append("phone", guardianInfo.phone);
			formData.append("email", guardianInfo.email);
			formData.append("guardianPhotoUrl", guardianInfo.photoUrl);

			// Add room ID
			formData.append("roomId", activeRoom.id);

			// Add authorized pickup persons
			formData.append("authorizedPickups", JSON.stringify(authorizedPickups));

			// Submit form data
			fetcher.submit(formData, { method: "post" });
		} else if (!childInfo.dateOfBirth) {
			toast.error("Please enter the child's date of birth.");
		} else {
			toast.error("Please enter the guardian's first and last name.");
		}
	};

	// Function to create a new room
	const handleCreateRoom = (e: React.FormEvent) => {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const formData = new FormData(form);
		formData.append("_action", "createRoom");
		fetcher.submit(formData, { method: "post" });
		form.reset();
	};

	// Function to select a room
	const handleSelectRoom = (room: Room) => {
		setActiveRoom(room);
	};

	// Function to open rename dialog
	const handleOpenRenameDialog = (room: Room) => {
		setRoomToRename(room);
		setIsRenameDialogOpen(true);
	};

	// Function to submit room rename
	const submitRenameRoom = (roomId: string, newName: string, minAge: number, maxAge: number) => {
		if (roomToRename && newName) {
			const formData = new FormData();
			formData.append("_action", "renameRoom");
			formData.append("roomId", roomId);
			formData.append("newName", newName);
			formData.append("minAge", minAge.toString());
			formData.append("maxAge", maxAge.toString());
			fetcher.submit(formData, { method: "post" });
		}
	};

	return (
		<div className="container px-4 py-6 mx-auto">
			<h1 className="text-2xl font-bold mb-4">Child Check-in Dashboard</h1>

			{/* Main Action Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				<div className="border rounded-lg p-4 flex flex-col h-full">
					<h2 className="text-lg font-semibold mb-2">Start Check-in</h2>
					<p className="text-sm text-muted-foreground mb-4 flex-grow">
						Check in a child to an active room
					</p>
					<div className="space-y-2">

						<Button
							variant="outline"
							className="w-full"
							onClick={() => {
								setChildInfo({
									firstName: "",
									lastName: "",
									dateOfBirth: "",
									allergies: "",
									specialNotes: "",
									photoUrl: "",
								});
								setGuardianInfo({
									firstName: "",
									lastName: "",
									phone: "",
									email: "",
									photoUrl: "",
								});
								setCheckinComplete(false);

								if (rooms.length === 0) {
									setIsCreateRoomDialogOpen(true);
								} else if (rooms.length === 1) {
									setActiveRoom(rooms[0]);
									setActiveTab("child");
								} else {
									setActiveTab("room");
								}
							}}
						>
							New Child Check-in
						</Button>
						<Button
							className="w-full"
							onClick={() => setActiveTab("quick")}
						>
							Quick Family Check-in
						</Button>
					</div>
				</div>

				<div className="border rounded-lg p-4 flex flex-col h-full">
					<h2 className="text-lg font-semibold mb-2">Room Management</h2>
					<p className="text-sm text-muted-foreground mb-4 flex-grow">
						Manage check-in rooms and view capacity
					</p>
					<div className="space-y-2">
						<Button
							variant="outline"
							className="w-full"
							onClick={() => setActiveTab("room")}
						>
							Manage Rooms
						</Button>
						<Button
							className="w-full"
							onClick={() => setIsCreateRoomDialogOpen(true)}
						>
							Create New Room
						</Button>
					</div>
				</div>

				<div className="border rounded-lg p-4 flex flex-col h-full">
					<h2 className="text-lg font-semibold mb-2">Children</h2>
					<p className="text-sm text-muted-foreground mb-4 flex-grow">
						View and manage checked-in children
					</p>
					<div className="space-y-2">
						<Button
							className="w-full"
							onClick={() => navigate(`/churches/${organization}/childcheckin/list`)}
						>
							View Checked-in Children
						</Button>
					</div>
				</div>
			</div>



			{/* Check-in Flow Screens */}
			{activeTab !== "room" && (
				<div className="border-t pt-4 mt-4">
					<div className="flex mb-4 space-x-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setActiveTab("room")}
							className="text-muted-foreground"
						>
							← Back to Dashboard
						</Button>
					</div>

					{activeTab === "quick" && (
						<div>
							<h2 className="text-xl font-semibold mb-2">Quick Family Check-in</h2>
							<p className="text-muted-foreground text-sm mb-4">
								Look up a family by phone number for quick check-in.
							</p>

							{!familyData ? (
								<div className="space-y-4">
									<fetcher.Form
										onSubmit={handleSearchFamily}
										className="space-y-2"
									>
										<div className="space-y-1">
											<Label htmlFor="phoneNumber">Phone Number</Label>
											<div className="flex gap-2">
												<Input
													id="phoneNumber"
													name="phoneNumber"
													type="tel"
													placeholder="(555) 555-5555"
													value={phoneNumber}
													onChange={handlePhoneNumberChange}
													required
													className="flex-1"
												/>
												<Button
													type="submit"
													disabled={isSearchingFamily}
												>
													{isSearchingFamily ? "..." : "Search"}
												</Button>
											</div>
										</div>
									</fetcher.Form>
								</div>
							) : (
								<div className="space-y-4">
									<div>
										<h3 className="text-lg font-medium mb-2">
											Family Information
										</h3>
										<div className="p-4 border rounded-md">
											<p className="font-medium">{familyData.family.name}</p>
											<div className="mt-2">
												<p className="text-sm text-muted-foreground">
													Guardians:
												</p>
												<ul className="mt-1 space-y-1">
													{familyData.guardians.map((guardian) => (
														<li key={guardian.id} className="text-sm overflow-hidden text-ellipsis">
															{guardian.firstName} {guardian.lastName}
															{guardian.phone && ` - ${guardian.phone}`}
														</li>
													))}
												</ul>
											</div>
										</div>
									</div>

									<div>
										<div className="flex justify-between items-center mb-2">
											<h3 className="text-lg font-medium">Children</h3>
											<p className="text-sm text-muted-foreground">
												Select children to check in
											</p>
										</div>

										{familyData.children.length === 0 ? (
											<div className="p-4 border rounded-md text-center">
												<p className="text-muted-foreground">
													No children found for this family
												</p>
											</div>
										) : (
											<div className="space-y-2">
												{familyData.children.map((child) => (
													<div
														key={child.id}
														className={`p-4 border rounded-md flex justify-between items-center cursor-pointer ${selectedChildren.includes(child.id)
															? "border-primary bg-primary/5"
															: ""
															}`}
														onClick={() => handleChildSelection(child.id)}
													>
														<div>
															<p className="font-medium">
																{child.firstName} {child.lastName}
															</p>
															{child.dateOfBirth && (
																<p className="text-sm text-muted-foreground">
																	{new Date(
																		child.dateOfBirth,
																	).toLocaleDateString()}
																</p>
															)}
															{child.allergies && (
																<p className="text-sm text-red-500">
																	Allergies: {child.allergies}
																</p>
															)}
														</div>
														<Checkbox
															checked={selectedChildren.includes(child.id)}
															onCheckedChange={() =>
																handleChildSelection(child.id)
															}
														/>
													</div>
												))}
											</div>
										)}
									</div>

									{rooms.length > 0 ? (
										<div>
											<h3 className="text-lg font-medium mb-2">Select Room</h3>
											<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
												{rooms.map((room) => (
													<div
														key={room.id}
														className={`p-3 border rounded-lg cursor-pointer ${activeRoom?.id === room.id
															? "border-primary bg-primary/5"
															: ""
															}`}
														onClick={() => handleSelectRoom(room)}
													>
														<div className="flex justify-between">
															<div>
																<div className="font-medium">{room.name}</div>
																{(room.minAge !== null || room.maxAge !== null) && (
																	<p className="text-sm text-muted-foreground">
																		Age:{" "}
																		{room.minAge !== null && room.maxAge !== null
																			? `${room.minAge}-${room.maxAge} months`
																			: room.minAge !== null
																				? `${room.minAge}+ months`
																				: `Up to ${room.maxAge} months`}
																	</p>
																)}
															</div>
															<div>
																<Badge>{room.activeCount}</Badge>
															</div>
														</div>
													</div>
												))}
											</div>
										</div>
									) : (
										<div className="p-4 border rounded-md text-center">
											<p className="text-muted-foreground mb-2">
												No rooms available. Create a room to check in children.
											</p>
											<Button onClick={() => setIsCreateRoomDialogOpen(true)}>
												Create Room
											</Button>
										</div>
									)}

									{activeRoom && selectedChildren.length > 0 && (
										<div className="mt-4">
											<Button
												onClick={handleFamilyCheckin}
												disabled={selectedChildren.length === 0 || !activeRoom}
												className="w-full"
											>
												Check in {selectedChildren.length} Child
												{selectedChildren.length !== 1 ? "ren" : ""} to {activeRoom.name}
											</Button>
										</div>
									)}
								</div>
							)}
						</div>
					)}

					{activeTab === "child" && (
						<div>
							<h2 className="text-xl font-semibold mb-2">Child Information</h2>
							<p className="text-muted-foreground text-sm mb-4">
								Enter the child's details and take a photo.
							</p>

							<div className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="space-y-4">
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="firstName">First Name</Label>
												<Input
													id="firstName"
													name="firstName"
													value={childInfo.firstName}
													onChange={handleChildInfoChange}
													required
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="lastName">Last Name</Label>
												<Input
													id="lastName"
													name="lastName"
													value={childInfo.lastName}
													onChange={handleChildInfoChange}
													required
												/>
											</div>
										</div>
										<div className="space-y-2">
											<Label htmlFor="dateOfBirth">Date of Birth</Label>
											<Input
												id="dateOfBirth"
												name="dateOfBirth"
												type="date"
												value={childInfo.dateOfBirth}
												onChange={handleChildInfoChange}
												required
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="allergies">Allergies</Label>
											<Input
												id="allergies"
												name="allergies"
												value={childInfo.allergies}
												onChange={handleChildInfoChange}
												placeholder="e.g., Peanuts, Dairy"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="specialNotes">Special Notes</Label>
											<Textarea
												id="specialNotes"
												name="specialNotes"
												value={childInfo.specialNotes}
												onChange={handleChildInfoChange}
												placeholder="Any special instructions or needs"
											/>
										</div>
									</div>
								</div>

								<div className="flex justify-between mt-6">
									<Button variant="outline" onClick={() => setActiveTab("room")}>
										Cancel
									</Button>
									<Button
										onClick={() => {
											if (
												childInfo.firstName &&
												childInfo.lastName &&
												childInfo.dateOfBirth
											) {
												setActiveTab("guardian");
											} else if (!childInfo.dateOfBirth) {
												toast.error("Please enter the child's date of birth.");
											} else {
												toast.error(
													"Please enter the child's first and last name.",
												);
											}
										}}
									>
										Next: Guardian Information
									</Button>
								</div>
							</div>
						</div>
					)}

					{activeTab === "guardian" && (
						<div>
							<h2 className="text-xl font-semibold mb-2">Guardian Information</h2>
							<p className="text-muted-foreground text-sm mb-4">
								Enter the guardian's details and take a photo.
							</p>

							<div className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="space-y-4">
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="guardianFirstName">First Name</Label>
												<Input
													id="guardianFirstName"
													name="firstName"
													value={guardianInfo.firstName}
													onChange={handleGuardianInfoChange}
													required
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="guardianLastName">Last Name</Label>
												<Input
													id="guardianLastName"
													name="lastName"
													value={guardianInfo.lastName}
													onChange={handleGuardianInfoChange}
													required
												/>
											</div>
										</div>
										<div className="space-y-2">
											<Label htmlFor="guardianPhone">Phone Number</Label>
											<Input
												id="guardianPhone"
												name="phone"
												type="tel"
												value={guardianInfo.phone}
												onChange={handleGuardianInfoChange}
												placeholder="(555) 555-5555"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="guardianEmail">Email</Label>
											<Input
												id="guardianEmail"
												name="email"
												type="email"
												value={guardianInfo.email}
												onChange={handleGuardianInfoChange}
												placeholder="guardian@example.com"
											/>
										</div>
									</div>
								</div>

								<div className="flex justify-between mt-6">
									<Button variant="outline" onClick={() => setActiveTab("child")}>
										Back
									</Button>
									<Button onClick={handleCompleteCheckin}>
										Complete Check-in
									</Button>
								</div>
							</div>
						</div>
					)}

					{activeTab === "complete" && (
						<div>
							<h2 className="text-xl font-semibold mb-2">Check-in Complete</h2>
							<p className="text-muted-foreground text-sm mb-4">
								Child has been checked in successfully.
							</p>

							<div className="space-y-6">
								<div className="text-center mb-6">
									<h3 className="text-xl font-medium mb-2">
										Thank you for checking in!
									</h3>
									<p className="text-muted-foreground">
										Please show this QR code to the attendant when picking up your
										child.
									</p>
								</div>
								{qrCodeUrl && (
									<div className="my-6 max-w-xs mx-auto">
										<img
											src={qrCodeUrl}
											alt="Check-in QR Code"
											className="w-full h-auto"
										/>
									</div>
								)}

								<div className="flex flex-col sm:flex-row gap-3 justify-center">
									<Button
										variant="outline"
										onClick={() => {
											setActiveTab("room");
											setChildInfo({
												firstName: "",
												lastName: "",
												dateOfBirth: "",
												allergies: "",
												specialNotes: "",
												photoUrl: "",
											});
											setGuardianInfo({
												firstName: "",
												lastName: "",
												phone: "",
												email: "",
												photoUrl: "",
											});
											setCheckinComplete(false);
										}}
									>
										Back to Dashboard
									</Button>
									<Button
										onClick={() => navigate(`/churches/${organization}/childcheckin/list`)}
									>
										View All Checked-in Children
									</Button>
								</div>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Room Management Tab - only visible when selected */}
			{activeTab === "room" && (
				<div className="border-t pt-4 mt-4">
					<div className="mb-4">
						<h2 className="text-xl font-semibold mb-2">Room Management</h2>
						<p className="text-muted-foreground text-sm mb-4">
							Manage your check-in rooms
						</p>

						{rooms.length > 0 ? (
							<div className="space-y-2">
								{rooms.map((room) => (
									<div
										key={room.id}
										className="p-3 border rounded-lg"
									>
										<div className="flex justify-between">
											<div>
												<div className="font-medium">{room.name}</div>
												{(room.minAge !== null || room.maxAge !== null) && (
													<p className="text-sm text-muted-foreground">
														Age:{" "}
														{room.minAge !== null && room.maxAge !== null
															? `${room.minAge}-${room.maxAge} months`
															: room.minAge !== null
																? `${room.minAge}+ months`
																: `Up to ${room.maxAge} months`}
													</p>
												)}
												<p className="text-sm text-muted-foreground">
													Children checked in: {room.activeCount}
												</p>
											</div>
											<div>
												<Button
													variant="outline"
													size="sm"
													onClick={() => handleOpenRenameDialog(room)}
												>
													Edit
												</Button>
											</div>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="p-8 text-center border rounded-md">
								<p className="text-muted-foreground mb-4">
									No rooms available. Create a room to get started.
								</p>
							</div>
						)}

						<Button
							className="w-full mt-4"
							onClick={() => setIsCreateRoomDialogOpen(true)}
						>
							Create New Room
						</Button>
					</div>
				</div>
			)}

			{/* Dialogs */}
			<RenameSessionDialog
				isOpen={isRenameDialogOpen}
				onClose={() => setIsRenameDialogOpen(false)}
				session={roomToRename}
				onRename={submitRenameRoom}
			/>

			{/* Create Room Dialog */}
			<Dialog open={isCreateRoomDialogOpen} onOpenChange={setIsCreateRoomDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create New Room</DialogTitle>
						<DialogDescription>
							Create a new check-in room with optional age restrictions.
						</DialogDescription>
					</DialogHeader>
					<fetcher.Form onSubmit={(e) => {
						handleCreateRoom(e);
						setIsCreateRoomDialogOpen(false);
					}} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="roomName">Room Name</Label>
							<Input
								id="roomName"
								name="roomName"
								placeholder="e.g., Nursery, Toddlers, Elementary"
								required
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="minAge">Minimum Age (months)</Label>
								<Input
									id="minAge"
									name="minAge"
									type="number"
									placeholder="e.g., 0"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="maxAge">Maximum Age (months)</Label>
								<Input
									id="maxAge"
									name="maxAge"
									type="number"
									placeholder="e.g., 24"
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsCreateRoomDialogOpen(false)}
							>
								Cancel
							</Button>
							<Button type="submit">Create Room</Button>
						</DialogFooter>
					</fetcher.Form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
