import {
	Pencil as PencilIcon,
	Plus as PlusIcon,
	Trash as TrashIcon,
	Check,
	CheckCircle as CheckCircleIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
	data,
	useFetcher,
	useLoaderData,
	useNavigate,
	useParams,
	useSearchParams,
} from "react-router";
import { toast } from "sonner";
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
import { MessagingService } from "@/server/services/MessagingService";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Stepper } from "~/components/ui/stepper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";
// Import services
import { childCheckinService } from "~/services/ChildCheckinService";
import { verificationService } from "~/services/VerificationService";
import { organizationService } from "~/services/OrganizationService";

import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { churchOrganization, users } from "@/server/db/schema";

// Define step names for the stepper
const STEPS = {
	PHONE: 0,
	VERIFY: 1,
	SELECT_CHILD: 2,
	CONFIRM: 3,
};

// The stepper names that will be displayed to the user
const STEP_NAMES = ["Phone", "Verify", "Child", "Confirm"];

// Loader to fetch initial data - no authentication required
export async function loader({ params, request }) {
	const { organization } = params;
	const url = new URL(request.url);
	const step = url.searchParams.get("step") || "phone";

	try {
		// Check for existing verification cookie
		const verificationData =
			await verificationService.getVerificationFromCookie(request);

		// Get organization details using the service
		const org = await organizationService.getOrganization(organization);

		if (!org) {
			return data(
				{
					success: false,
					error: "Organization not found",
				},
				{ status: 404 },
			);
		}

		// Get active rooms
		const rooms = await childCheckinService.getActiveRooms(organization);

		// Add active count to each room
		const roomsWithCounts = await Promise.all(
			rooms.map(async (room) => {
				const activeCount = await childCheckinService.getActiveCheckinsCount(
					room.id,
				);
				return { ...room, activeCount };
			}),
		);

		// If we have a verified cookie, get family data
		let familyData = null;
		if (
			verificationData?.familyId &&
			verificationData?.organizationId === organization
		) {
			familyData = await childCheckinService.getFamilyWithChildrenAndGuardians(
				verificationData.familyId,
			);

			if (familyData) {
				familyData.verified = true;

				// Check which children are already checked in
				if (familyData.children && familyData.children.length > 0) {
					familyData.children = await Promise.all(
						familyData.children.map(async (child) => {
							// Check if the child is already checked in and get room info
							const activeCheckin =
								await childCheckinService.getActiveChildCheckin(child.id);

							if (activeCheckin) {
								return {
									...child,
									isCheckedIn: true,
									checkedInRoom: activeCheckin.room,
								};
							}

							return {
								...child,
								isCheckedIn: false,
							};
						}),
					);
				}
			}
		}

		return data({
			success: true,
			organization: org,
			rooms: roomsWithCounts,
			familyData,
			currentStep: step,
		});
	} catch (error) {
		console.error("Error in checkin loader:", error);
		return data(
			{
				success: false,
				error: "Error loading check-in data",
			},
			{ status: 500 },
		);
	}
}

