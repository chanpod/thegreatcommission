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
		<div className="container mx-auto py-8">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold">Child Check-in</h1>
				<Button
					variant="outline"
					onClick={() =>
						navigate(`/churches/${organization}/childcheckin/list`)
					}
				>
					View Checked-in Children
				</Button>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid w-full grid-cols-5">
					<TabsTrigger value="room">Room</TabsTrigger>
					<TabsTrigger value="quick">Quick Check-in</TabsTrigger>
					<TabsTrigger value="child" disabled={!activeRoom}>
						Child Info
					</TabsTrigger>
					<TabsTrigger value="guardian" disabled={!childInfo.firstName}>
						Guardian Info
					</TabsTrigger>
					<TabsTrigger value="complete" disabled={!checkinComplete}>
						Complete
					</TabsTrigger>
				</TabsList>

				<TabsContent value="room">
					<Card>
						<CardHeader>
							<CardTitle>Check-in Room</CardTitle>
							<CardDescription>
								Create a new check-in room or select an existing one.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<fetcher.Form onSubmit={handleCreateRoom} className="space-y-4">
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
								<Button type="submit">Create Room</Button>
							</fetcher.Form>

							{rooms?.length > 0 && (
								<div className="mt-6">
									<div className="flex items-center mb-2 justify-between">
										<h3 className="text-lg font-medium">Active Rooms</h3>
										{rooms.some((r) => r.activeCount > 0) && (
											<div className="text-sm text-muted-foreground">
												<Badge variant="secondary">
													{rooms.reduce(
														(total, room) => total + room.activeCount,
														0,
													)}
												</Badge>{" "}
												total children checked in
											</div>
										)}
									</div>
									<div className="space-y-2">
										{rooms.map((room) => (
											<div
												key={room.id}
												className={`p-4 border rounded-lg ${activeRoom?.id === room.id
													? "border-primary bg-primary/5"
													: ""
													}`}
											>
												<div className="flex justify-between items-center">
													<div>
														<div className="font-medium">{room.name}</div>
														<div className="text-sm text-muted-foreground">
															{room.minAge !== null && room.maxAge !== null ? (
																<span>
																	Ages: {formatAge(room.minAge)}-{formatAge(room.maxAge)}
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
															Started:{" "}
															{new Date(room.startTime).toLocaleTimeString()}
														</div>
														{room.activeCount > 0 && (
															<div className="mt-1">
																<Badge>
																	{room.activeCount} children checked in
																</Badge>
															</div>
														)}
													</div>
													<div className="flex space-x-2">
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
								</div>
							)}
						</CardContent>
						<CardFooter>
							<div className="w-full flex flex-col gap-2">
								{activeRoom && (
									<div className="text-sm text-muted-foreground">
										Selected room:{" "}
										<span className="font-medium">{activeRoom.name}</span>
										<span className="text-xs">
											{" "}
											(will override auto-assignment)
										</span>
									</div>
								)}
								<Button onClick={() => setActiveTab("child")} variant="default">
									Next: Child Information
								</Button>
							</div>
						</CardFooter>
					</Card>
				</TabsContent>

				<TabsContent value="quick">
					<Card>
						<CardHeader>
							<CardTitle>Quick Check-in</CardTitle>
							<CardDescription>
								Enter a phone number to find a family and check in their
								children
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-6">
								<div>
									<form
										onSubmit={handleSearchFamily}
										className="flex space-x-2"
									>
										<div className="flex-1">
											<Label htmlFor="phoneNumber">Phone Number</Label>
											<Input
												id="phoneNumber"
												placeholder="Enter phone number"
												value={phoneNumber}
												onChange={handlePhoneNumberChange}
												type="tel"
												required
											/>
										</div>
										<Button
											type="submit"
											className="mt-5"
											disabled={isSearchingFamily}
										>
											{isSearchingFamily ? "Searching..." : "Find Family"}
										</Button>
									</form>
								</div>

								{familyData && (
									<div className="space-y-6">
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
															<li key={guardian.id} className="text-sm">
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

										{activeRoom && (
											<div className="p-4 border rounded-md">
												<h3 className="font-medium mb-2">Selected Room</h3>
												<div className="text-sm">
													<p>
														<span className="font-medium">Room:</span>{" "}
														{activeRoom.name}
													</p>
													{(activeRoom.minAge !== null ||
														activeRoom.maxAge !== null) && (
															<p>
																<span className="font-medium">Age Range:</span>{" "}
																{activeRoom.minAge !== null &&
																	activeRoom.maxAge !== null
																	? `${activeRoom.minAge}-${activeRoom.maxAge} months`
																	: activeRoom.minAge !== null
																		? `${activeRoom.minAge}+ months`
																		: `Up to ${activeRoom.maxAge} months`}
															</p>
														)}
												</div>
												<p className="text-xs text-muted-foreground mt-2">
													This room will be used for all selected children
													(overrides auto-assignment)
												</p>
											</div>
										)}

										<Button
											onClick={handleFamilyCheckin}
											disabled={
												selectedChildren.length === 0 ||
												fetcher.state === "submitting"
											}
											className="w-full"
										>
											{fetcher.state === "submitting" &&
												fetcher.formData?.get("_action") === "familyCheckin"
												? "Checking In..."
												: "Check In Selected Children"}
										</Button>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="child">
					<Card>
						<CardHeader>
							<CardTitle>Child Information</CardTitle>
							<CardDescription>
								Enter the child's details and take a photo.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-4">
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
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="specialNotes">Special Notes</Label>
										<Textarea
											id="specialNotes"
											name="specialNotes"
											value={childInfo.specialNotes}
											onChange={handleChildInfoChange}
											rows={3}
										/>
									</div>
								</div>
								<div className="space-y-4">
									<div className="space-y-2">
										<Label>Child's Photo (Optional)</Label>
										<div className="flex flex-col items-center justify-center border rounded-lg p-4 h-64">
											{childPhoto ? (
												<div className="relative w-full h-full">
													<img
														src={childPhoto}
														alt="Child"
														className="w-full h-full object-cover rounded-lg"
													/>
													<Button
														variant="destructive"
														size="sm"
														className="absolute top-2 right-2"
														onClick={() => {
															setChildPhoto(null);
															setChildInfo({
																...childInfo,
																photoUrl: "",
															});
														}}
													>
														Remove
													</Button>
												</div>
											) : (
												<div className="flex flex-col items-center justify-center h-full">
													<Button variant="outline" onClick={captureChildPhoto}>
														Take Photo
													</Button>
													<p className="text-sm text-muted-foreground mt-2">
														Or drag and drop an image here
													</p>
												</div>
											)}
										</div>
									</div>
									{activeRoom && (
										<div className="p-4 border rounded-lg mt-4">
											<h3 className="font-medium mb-2">Selected Room</h3>
											<div className="text-sm">
												<p>
													<span className="font-medium">Room:</span>{" "}
													{activeRoom.name}
												</p>
												{(activeRoom.minAge !== null ||
													activeRoom.maxAge !== null) && (
														<p>
															<span className="font-medium">Age Range:</span>{" "}
															{activeRoom.minAge !== null &&
																activeRoom.maxAge !== null
																? `${activeRoom.minAge}-${activeRoom.maxAge} months`
																: activeRoom.minAge !== null
																	? `${activeRoom.minAge}+ months`
																	: `Up to ${activeRoom.maxAge} months`}
														</p>
													)}
											</div>
										</div>
									)}
								</div>
							</div>
						</CardContent>
						<CardFooter className="flex justify-between">
							<Button variant="outline" onClick={() => setActiveTab("room")}>
								Back
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
						</CardFooter>
					</Card>
				</TabsContent>

				<TabsContent value="guardian">
					<Card>
						<CardHeader>
							<CardTitle>Guardian Information</CardTitle>
							<CardDescription>
								Enter the guardian's details and take a photo.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-4">
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
									<div className="space-y-2">
										<Label htmlFor="phone">Phone Number</Label>
										<Input
											id="phone"
											name="phone"
											type="tel"
											value={guardianInfo.phone}
											onChange={handleGuardianInfoChange}
											placeholder="For QR code text message"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="email">Email</Label>
										<Input
											id="email"
											name="email"
											type="email"
											value={guardianInfo.email}
											onChange={handleGuardianInfoChange}
										/>
									</div>
								</div>
								<div className="space-y-4">
									<div className="space-y-2">
										<Label>Guardian's Photo</Label>
										{guardianPhoto ? (
											<div className="relative">
												<img
													src={guardianPhoto}
													alt="Guardian"
													className="w-full h-64 object-cover rounded-md"
												/>
												<Button
													variant="outline"
													size="sm"
													className="absolute top-2 right-2"
													onClick={() => setGuardianPhoto(null)}
												>
													Retake
												</Button>
											</div>
										) : (
											<div className="border rounded-md p-4">
												<video
													ref={guardianVideoRef}
													autoPlay
													playsInline
													className="w-full h-64 object-cover"
													onLoadedMetadata={() => console.log("Camera ready")}
												>
													<track kind="captions" />
												</video>
												<canvas
													ref={guardianCanvasRef}
													style={{ display: "none" }}
												/>
												<div className="flex space-x-2 mt-2">
													<Button
														className="flex-1"
														onClick={startGuardianCamera}
													>
														Start Camera
													</Button>
													<Button
														className="flex-1"
														onClick={captureGuardianPhoto}
													>
														Take Photo
													</Button>
												</div>
											</div>
										)}
									</div>
								</div>
							</div>

							<div className="mt-8">
								<h3 className="text-lg font-medium mb-4">
									Authorized Pickup Persons (Optional)
								</h3>
								<form
									onSubmit={handleAddAuthorizedPickup}
									className="grid grid-cols-1 md:grid-cols-3 gap-4"
								>
									<div className="space-y-2">
										<Label htmlFor="pickupFirstName">First Name</Label>
										<Input id="pickupFirstName" name="firstName" required />
									</div>
									<div className="space-y-2">
										<Label htmlFor="pickupLastName">Last Name</Label>
										<Input id="pickupLastName" name="lastName" required />
									</div>
									<div className="space-y-2">
										<Label htmlFor="relationship">Relationship</Label>
										<Input
											id="relationship"
											name="relationship"
											placeholder="e.g., Grandparent"
											required
										/>
									</div>
									<Button type="submit" className="md:col-span-3">
										Add Pickup Person
									</Button>
								</form>

								{authorizedPickups.length > 0 && (
									<div className="mt-4">
										<h4 className="font-medium mb-2">Added Pickup Persons:</h4>
										<ul className="space-y-2">
											{authorizedPickups.map((person) => (
												<li
													key={person.id}
													className="flex justify-between items-center p-2 border rounded-md"
												>
													<span>
														{person.firstName} {person.lastName} (
														{person.relationship})
													</span>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => {
															const updatedPickups = authorizedPickups.filter(
																(p) => p.id !== person.id,
															);
															setAuthorizedPickups(updatedPickups);
														}}
													>
														Remove
													</Button>
												</li>
											))}
										</ul>
									</div>
								)}
							</div>
						</CardContent>
						<CardFooter className="flex justify-between">
							<Button variant="outline" onClick={() => setActiveTab("child")}>
								Back
							</Button>
							<Button onClick={handleCompleteCheckin}>Complete Check-in</Button>
						</CardFooter>
					</Card>
				</TabsContent>

				<TabsContent value="complete">
					<Card>
						<CardHeader>
							<CardTitle>Check-in Complete</CardTitle>
							<CardDescription>
								The child has been successfully checked in.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col items-center">
							<div className="text-center mb-6">
								<h2 className="text-2xl font-bold">
									{childInfo.firstName} {childInfo.lastName}
								</h2>
								<p className="text-muted-foreground">
									Checked in by: {guardianInfo.firstName}{" "}
									{guardianInfo.lastName}
								</p>
							</div>

							<div className="bg-white p-4 rounded-md shadow-md mb-6">
								<QRCodeSVG value={qrCodeUrl} size={200} />
							</div>

							<div className="text-center mb-6">
								<p>Scan this QR code for easy check-out.</p>
								{guardianInfo.phone && (
									<p className="text-sm text-muted-foreground mt-2">
										A link to this QR code has been sent to {guardianInfo.phone}
										.
									</p>
								)}
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
								<div>
									<h3 className="font-medium mb-2">Child Information:</h3>
									<div className="space-y-1 text-sm">
										<p>
											<span className="font-medium">Name:</span>{" "}
											{childInfo.firstName} {childInfo.lastName}
										</p>
										{childInfo.dateOfBirth && (
											<p>
												<span className="font-medium">Date of Birth:</span>{" "}
												{childInfo.dateOfBirth}
											</p>
										)}
										{childInfo.allergies && (
											<p>
												<span className="font-medium">Allergies:</span>{" "}
												{childInfo.allergies}
											</p>
										)}
										{childInfo.specialNotes && (
											<p>
												<span className="font-medium">Special Notes:</span>{" "}
												{childInfo.specialNotes}
											</p>
										)}
									</div>
								</div>
								<div>
									<h3 className="font-medium mb-2">Guardian Information:</h3>
									<div className="space-y-1 text-sm">
										<p>
											<span className="font-medium">Name:</span>{" "}
											{guardianInfo.firstName} {guardianInfo.lastName}
										</p>
										{guardianInfo.phone && (
											<p>
												<span className="font-medium">Phone:</span>{" "}
												{guardianInfo.phone}
											</p>
										)}
										{guardianInfo.email && (
											<p>
												<span className="font-medium">Email:</span>{" "}
												{guardianInfo.email}
											</p>
										)}
									</div>

									{authorizedPickups.length > 0 && (
										<div className="mt-4">
											<h3 className="font-medium mb-2">
												Authorized Pickup Persons:
											</h3>
											<ul className="space-y-1 text-sm">
												{authorizedPickups.map((person) => (
													<li key={person.id}>
														{person.firstName} {person.lastName} (
														{person.relationship})
													</li>
												))}
											</ul>
										</div>
									)}
								</div>
							</div>
						</CardContent>
						<CardFooter className="flex justify-between">
							<Button
								variant="outline"
								onClick={() => {
									// Reset form for a new check-in
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
									setChildPhoto(null);
									setGuardianPhoto(null);
									setAuthorizedPickups([]);
									setQrCodeUrl("");
									setCheckinComplete(false);
									setActiveTab("child");
								}}
							>
								Check in Another Child
							</Button>
							<div className="flex space-x-2">
								<Button
									variant="outline"
									onClick={() =>
										navigate(`/churches/${organization}/childcheckin/list`)
									}
								>
									View All Check-ins
								</Button>
								<Button
									onClick={() => {
										// Print the check-in receipt
										window.print();
									}}
								>
									Print Receipt
								</Button>
							</div>
						</CardFooter>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Rename Session Dialog */}
			<RenameSessionDialog
				isOpen={isRenameDialogOpen}
				onClose={() => setIsRenameDialogOpen(false)}
				session={roomToRename}
				onRename={submitRenameRoom}
			/>
		</div>
	);
}

// Rename Room Dialog Component
function RenameRoomDialog({
	isOpen,
	onClose,
	session,
	onRename,
}: {
	isOpen: boolean;
	onClose: () => void;
	session: any;
	onRename: (newName: string) => void;
}) {
	const [newName, setNewName] = useState("");

	useEffect(() => {
		if (session) {
			setNewName(session.name);
		}
	}, [session]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (session) {
			onRename(newName);
		}
		onClose();
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