// Action to handle form submissions
export async function action({ params, request }) {
	const { organization } = params;
	const formData = await request.formData();
	const intent = formData.get("intent");

	// Get organization name for verification texts
	const org = await db.query.churchOrganization.findFirst({
		where: eq(churchOrganization.id, organization),
	});
	const organizationName = org?.name || "Church";

	// Get organization details using the service
	const orgDetails = await organizationService.getOrganization(organization);

	if (!orgDetails) {
		return data(
			{
				success: false,
				error: "Organization not found",
			},
			{ status: 404 },
		);
	}

	// Handle different action intents
	switch (intent) {
		case "verify-phone": {
			const phone = formData.get("phone")?.toString().trim();

			if (!phone) {
				return data({ success: false, error: "Phone number is required" });
			}

			try {
				// Generate and store verification code
				const code = verificationService.storeVerificationCode(
					phone,
					organization,
				);

				// Send verification code
				const smsSent = await verificationService.sendVerificationCodeSMS(
					phone,
					code,
					organization,
					orgDetails.name,
				);

				if (!smsSent) {
					return data({
						success: false,
						error: "Failed to send verification code",
					});
				}

				return data({
					success: true,
					phone,
					step: "verify",
				});
			} catch (error) {
				console.error("Error sending verification code:", error);
				return data({
					success: false,
					error: "Error sending verification code",
				});
			}
		}

		case "verify-code": {
			const phone = formData.get("phone")?.toString().trim();
			const code = formData.get("verificationCode")?.toString().trim();

			if (!phone || !code) {
				return data({
					success: false,
					error: "Phone and verification code are required",
				});
			}

			try {
				// Verify the code
				const verification = verificationService.verifyCode(
					phone,
					organization,
					code,
				);

				if (!verification.valid) {
					return data({
						success: false,
						error: verification.reason || "Invalid verification code",
					});
				}

				// Find user and family by phone
				const user = await childCheckinService.getUserByPhone(phone);

				if (!user) {
					return data({
						success: false,
						error: "No user found with this phone number",
						step: "phone",
					});
				}

				// Get family for this user
				const familyResult = await childCheckinService.handlePhoneSearch(
					phone,
					organization,
				);

				if (!familyResult.success || !familyResult.family) {
					return data({
						success: false,
						error: familyResult.message || "No family found for this user",
						step: "phone",
					});
				}

				// Get full family data
				const familyData =
					await childCheckinService.getFamilyWithChildrenAndGuardians(
						familyResult.family.id,
					);

				// Create verification session
				const cookieHeader =
					await verificationService.createVerificationSession(
						familyResult.family.id,
						organization,
					);

				return data(
					{
						success: true,
						familyData,
						step: "select-child",
					},
					{
						headers: {
							"Set-Cookie": cookieHeader,
						},
					},
				);
			} catch (error) {
				console.error("Error verifying code:", error);
				return data({
					success: false,
					error: "Error verifying code",
				});
			}
		}

		case "check-in": {
			const childId = formData.get("childId")?.toString();
			const roomId = formData.get("roomId")?.toString();
			const guardianId = formData.get("guardianId")?.toString();

			if (!childId || !roomId || !guardianId) {
				return data({
					success: false,
					error: "Child, room, and guardian are required",
				});
			}

			try {
				// Process the check-in
				const checkinResult = await childCheckinService.processCheckin(
					childId,
					roomId,
					guardianId,
					organization,
				);

				if (!checkinResult.success) {
					return data({
						success: false,
						error: checkinResult.message || "Failed to check in child",
					});
				}

				// Get the guardian's phone number
				const guardian = await db.query.users.findFirst({
					where: eq(users.id, guardianId),
				});

				// Generate QR code URL
				const host = new URL(request.url).origin;
				const qrCodeUrl = `${host}/landing/${organization}/childcheckin/verify/${checkinResult.checkin.secureId}`;

				// Send verification QR code as text message to guardian if phone is available
				if (guardian?.phone) {
					// Create message content with QR code link
					const message = `Thank you for checking in at ${organizationName}. Use this link to access your child's verification QR code: ${qrCodeUrl}`;

					// Send SMS via MessagingService
					await MessagingService.sendSMS(
						{
							churchOrganizationId: organization,
							messageType: "sms",
							message,
							senderUserId: guardianId, // Use the guardian's ID instead of "system"
						},
						{
							phone: guardian.phone,
							firstName: guardian.firstName,
							lastName: guardian.lastName,
							preferences: {
								// Override preferences for verification codes
								smsNotifications: true,
							},
						},
						organizationName,
					);
				}

				return data({
					success: true,
					checkin: checkinResult.checkin,
					step: "confirmed",
					qrCodeUrl,
				});
			} catch (error) {
				console.error("Error checking in child:", error);
				return data({
					success: false,
					error: "Error checking in child",
				});
			}
		}

		case "add-child": {
			// Get family ID from verification cookie
			const verificationData =
				await verificationService.getVerificationFromCookie(request);

			if (!verificationData?.familyId) {
				return data({
					success: false,
					error: "You must be verified to add a child",
				});
			}

			const firstName = formData.get("firstName");
			const lastName = formData.get("lastName");
			const dateOfBirth = formData.get("dateOfBirth");
			const allergies = formData.get("allergies");
			const specialNotes = formData.get("specialNotes");

			if (!firstName || !lastName || !dateOfBirth) {
				return data({
					success: false,
					error: "Child details are incomplete",
				});
			}

			try {
				// Create new child with proper type handling
				const child = await childCheckinService.createChild({
					firstName: firstName.toString(),
					lastName: lastName.toString(),
					dateOfBirth: new Date(dateOfBirth.toString()),
					allergies: allergies?.toString() || "",
					specialNotes: specialNotes?.toString() || "",
					familyId: verificationData.familyId,
					churchOrganizationId: organization,
					updatedAt: new Date(),
				});

				// Get updated family data
				const familyData =
					await childCheckinService.getFamilyWithChildrenAndGuardians(
						verificationData.familyId,
					);

				return data({
					success: true,
					child,
					familyData,
					step: "select-child",
				});
			} catch (error) {
				console.error("Error adding child:", error);
				return data({
					success: false,
					error: "Error adding child",
				});
			}
		}

		case "update-child": {
			// Get family ID from verification cookie
			const verificationData =
				await verificationService.getVerificationFromCookie(request);

			if (!verificationData?.familyId) {
				return data({
					success: false,
					error: "You must be verified to update a child",
				});
			}

			const childId = formData.get("childId");
			const firstName = formData.get("firstName");
			const lastName = formData.get("lastName");
			const dateOfBirth = formData.get("dateOfBirth");
			const allergies = formData.get("allergies");
			const specialNotes = formData.get("specialNotes");

			if (!childId || !firstName || !lastName || !dateOfBirth) {
				return data({
					success: false,
					error: "Child details are incomplete",
				});
			}

			try {
				// Update child with explicit type handling for allergies and specialNotes
				const updatedChild = await childCheckinService.updateChild(
					childId.toString(),
					{
						firstName: firstName.toString(),
						lastName: lastName.toString(),
						dateOfBirth: new Date(dateOfBirth.toString()),
						allergies: allergies?.toString() || "",
						specialNotes: specialNotes?.toString() || "",
						updatedAt: new Date(),
					},
				);

				// Get updated family data
				const familyData =
					await childCheckinService.getFamilyWithChildrenAndGuardians(
						verificationData.familyId,
					);

				return data({
					success: true,
					child: updatedChild,
					familyData,
					step: "select-child",
				});
			} catch (error) {
				console.error("Error updating child:", error);
				return data({
					success: false,
					error: "Error updating child",
				});
			}
		}

		case "remove-child": {
			// Get family ID from verification cookie
			const verificationData =
				await verificationService.getVerificationFromCookie(request);

			if (!verificationData?.familyId) {
				return data({
					success: false,
					error: "You must be verified to remove a child",
				});
			}

			const childId = formData.get("childId")?.toString();

			if (!childId) {
				return data({
					success: false,
					error: "Child ID is required",
				});
			}

			try {
				// Remove child
				const result = await childCheckinService.removeChild(childId);

				if (!result.success) {
					return data({
						success: false,
						error: result.message || "Failed to remove child",
					});
				}

				// Get updated family data
				const familyData =
					await childCheckinService.getFamilyWithChildrenAndGuardians(
						verificationData.familyId,
					);

				return data({
					success: true,
					familyData,
					step: "select-child",
				});
			} catch (error) {
				console.error("Error removing child:", error);
				return data({
					success: false,
					error: "Error removing child",
				});
			}
		}

		case "add-guardian": {
			// Get family ID from verification cookie
			const verificationData =
				await verificationService.getVerificationFromCookie(request);

			if (!verificationData?.familyId) {
				return data({
					success: false,
					error: "You must be verified to add a guardian",
				});
			}

			const firstName = formData.get("firstName");
			const lastName = formData.get("lastName");
			const phone = formData.get("phone");
			const email = formData.get("email");
			const relationship = formData.get("relationship");

			if (!firstName || !lastName || !phone || !relationship) {
				return data({
					success: false,
					error: "Guardian details are incomplete",
				});
			}

			try {
				// Check if user already exists with this phone
				let user = await childCheckinService.getUserByPhone(phone.toString());

				// If not, create new user
				if (!user) {
					user = await childCheckinService.createUser({
						firstName: firstName.toString(),
						lastName: lastName.toString(),
						phone: phone.toString(),
						email: email?.toString() || "",
						churchOrganizationId: organization,
						updatedAt: new Date(),
					});
				}

				// Link user to family
				await childCheckinService.linkUserToFamily({
					userId: user.id,
					familyId: verificationData.familyId,
					relationship: relationship.toString(),
					updatedAt: new Date(),
				});

				// Get updated family data
				const familyData =
					await childCheckinService.getFamilyWithChildrenAndGuardians(
						verificationData.familyId,
					);

				return data({
					success: true,
					user,
					familyData,
					step: "select-child",
				});
			} catch (error) {
				console.error("Error adding guardian:", error);
				return data({
					success: false,
					error: "Error adding guardian",
				});
			}
		}

		case "remove-guardian": {
			// Get family ID from verification cookie
			const verificationData =
				await verificationService.getVerificationFromCookie(request);

			if (!verificationData?.familyId) {
				return data({
					success: false,
					error: "You must be verified to remove a guardian",
				});
			}

			const userId = formData.get("userId")?.toString();

			if (!userId) {
				return data({
					success: false,
					error: "User ID is required",
				});
			}

			try {
				// Remove guardian from family
				const result = await childCheckinService.removeGuardian(
					userId,
					verificationData.familyId,
				);

				if (!result.success) {
					return data({
						success: false,
						error: result.message || "Failed to remove guardian",
					});
				}

				// Get updated family data
				const familyData =
					await childCheckinService.getFamilyWithChildrenAndGuardians(
						verificationData.familyId,
					);

				return data({
					success: true,
					familyData,
					step: "select-child",
				});
			} catch (error) {
				console.error("Error removing guardian:", error);
				return data({
					success: false,
					error: "Error removing guardian",
				});
			}
		}

		default:
			return data({
				success: false,
				error: "Unknown action",
			});
	}
}

// Child check-in content component
function ChildCheckinContent({ organization, rooms }) {
	const loaderData = useLoaderData();
	const fetcher = useFetcher();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const { organization: orgId } = useParams();

	// Define steps
	const STEPS = {
		PHONE: 0,
		VERIFY: 1,
		SELECT_CHILD: 2,
		CONFIRM: 3,
	};

	// Use query param for step, default to "phone"
	const currentStep = searchParams.get("step") || "phone";

	// Convert string step to numeric index for stepper
	const getStepIndex = (step) => {
		switch (step) {
			case "phone":
				return STEPS.PHONE;
			case "verify":
				return STEPS.VERIFY;
			case "select-child":
				return STEPS.SELECT_CHILD;
			case "confirmed":
				return STEPS.CONFIRM;
			default:
				return STEPS.PHONE;
		}
	};

	// State variables
	const [phoneNumber, setPhoneNumber] = useState("");
	const [verificationCode, setVerificationCode] = useState("");
	const [familyData, setFamilyData] = useState(loaderData.familyData || null);
	const [selectedChildren, setSelectedChildren] = useState([]);
	const [isWorkerMode, setIsWorkerMode] = useState(false);
	const [showEditFamily, setShowEditFamily] = useState(false);
	const [childBeingEdited, setChildBeingEdited] = useState(null);
	const [guardianBeingAdded, setGuardianBeingAdded] = useState(false);
	const [qrCodeUrl, setQrCodeUrl] = useState("");
	const [checkedInChildren, setCheckedInChildren] = useState([]);

	// Get current step index
	const currentStepIndex = getStepIndex(currentStep);

	// Check for pre-verified session from loader
	useEffect(() => {
		if (loaderData?.familyData?.verified && currentStep !== "edit-family") {
			setFamilyData(loaderData.familyData);

			// If we have family data but are on the phone or verify step, move forward
			if (currentStep === "phone" || currentStep === "verify") {
				setSearchParams({ step: "select-child" });
			}
		}
	}, [loaderData, currentStep, setSearchParams]);

	// Process fetcher results
	useEffect(() => {
		if (fetcher.state === "idle" && fetcher.data) {
			if (fetcher.data.success) {
				// Handle successful actions
				if (fetcher.data.step) {
					setSearchParams({ step: fetcher.data.step });
				}

				// Update family data if provided
				if (fetcher.data.familyData) {
					setFamilyData(fetcher.data.familyData);
				}

				// Handle phone verification specific data
				if (fetcher.data.phone) {
					setPhoneNumber(fetcher.data.phone);
				}

				// Handle child selection
				if (fetcher.data.checkin) {
					// Reset selection after successful check-in
					setSelectedChildren([]);
				}
			} else if (fetcher.data.error) {
				// Show error message
				toast.error(fetcher.data.error);
			}
		}
	}, [fetcher.state, fetcher.data, setSearchParams]);

	// Handle check-in responses
	useEffect(() => {
		if (fetcher.data && fetcher.data.success) {
			// Handle check-in response
			if (
				fetcher.data.checkin &&
				fetcher.formData?.get("intent") === "check-in"
			) {
				// If QR code URL is returned, store it
				if (fetcher.data.qrCodeUrl) {
					setQrCodeUrl(fetcher.data.qrCodeUrl);
				}
			}
		}
	}, [fetcher.data, fetcher.formData]);

	// Handle form submissions
	const handlePhoneSearch = (e) => {
		e.preventDefault();

		if (!phoneNumber.trim()) {
			toast.error("Please enter a phone number");
			return;
		}

		fetcher.submit(
			{
				intent: "verify-phone",
				phone: phoneNumber,
			},
			{ method: "POST" },
		);
	};

	const handleVerifyCode = (e) => {
		e.preventDefault();

		if (!verificationCode.trim()) {
			toast.error("Please enter the verification code");
			return;
		}

		fetcher.submit(
			{
				intent: "verify-code",
				phone: phoneNumber,
				verificationCode,
			},
			{ method: "POST" },
		);
	};

	const handleResendCode = () => {
		fetcher.submit(
			{
				intent: "verify-phone",
				phone: phoneNumber,
			},
			{ method: "POST" },
		);
		toast.info("Verification code resent");
	};

	// Replace handleChildSelect with toggleChildSelection for multi-select
	const toggleChildSelection = (child) => {
		// If child is already checked in, don't allow selection
		if (child.isCheckedIn) {
			toast.error(
				`${child.firstName} is already checked in. Please check them out first.`,
			);
			return;
		}

		setSelectedChildren((prevSelected) => {
			// Check if the child is already selected
			const isSelected = prevSelected.some((c) => c.id === child.id);

			if (isSelected) {
				// Remove child if already selected
				return prevSelected.filter((c) => c.id !== child.id);
			} else {
				// Add child if not selected
				return [...prevSelected, child];
			}
		});
	};

	// Calculate child's age in months
	const getChildAgeInMonths = (dateOfBirth) => {
		const dob = new Date(dateOfBirth);
		const today = new Date();

		const monthDiff =
			(today.getFullYear() - dob.getFullYear()) * 12 +
			(today.getMonth() - dob.getMonth());

		return monthDiff;
	};

	// Find the best room for a child based on age
	const findRoomForChild = (child, availableRooms) => {
		if (
			!child ||
			!child.dateOfBirth ||
			!availableRooms ||
			availableRooms.length === 0
		) {
			return null;
		}

		const ageInMonths = getChildAgeInMonths(child.dateOfBirth);

		// First try to find a room with matching min and max age
		const exactMatch = availableRooms.find((room) => {
			// If both min and max age are specified
			if (room.minAge !== null && room.maxAge !== null) {
				return ageInMonths >= room.minAge && ageInMonths <= room.maxAge;
			}
			// If only min age is specified
			else if (room.minAge !== null && room.maxAge === null) {
				return ageInMonths >= room.minAge;
			}
			// If only max age is specified
			else if (room.minAge === null && room.maxAge !== null) {
				return ageInMonths <= room.maxAge;
			}
			return false;
		});

		if (exactMatch) {
			return exactMatch;
		}

		// If no exact match, find the closest room or return the first room
		// with no age restrictions
		const roomWithNoRestrictions = availableRooms.find(
			(room) => room.minAge === null && room.maxAge === null,
		);

		if (roomWithNoRestrictions) {
			return roomWithNoRestrictions;
		}

		// If all else fails, return the first room
		return availableRooms[0];
	};

	// Modified check-in handler for multiple children
	const handleCheckin = () => {
		if (selectedChildren.length === 0) {
			toast.error("Please select at least one child");
			return;
		}

		// Reset checked-in children
		setCheckedInChildren([]);

		// For each selected child, submit a check-in request
		selectedChildren.forEach((child) => {
			// Find appropriate room for this child
			const room = findRoomForChild(child, rooms);

			if (!room) {
				toast.error(`No suitable room found for ${child.firstName}`);
				return;
			}

			// Use the first guardian's ID if available
			if (!familyData.guardians || familyData.guardians.length === 0) {
				toast.error("No guardian found for check-in");
				return;
			}

			const guardianId = familyData.guardians[0]?.id;

			if (!guardianId) {
				toast.error("Invalid guardian ID for check-in");
				return;
			}

			// Store the child and assigned room for display in the confirmation screen
			setCheckedInChildren((prev) => [
				...prev,
				{
					...child,
					room: room,
				},
			]);

			fetcher.submit(
				{
					intent: "check-in",
					childId: child.id,
					roomId: room.id,
					guardianId: guardianId,
				},
				{ method: "POST" },
			);
		});

		// Move directly to confirmation step
		setSearchParams({ step: "confirmed" });
	};

	const toggleWorkerMode = () => {
		setIsWorkerMode(!isWorkerMode);
		if (isWorkerMode) {
			// Reset state when exiting worker mode
			setPhoneNumber("");
			setVerificationCode("");
			setFamilyData(null);
		}
	};

	const handleEditFamily = () => {
		setShowEditFamily(true);
		setSearchParams({ step: "edit-family" });
	};

	const handleAddChild = (e) => {
		e.preventDefault();
		const formData = new FormData(e.target);
		fetcher.submit(formData, {
			method: "POST",
		});
		e.target.reset();
	};

	const handleUpdateChild = (e) => {
		e.preventDefault();
		const formData = new FormData(e.target);
		fetcher.submit(formData, {
			method: "POST",
		});
		setChildBeingEdited(null);
		e.target.reset();
	};

	const handleRemoveChild = (childId) => {
		fetcher.submit(
			{
				intent: "remove-child",
				childId,
			},
			{ method: "POST" },
		);
	};

	const handleAddGuardian = (e) => {
		e.preventDefault();
		const formData = new FormData(e.target);
		fetcher.submit(formData, {
			method: "POST",
		});
		setGuardianBeingAdded(false);
		e.target.reset();
	};

	const handleRemoveGuardian = (userId) => {
		fetcher.submit(
			{
				intent: "remove-guardian",
				userId,
			},
			{ method: "POST" },
		);
	};

	// Render the appropriate step content
	const renderStepContent = () => {
		switch (currentStep) {
			case "phone":
				return (
					<div className="space-y-6">
						<div className="text-center">
							<h2 className="text-2xl font-bold">{organization.name}</h2>
							<p className="text-sm text-muted-foreground">
								Enter your phone number to begin the check-in process
							</p>
						</div>
						<form onSubmit={handlePhoneSearch} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="phone">Phone Number</Label>
								<Input
									id="phone"
									type="tel"
									placeholder="(xxx) xxx-xxxx"
									value={phoneNumber}
									onChange={(e) => setPhoneNumber(e.target.value)}
									required
								/>
							</div>
							<Button
								type="submit"
								className="w-full"
								disabled={fetcher.state !== "idle"}
							>
								{fetcher.state !== "idle" ? "Sending Code..." : "Continue"}
							</Button>
						</form>
					</div>
				);

			case "verify":
				return (
					<div className="space-y-6">
						<div className="text-center">
							<h2 className="text-2xl font-bold">Verify Your Phone</h2>
							<p className="text-sm text-muted-foreground">
								Enter the 6-digit code sent to {phoneNumber}
							</p>
						</div>
						<form onSubmit={handleVerifyCode} className="space-y-4">
							<input type="hidden" name="phone" value={phoneNumber} />
							<div className="space-y-2">
								<Label htmlFor="verificationCode">Verification Code</Label>
								<Input
									id="verificationCode"
									type="text"
									placeholder="123456"
									value={verificationCode}
									onChange={(e) => setVerificationCode(e.target.value)}
									required
								/>
							</div>
							<Button
								type="submit"
								className="w-full"
								disabled={fetcher.state !== "idle"}
							>
								{fetcher.state !== "idle" ? "Verifying..." : "Verify Code"}
							</Button>
							<button
								type="button"
								className="w-full text-center text-sm text-blue-600 hover:underline mt-2"
								onClick={handleResendCode}
								disabled={fetcher.state !== "idle"}
							>
								Resend Code
							</button>
						</form>
					</div>
				);

			case "select-child":
				return (
					<div className="space-y-6">
						<div className="text-center">
							<h2 className="text-2xl font-bold">Select Children</h2>
							<p className="text-sm text-muted-foreground">
								Choose which children you want to check in
							</p>
						</div>
						{familyData?.children && familyData.children.length > 0 ? (
							<div className="space-y-4">
								{familyData.children.map((child) => (
									<Card
										key={child.id}
										className={`cursor-pointer hover:border-primary transition-colors ${
											selectedChildren.some((c) => c.id === child.id)
												? "border-primary bg-primary/5"
												: ""
										} ${child.isCheckedIn ? "opacity-70" : ""}`}
										onClick={() => toggleChildSelection(child)}
									>
										<CardHeader className="p-4">
											<CardTitle className="text-lg flex justify-between items-center">
												<span>
													{child.firstName} {child.lastName}
												</span>
												<div className="flex items-center">
													{child.isCheckedIn && (
														<Badge className="mr-2 bg-green-600">
															Already Checked In
															{child.checkedInRoom &&
																` - ${child.checkedInRoom.name}`}
														</Badge>
													)}
													{selectedChildren.some((c) => c.id === child.id) && (
														<Check className="h-5 w-5 text-primary" />
													)}
												</div>
											</CardTitle>
											<CardDescription>
												{new Date(child.dateOfBirth).toLocaleDateString()}
												{child.isCheckedIn && child.checkedInRoom && (
													<div className="mt-1 text-sm text-muted-foreground">
														Room:{" "}
														<span className="font-medium">
															{child.checkedInRoom.name}
														</span>
													</div>
												)}
											</CardDescription>
										</CardHeader>
									</Card>
								))}

								{/* Check-in button for selected children */}
								{selectedChildren.length > 0 && (
									<Button className="w-full mt-4" onClick={handleCheckin}>
										Check In {selectedChildren.length}{" "}
										{selectedChildren.length === 1 ? "Child" : "Children"}
									</Button>
								)}

								<div className="flex justify-between items-center mt-6">
									<Button variant="outline" onClick={handleEditFamily}>
										Manage Family
									</Button>
									<Button
										variant="default"
										onClick={() => {
											setChildBeingEdited({});
											setShowEditFamily(true);
											setSearchParams({ step: "edit-family" });
										}}
									>
										<PlusIcon className="h-4 w-4 mr-2" />
										Add Child
									</Button>
								</div>
							</div>
						) : (
							<div className="text-center p-4">
								<p>No children found for this family.</p>
								<Button
									className="mt-4"
									onClick={() => {
										setChildBeingEdited({});
										setShowEditFamily(true);
										setSearchParams({ step: "edit-family" });
									}}
								>
									<PlusIcon className="h-4 w-4 mr-2" />
									Add Child
								</Button>
							</div>
						)}
					</div>
				);

			case "confirm":
				return (
					<div className="space-y-6">
						<div className="text-center">
							<h2 className="text-2xl font-bold">Confirm Check-in</h2>
							<p className="text-sm text-muted-foreground">
								Review and confirm check-in details
							</p>
						</div>
						{selectedChildren.length > 0 ? (
							<div className="space-y-4">
								{selectedChildren.map((child) => (
									<Card key={child.id}>
										<CardHeader>
											<CardTitle>Child</CardTitle>
											<CardDescription>
												{child.firstName} {child.lastName}
											</CardDescription>
										</CardHeader>
										{child.allergies && (
											<CardContent>
												<p className="text-sm font-medium text-yellow-500">
													Allergies: {child.allergies}
												</p>
											</CardContent>
										)}
									</Card>
								))}
								<div className="flex space-x-3 mt-6">
									<Button
										variant="outline"
										className="flex-1"
										onClick={() => setSearchParams({ step: "select-child" })}
									>
										Back
									</Button>
									<Button
										className="flex-1"
										onClick={handleCheckin}
										disabled={fetcher.state !== "idle"}
									>
										{fetcher.state !== "idle" ? "Processing..." : "Check In"}
									</Button>
								</div>
							</div>
						) : (
							<div className="text-center p-4">
								<p>
									Missing selection information. Please go back and try again.
								</p>
								<Button
									variant="outline"
									className="mt-4"
									onClick={() => setSearchParams({ step: "select-child" })}
								>
									Back to Selection
								</Button>
							</div>
						)}
					</div>
				);

			case "confirmed":
				return (
					<div className="space-y-6 text-center">
						<div>
							<CheckCircleIcon className="w-16 h-16 mx-auto text-green-500" />
							<h2 className="text-2xl font-bold mt-4">Check-in Complete!</h2>
							<p className="text-muted-foreground mb-4">
								{checkedInChildren.length === 1
									? `${checkedInChildren[0]?.firstName} has been checked in`
									: `${checkedInChildren.length} children have been checked in`}
							</p>
							{checkedInChildren.length > 0 && (
								<div className="mt-4 space-y-3">
									{checkedInChildren.map((child) => (
										<Card key={child.id} className="text-left p-3">
											<div className="flex justify-between items-center">
												<div>
													<p className="font-medium">
														{child.firstName} {child.lastName}
													</p>
													<p className="text-sm text-muted-foreground">
														Room:{" "}
														<span className="font-medium">
															{child.room?.name || "Unknown"}
														</span>
													</p>
												</div>
												<Badge className="bg-green-600">Checked In</Badge>
											</div>
										</Card>
									))}
								</div>
							)}
							{qrCodeUrl && (
								<p className="text-sm text-muted-foreground mt-4">
									A verification QR code has been sent to your phone for easy
									pickup.
								</p>
							)}
						</div>
						<Button
							className="w-full"
							onClick={() => {
								setSelectedChildren([]);
								setCheckedInChildren([]);
								setSearchParams({ step: "phone" });
								setPhoneNumber("");
								setVerificationCode("");
								setFamilyData(null);
							}}
						>
							Check in Another Child
						</Button>
					</div>
				);

			case "edit-family":
				return (
					<div className="space-y-6">
						<div className="text-center">
							<h2 className="text-2xl font-bold">Manage Family</h2>
							<p className="text-sm text-muted-foreground">
								Add or edit family members
							</p>
						</div>
						<Tabs defaultValue="children">
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="children">Children</TabsTrigger>
								<TabsTrigger value="guardians">Guardians</TabsTrigger>
							</TabsList>
							<TabsContent value="children" className="space-y-4 pt-4">
								{childBeingEdited ? (
									<Card>
										<CardHeader>
											<CardTitle>
												{childBeingEdited.id ? "Edit Child" : "Add Child"}
											</CardTitle>
										</CardHeader>
										<CardContent>
											<form
												onSubmit={
													childBeingEdited.id
														? handleUpdateChild
														: handleAddChild
												}
												className="space-y-4"
											>
												<input
													type="hidden"
													name="intent"
													value={
														childBeingEdited.id ? "update-child" : "add-child"
													}
												/>
												{childBeingEdited.id && (
													<input
														type="hidden"
														name="childId"
														value={childBeingEdited.id}
													/>
												)}
												<div className="space-y-2">
													<Label htmlFor="firstName">First Name</Label>
													<Input
														id="firstName"
														name="firstName"
														defaultValue={childBeingEdited.firstName || ""}
														required
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="lastName">Last Name</Label>
													<Input
														id="lastName"
														name="lastName"
														defaultValue={childBeingEdited.lastName || ""}
														required
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="dateOfBirth">Date of Birth</Label>
													<Input
														id="dateOfBirth"
														name="dateOfBirth"
														type="date"
														defaultValue={
															childBeingEdited.dateOfBirth
																? new Date(childBeingEdited.dateOfBirth)
																		.toISOString()
																		.split("T")[0]
																: ""
														}
														required
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="allergies">Allergies</Label>
													<Input
														id="allergies"
														name="allergies"
														defaultValue={childBeingEdited.allergies || ""}
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="specialNotes">Special Notes</Label>
													<Textarea
														id="specialNotes"
														name="specialNotes"
														defaultValue={childBeingEdited.specialNotes || ""}
													/>
												</div>
												<div className="flex space-x-3">
													<Button
														type="button"
														variant="outline"
														className="flex-1"
														onClick={() => setChildBeingEdited(null)}
													>
														Cancel
													</Button>
													<Button type="submit" className="flex-1">
														Save
													</Button>
												</div>
											</form>
										</CardContent>
									</Card>
								) : (
									<>
										{familyData?.children && familyData.children.length > 0 ? (
											<div className="space-y-3">
												{familyData.children.map((child) => (
													<Card key={child.id}>
														<CardHeader className="pb-2">
															<CardTitle className="text-lg flex justify-between items-center">
																<span>
																	{child.firstName} {child.lastName}
																</span>
																<div className="flex space-x-2">
																	<Button
																		variant="ghost"
																		size="icon"
																		onClick={() => setChildBeingEdited(child)}
																	>
																		<PencilIcon className="h-4 w-4" />
																	</Button>
																	<Button
																		variant="ghost"
																		size="icon"
																		onClick={() => handleRemoveChild(child.id)}
																	>
																		<TrashIcon className="h-4 w-4" />
																	</Button>
																</div>
															</CardTitle>
															<CardDescription>
																{new Date(
																	child.dateOfBirth,
																).toLocaleDateString()}
															</CardDescription>
														</CardHeader>
														{(child.allergies || child.specialNotes) && (
															<CardContent className="pt-0">
																{child.allergies && (
																	<p className="text-sm text-yellow-500">
																		<strong>Allergies:</strong>{" "}
																		{child.allergies}
																	</p>
																)}
																{child.specialNotes && (
																	<p className="text-sm mt-1">
																		<strong>Notes:</strong> {child.specialNotes}
																	</p>
																)}
															</CardContent>
														)}
													</Card>
												))}
											</div>
										) : (
											<div className="text-center p-4">
												<p>No children found for this family.</p>
											</div>
										)}
										<div className="mt-4">
											<Button
												className="w-full"
												onClick={() => setChildBeingEdited({})}
											>
												<PlusIcon className="h-4 w-4 mr-2" />
												Add Child
											</Button>
										</div>
									</>
								)}
							</TabsContent>
							<TabsContent value="guardians" className="space-y-4 pt-4">
								{guardianBeingAdded ? (
									<Card>
										<CardHeader>
											<CardTitle>Add Guardian</CardTitle>
										</CardHeader>
										<CardContent>
											<form onSubmit={handleAddGuardian} className="space-y-4">
												<input
													type="hidden"
													name="intent"
													value="add-guardian"
												/>
												<div className="space-y-2">
													<Label htmlFor="firstName">First Name</Label>
													<Input id="firstName" name="firstName" required />
												</div>
												<div className="space-y-2">
													<Label htmlFor="lastName">Last Name</Label>
													<Input id="lastName" name="lastName" required />
												</div>
												<div className="space-y-2">
													<Label htmlFor="phone">Phone Number</Label>
													<Input
														id="phone"
														name="phone"
														type="tel"
														placeholder="(xxx) xxx-xxxx"
														required
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="email">Email (Optional)</Label>
													<Input id="email" name="email" type="email" />
												</div>
												<div className="space-y-2">
													<Label htmlFor="relationship">Relationship</Label>
													<Select name="relationship" defaultValue="parent">
														<SelectTrigger>
															<SelectValue placeholder="Select relationship" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="parent">Parent</SelectItem>
															<SelectItem value="grandparent">
																Grandparent
															</SelectItem>
															<SelectItem value="aunt-uncle">
																Aunt/Uncle
															</SelectItem>
															<SelectItem value="sibling">Sibling</SelectItem>
															<SelectItem value="other">Other</SelectItem>
														</SelectContent>
													</Select>
												</div>
												<div className="flex space-x-3">
													<Button
														type="button"
														variant="outline"
														className="flex-1"
														onClick={() => setGuardianBeingAdded(false)}
													>
														Cancel
													</Button>
													<Button type="submit" className="flex-1">
														Save
													</Button>
												</div>
											</form>
										</CardContent>
									</Card>
								) : (
									<>
										{familyData?.guardians &&
										familyData.guardians.length > 0 ? (
											<div className="space-y-3">
												{familyData.guardians.map((guardian) => (
													<Card key={guardian.id}>
														<CardHeader className="pb-2">
															<CardTitle className="text-lg flex justify-between items-center">
																<span>
																	{guardian.firstName} {guardian.lastName}
																</span>
																{familyData.guardians.length > 1 && (
																	<Button
																		variant="ghost"
																		size="icon"
																		onClick={() =>
																			handleRemoveGuardian(guardian.id)
																		}
																	>
																		<TrashIcon className="h-4 w-4" />
																	</Button>
																)}
															</CardTitle>
															<CardDescription>
																{guardian.phone}
																{guardian.email && ` • ${guardian.email}`}
															</CardDescription>
														</CardHeader>
													</Card>
												))}
											</div>
										) : (
											<div className="text-center p-4">
												<p>No guardians found for this family.</p>
											</div>
										)}
										<div className="mt-4">
											<Button
												className="w-full"
												onClick={() => setGuardianBeingAdded(true)}
											>
												<PlusIcon className="h-4 w-4 mr-2" />
												Add Guardian
											</Button>
										</div>
									</>
								)}
							</TabsContent>
						</Tabs>
						<Button
							variant="outline"
							className="w-full"
							onClick={() => {
								setShowEditFamily(false);
								setSearchParams({ step: "select-child" });
							}}
						>
							Back to Check-in
						</Button>
					</div>
				);

			default:
				return (
					<div className="text-center p-4">
						<p>Unknown step. Please start over.</p>
						<Button
							className="mt-4"
							onClick={() => setSearchParams({ step: "phone" })}
						>
							Start Over
						</Button>
					</div>
				);
		}
	};

	return (
		<div className="container max-w-md mx-auto py-8 px-4">
			{/* Step indicator */}
			{!showEditFamily && (
				<div className="mb-8">
					<div className="flex justify-between">
						{Object.keys(STEPS).map((step, index) => (
							<div
								key={step}
								className={`flex flex-col items-center ${
									index <= currentStepIndex
										? "text-primary"
										: "text-muted-foreground"
								}`}
							>
								<div
									className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
										index <= currentStepIndex
											? "bg-primary text-white"
											: "bg-muted text-muted-foreground"
									}`}
								>
									{index + 1}
								</div>
								<span className="text-xs hidden sm:block">
									{step.replace("_", " ").toLowerCase()}
								</span>
							</div>
						))}
					</div>
					<div className="relative mt-2">
						<div className="absolute top-0 left-0 right-0 h-1 bg-muted"></div>
						<div
							className="absolute top-0 left-0 h-1 bg-primary transition-all"
							style={{
								width: `${((currentStepIndex + 1) / Object.keys(STEPS).length) * 100}%`,
							}}
						></div>
					</div>
				</div>
			)}

			{/* Main content card */}
			<Card className="w-full">
				<CardContent className="pt-6">{renderStepContent()}</CardContent>
				<CardFooter className="flex justify-center border-t pt-6">
					<div className="text-center text-xs text-muted-foreground">
						{organization.name} • Child Check-in System
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}

export default function PublicChildCheckin() {
	const loaderData = useLoaderData();

	// Verify we have the required data before rendering the content
	if (!loaderData?.success) {
		return (
			<div className="container max-w-md mx-auto py-8 px-4">
				<Card className="w-full">
					<CardContent className="pt-6 text-center">
						<h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
						<p>
							{loaderData?.error ||
								"An error occurred loading the check-in system."}
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<ChildCheckinContent
			organization={loaderData.organization}
			rooms={loaderData.rooms}
		/>
	);
}
