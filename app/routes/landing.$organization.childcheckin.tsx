import { MessagingService } from "@/server/services/MessagingService";
import { useCallback, useEffect, useState } from "react";
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
	CardHeader,
	CardTitle
} from "~/components/ui/card";
import { Stepper } from "~/components/ui/stepper";
// Import services
import { FileUploadService } from "@/app/services/FileUploadService";
import { childCheckinService } from "~/services/ChildCheckinService";
import { organizationService } from "~/services/OrganizationService";
import { verificationService } from "~/services/VerificationService";

import { db } from "@/server/db";
import {
	churchOrganization,
	familiesTable,
	users
} from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { useCamera } from "~/components/CameraCapture";

// Import our new components
import { ChildSelectionStep } from "~/components/checkin/ChildSelectionStep";
import { ConfirmationStep } from "~/components/checkin/ConfirmationStep";
import { EditChildForm } from "~/components/checkin/EditChildForm";
import { PhoneVerificationStep } from "~/components/checkin/PhoneVerificationStep";
import type {
	CheckInSteps
} from "~/components/checkin/types";
import { UpdateUserInfoStep } from "~/components/checkin/UpdateUserInfoStep";
import { VerificationCodeStep } from "~/components/checkin/VerificationCodeStep";

// Define step names for the stepper
const STEPS: CheckInSteps = {
	PHONE: 0,
	VERIFY: 1,
	UPDATE_USER_INFO: 2,
	SELECT_CHILD: 3,
	CONFIRM: 4,
};

// The stepper names that will be displayed to the user
const STEP_NAMES = ["Phone", "Verify", "Child", "Confirm"];

// Simple in-memory cache with a timestamp
const loaderCache = {
	data: null,
	timestamp: 0,
	organizationId: null,
};

// Loader to fetch initial data - no authentication required
export async function loader({ params, request }) {
	const { organization } = params;
	const url = new URL(request.url);
	const step = url.searchParams.get("step") || "phone";

	// Check if we have a cached result for this organization that's less than 5 seconds old
	const now = Date.now();
	if (
		loaderCache.data &&
		loaderCache.organizationId === organization &&
		now - loaderCache.timestamp < 5000 && // 5 seconds cache
		!request.headers.get('Cache-Control')?.includes('no-cache') // Allow bypassing cache
	) {
		return loaderCache.data;
	}

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

		// Cache the result before returning
		const result = data({
			success: true,
			organization: org,
			rooms: roomsWithCounts,
			familyData,
			currentStep: step,
		});

		loaderCache.data = result;
		loaderCache.timestamp = now;
		loaderCache.organizationId = organization;

		return result;
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
	const actionType = formData.get("_action") || formData.get("intent");

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

	switch (actionType) {
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

				console.log("code", code);

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
				let familyResult;

				if (!user) {
					// This is a first-time user, create a new user and family
					// Create a new user with the phone number
					const newUser = await childCheckinService.createUser({
						phone,
						firstName: "Guest", // Default name that can be updated later
						lastName: "User",
						churchOrganizationId: organization,
						updatedAt: new Date(),
					});

					// Create a new family for this user
					const newFamily = await childCheckinService.createFamily({
						name: "Guest Family", // Default name that can be updated later
						churchOrganizationId: organization,
						updatedAt: new Date(),
					});

					// Link the user to the family
					await childCheckinService.linkUserToFamily({
						userId: newUser.id,
						familyId: newFamily.id,
						relationship: "parent",
						updatedAt: new Date(),
					});

					// Set the family result
					familyResult = {
						success: true,
						family: newFamily,
					};
				} else {
					// User exists, get their family
					familyResult = await childCheckinService.handlePhoneSearch(
						phone,
						organization,
					);

					if (!familyResult.success || !familyResult.family) {
						// User exists but has no family in this organization
						// Create a new family for this existing user
						const newFamily = await childCheckinService.createFamily({
							name: `${user.lastName} Family`,
							churchOrganizationId: organization,
							updatedAt: new Date(),
						});

						// Link the user to the family
						await childCheckinService.linkUserToFamily({
							userId: user.id,
							familyId: newFamily.id,
							relationship: "parent",
							updatedAt: new Date(),
						});

						// Set the family result
						familyResult = {
							success: true,
							family: newFamily,
						};
					}
				}

				if (!familyResult.success || !familyResult.family) {
					return data({
						success: false,
						error: familyResult.message || "Error creating or finding family",
						step: "phone",
					});
				}

				// Get full family data
				const familyData =
					await childCheckinService.getFamilyWithChildrenAndGuardians(
						familyResult.family.id,
					);

				// Ensure we have valid family data
				if (!familyData || !familyData.guardians || familyData.guardians.length === 0) {
					console.error("Failed to get complete family data with guardians");
					return data({
						success: false,
						error: "Failed to get complete family data",
						step: "phone",
					});
				}

				// Create verification session
				const cookieHeader =
					await verificationService.createVerificationSession(
						familyResult.family.id,
						organization,
					);

				// If this is a new user, we need to provide the user ID explicitly to update the info
				// This prevents issues with familyData not being properly loaded
				const isNewUser = !user;
				const userId = isNewUser ? familyData.guardians[0].id : null;

				return data(
					{
						success: true,
						familyData,
						step: isNewUser ? "update-user-info" : "select-child",
						isNewUser,
						userId, // Include the user ID for new users
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

		case "addChild":
		case "add-child": {
			// Get family ID from verification cookie
			const verificationData =
				await verificationService.getVerificationFromCookie(request);

			if (!verificationData?.familyId) {
				return data({
					success: false,
					error: "You must be verified to add a child",
					_action: "addChild"
				});
			}

			const firstName = formData.get("firstName");
			const lastName = formData.get("lastName");
			const dateOfBirth = formData.get("dateOfBirth");
			const allergies = formData.get("allergies");
			const specialNotes = formData.get("specialNotes");
			const childPhoto = formData.get("childPhoto");
			const photoDataUrl = formData.get("photoDataUrl");

			if (!firstName || !lastName || !dateOfBirth) {
				return data({
					success: false,
					error: "Child details are incomplete",
					_action: "addChild"
				});
			}

			// Photo is not mandatory for testing but would be in production
			try {
				let photoUrl = "";

				// If we have a data URL from the camera, use that directly
				if (photoDataUrl) {
					photoUrl = photoDataUrl.toString();
				}
				// Otherwise use the file upload if present
				else if (childPhoto instanceof File && childPhoto.size > 0) {
					// Upload the photo
					photoUrl = await FileUploadService.uploadChildPhoto(
						childPhoto,
						organization,
						`${firstName}-${lastName}-${Date.now()}`
					);
				}

				// Create new child
				const newChild = await childCheckinService.createChild({
					firstName: firstName.toString(),
					lastName: lastName.toString(),
					dateOfBirth: dateOfBirth.toString(),
					allergies: allergies?.toString() || "",
					specialNotes: specialNotes?.toString() || "",
					photoUrl,
					familyId: verificationData.familyId,
					churchOrganizationId: organization,
					updatedAt: new Date(),
				});

				if (!newChild) {
					return data({
						success: false,
						error: "Failed to add child",
						_action: "addChild"
					});
				}

				// Get updated family data
				const updatedFamilyData = await childCheckinService.getFamilyWithChildrenAndGuardians(
					verificationData.familyId
				);

				return data({
					success: true,
					message: "Child added successfully",
					_action: "addChild",
					familyData: updatedFamilyData
				});
			} catch (error) {
				console.error("Error adding child:", error);
				return data({
					success: false,
					error: "Error adding child",
					_action: "addChild"
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
			const childPhoto = formData.get("childPhoto");
			const photoDataUrl = formData.get("photoDataUrl");

			if (!childId || !firstName || !lastName || !dateOfBirth) {
				return data({
					success: false,
					error: "Child details are incomplete",
				});
			}

			try {
				// Check if we have a new photo to upload
				let photoUrl;

				// If we have a data URL from the camera, use that directly
				if (photoDataUrl) {
					photoUrl = photoDataUrl.toString();
				}
				// Otherwise check if we have a file upload
				else if (childPhoto instanceof File && childPhoto.size > 0) {
					// Upload the new photo
					photoUrl = await FileUploadService.uploadChildPhoto(
						childPhoto,
						organization,
						`${firstName}-${lastName}-${Date.now()}`
					);

					if (!photoUrl) {
						return data({
							success: false,
							error: "Failed to upload child photo",
						});
					}
				}

				// Create update object with explicit type handling for allergies and specialNotes
				const updateData: any = {
					firstName: firstName.toString(),
					lastName: lastName.toString(),
					dateOfBirth: new Date(dateOfBirth.toString()),
					allergies: allergies?.toString() || "",
					specialNotes: specialNotes?.toString() || "",
					updatedAt: new Date(),
				};

				// Only add photoUrl if a new photo was uploaded
				if (photoUrl) {
					updateData.photoUrl = photoUrl;
				}

				// Update child
				const updatedChild = await childCheckinService.updateChild(
					childId.toString(),
					updateData
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

		case "update-user-info": {
			// Get family ID from verification cookie
			const verificationData =
				await verificationService.getVerificationFromCookie(request);

			if (!verificationData?.familyId) {
				return data({
					success: false,
					error: "You must be verified to update user information",
				});
			}

			const userId = formData.get("userId")?.toString();
			const firstName = formData.get("firstName")?.toString();
			const lastName = formData.get("lastName")?.toString();
			const email = formData.get("email")?.toString();
			const familyName = formData.get("familyName")?.toString();

			if (!userId || !firstName || !lastName) {
				return data({
					success: false,
					error: "User details are incomplete",
				});
			}

			try {
				// Verify the user exists and is associated with this family
				const familyData = await childCheckinService.getFamilyWithChildrenAndGuardians(
					verificationData.familyId
				);

				if (!familyData || !familyData.guardians || !familyData.guardians.some(g => g.id === userId)) {
					return data({
						success: false,
						error: "User not found or not associated with this family",
					});
				}

				// Update user information
				await db.update(users)
					.set({
						firstName,
						lastName,
						email: email || null,
						updatedAt: new Date(),
					})
					.where(eq(users.id, userId));

				// Update family name if provided
				if (familyName) {
					await db.update(familiesTable)
						.set({
							name: familyName,
							updatedAt: new Date(),
						})
						.where(eq(familiesTable.id, verificationData.familyId));
				}

				// Get updated family data
				const updatedFamilyData =
					await childCheckinService.getFamilyWithChildrenAndGuardians(
						verificationData.familyId,
					);

				return data({
					success: true,
					familyData: updatedFamilyData,
					step: "select-child",
					resetNewUser: true,
				});
			} catch (error) {
				console.error("Error updating user information:", error);
				return data({
					success: false,
					error: "Error updating user information",
				});
			}
		}

		case "start-over": {
			try {
				// Clear the verification session
				const cookieHeader = await verificationService.clearVerificationSession();

				return data(
					{
						success: true,
						step: "phone",
					},
					{
						headers: {
							"Set-Cookie": cookieHeader,
						},
					},
				);
			} catch (error) {
				console.error("Error clearing session:", error);
				return data({
					success: false,
					error: "Error clearing session",
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

function ChildCheckinContent({ organization, rooms }) {
	const loaderData = useLoaderData();
	const fetcher = useFetcher();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const { organization: orgId } = useParams();

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
	const [isNewUser, setIsNewUser] = useState(false);
	const [newUserId, setNewUserId] = useState(null);
	const [showAddChildForm, setShowAddChildForm] = useState(false);
	const [showDebug, setShowDebug] = useState(false);

	// Use our camera hook
	const {
		showCamera,
		photoDataUrl,
		photoFile,
		openCamera,
		closeCamera,
		resetPhoto,
		CameraComponent
	} = useCamera();

	// Define steps
	const STEPS = {
		PHONE: 0,
		VERIFY: 1,
		UPDATE_USER_INFO: 2,
		SELECT_CHILD: 3,
		CONFIRM: 4,
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
			case "update-user-info":
				return STEPS.UPDATE_USER_INFO;
			case "select-child":
				return STEPS.SELECT_CHILD;
			case "confirmed":
				return STEPS.CONFIRM;
			default:
				return STEPS.PHONE;
		}
	};

	// Get current step index
	const currentStepIndex = getStepIndex(currentStep);

	// Check for pre-verified session from loader
	useEffect(() => {
		// Skip this effect if we're not on the initial steps
		if (currentStep === 'select-child' ||
			currentStep === 'confirmed' ||
			currentStep === 'edit-family' ||
			showAddChildForm ||
			childBeingEdited) {
			return;
		}

		// Only set family data and redirect if appropriate
		if (loaderData?.familyData?.verified) {
			setFamilyData(loaderData.familyData);

			// Avoid causing a navigation loop by checking current step
			if (currentStep === 'phone' || currentStep === 'verify') {
				setSearchParams({ step: "select-child" });
			}
		}
	}, [loaderData?.familyData?.verified, currentStep]);

	// Handle phone search
	const handlePhoneSearch = (e) => {
		e.preventDefault();

		fetcher.submit(
			{
				_action: "searchPhone",
				phoneNumber,
				organizationId: orgId,
			},
			{ method: "post" }
		);
	};

	// Handle verification code submission
	const handleVerifyCode = (e) => {
		e.preventDefault();

		fetcher.submit(
			{
				_action: "verifyCode",
				phoneNumber,
				verificationCode,
				organizationId: orgId,
			},
			{ method: "post" }
		);
	};

	// Handle resending verification code
	const handleResendCode = () => {
		fetcher.submit(
			{
				_action: "resendCode",
				phoneNumber,
				organizationId: orgId,
			},
			{ method: "post" }
		);
	};

	// Handle updating user info
	const handleUpdateUserInfo = (e) => {
		e.preventDefault();
		const formData = new FormData(e.target);
		formData.append("_action", "updateUserInfo");
		formData.append("organizationId", orgId);

		fetcher.submit(formData, { method: "post" });
	};

	// Handle starting over
	const handleStartOver = () => {
		setPhoneNumber("");
		setVerificationCode("");
		setFamilyData(null);
		setSelectedChildren([]);
		setCheckedInChildren([]);
		setQrCodeUrl("");
		setIsNewUser(false);
		setNewUserId(null);
		setSearchParams({ step: "phone" });
	};

	// Handle toggling child selection
	const toggleChildSelection = (child) => {
		const isSelected = selectedChildren.some(sc => sc.id === child.id);

		if (isSelected) {
			setSelectedChildren(selectedChildren.filter(sc => sc.id !== child.id));
		} else {
			setSelectedChildren([...selectedChildren, child]);
		}
	};

	// Calculate child age in months
	const getChildAgeInMonths = (dateOfBirth) => {
		try {
			const dob = new Date(dateOfBirth);
			const now = new Date();

			// Calculate months difference
			let months = (now.getFullYear() - dob.getFullYear()) * 12;
			months -= dob.getMonth();
			months += now.getMonth();

			return months <= 0 ? 0 : months;
		} catch (error) {
			console.error("Error calculating child age:", error);
			return 0;
		}
	};

	// Find appropriate room for child
	const findRoomForChild = (child, availableRooms) => {
		if (!child.dateOfBirth || !availableRooms || availableRooms.length === 0) {
			return null;
		}

		const ageInMonths = getChildAgeInMonths(child.dateOfBirth);

		// First find rooms where the child's age fits within the min and max age range
		const eligibleRooms = availableRooms.filter(
			room => ageInMonths >= room.minAgeMonths && ageInMonths <= room.maxAgeMonths
		);

		if (eligibleRooms.length === 0) {
			return null;
		}

		// If multiple rooms are eligible, prioritize rooms with fewer children
		// but still below capacity
		return eligibleRooms.sort((a, b) => {
			// If one room is at capacity and the other isn't, prioritize the one that's not at capacity
			if ((a.currentCount || 0) >= a.capacity && (b.currentCount || 0) < b.capacity) {
				return 1;
			}
			if ((b.currentCount || 0) >= b.capacity && (a.currentCount || 0) < a.capacity) {
				return -1;
			}

			// Otherwise, choose the room with fewer children
			return (a.currentCount || 0) - (b.currentCount || 0);
		})[0];
	};

	// Handle check-in submission
	const handleCheckin = () => {
		if (selectedChildren.length === 0) {
			toast.error("Please select at least one child");
			return;
		}

		// Get room assignments for each child
		const childrenWithRooms = selectedChildren.map(child => {
			const room = findRoomForChild(child, rooms);
			return {
				childId: child.id,
				roomId: room?.id,
			};
		});

		// Check if any child doesn't have a room
		const missingRooms = childrenWithRooms.filter(c => !c.roomId);
		if (missingRooms.length > 0) {
			toast.error("Some children don't have appropriate rooms available");
			return;
		}

		fetcher.submit(
			{
				_action: "checkin",
				children: JSON.stringify(childrenWithRooms),
				organizationId: orgId,
			},
			{ method: "post" }
		);
	};

	// Handle edit family
	const handleEditFamily = () => {
		setShowEditFamily(true);
	};

	// Handle start adding a child
	const handleStartAddChild = (e) => {
		// If called with an event, prevent default behavior
		if (e && e.preventDefault) {
			e.preventDefault();
		}

		// Set the state to show the add child form
		setShowAddChildForm(true);
		setChildBeingEdited(null);
		resetPhoto?.(); // Reset any existing photo
	};

	// Handle add child form submission
	const handleAddChild = (e) => {
		e.preventDefault();
		const formData = new FormData(e.target);
		formData.append("_action", "addChild");
		formData.append("organizationId", orgId);

		fetcher.submit(formData, { method: "post" });
	};

	// Handle cancel adding/editing child
	const handleCancelEditChild = () => {
		setShowAddChildForm(false);
		setChildBeingEdited(null);
		resetPhoto?.();
	};

	// Handle updating child
	const handleUpdateChild = (e) => {
		e.preventDefault();
		const formData = new FormData(e.target);
		formData.append("_action", "updateChild");
		formData.append("organizationId", orgId);

		fetcher.submit(formData, { method: "post" });
		setChildBeingEdited(null);
	};

	// toggle debug panel
	const toggleDebug = useCallback(() => {
		setShowDebug(prev => !prev);
	}, []);

	// Render content based on current step
	const renderStepContent = () => {
		// If we're adding/editing a child, show that form instead of the normal step content
		if (showAddChildForm || childBeingEdited) {
			return (
				<EditChildForm
					child={childBeingEdited}
					onSubmit={childBeingEdited ? handleUpdateChild : handleAddChild}
					onCancel={handleCancelEditChild}
					isLoading={fetcher.state !== "idle"}
					openCamera={openCamera}
					photoDataUrl={photoDataUrl}
				/>
			);
		}

		// Otherwise, render the normal step content
		switch (currentStep) {
			case "phone":
				return (
					<PhoneVerificationStep
						phoneNumber={phoneNumber}
						onPhoneNumberChange={setPhoneNumber}
						onSubmit={handlePhoneSearch}
						isLoading={fetcher.state !== "idle"}
					/>
				);

			case "verify":
				return (
					<VerificationCodeStep
						verificationCode={verificationCode}
						onVerificationCodeChange={setVerificationCode}
						onSubmit={handleVerifyCode}
						onResendCode={handleResendCode}
						isLoading={fetcher.state !== "idle"}
						phoneNumber={phoneNumber}
					/>
				);

			case "update-user-info":
				return (
					<UpdateUserInfoStep
						familyData={familyData}
						isNewUser={isNewUser}
						userId={newUserId}
						onSubmit={handleUpdateUserInfo}
						onStartOver={handleStartOver}
						isLoading={fetcher.state !== "idle"}
					/>
				);

			case "select-child":
				return (
					<ChildSelectionStep
						familyData={familyData}
						selectedChildren={selectedChildren}
						onChildToggle={toggleChildSelection}
						onEditFamily={handleEditFamily}
						onAddChild={handleStartAddChild}
						findRoomForChild={findRoomForChild}
						getChildAgeInMonths={getChildAgeInMonths}
						onProceed={handleCheckin}
						isLoading={fetcher.state !== "idle"}
						rooms={rooms}
					/>
				);

			case "confirmed":
				return (
					<ConfirmationStep
						checkedInChildren={checkedInChildren}
						findRoomForChild={findRoomForChild}
						onStartOver={handleStartOver}
						qrCodeUrl={qrCodeUrl}
						rooms={rooms}
					/>
				);

			default:
				return null;
		}
	};

	// Process fetcher data with explicit handling for the add child response
	useEffect(() => {
		// Skip if there's no fetcher data or we're not in the idle state yet
		if (!fetcher.data || fetcher.state !== 'idle') return;

		// Handle response from phone search
		if (fetcher.data._action === "searchPhone") {
			if (fetcher.data.success) {
				if (fetcher.data.verified) {
					// User exists and is verified
					setFamilyData(fetcher.data.familyData);
					setSearchParams({ step: "select-child" });
				} else {
					// User exists but needs verification
					setSearchParams({ step: "verify" });
				}
			} else {
				toast.error(fetcher.data.error || "Error searching for phone number");
			}
		}

		// Handle response from code verification
		else if (fetcher.data._action === "verifyCode") {
			if (fetcher.data.success) {
				setFamilyData(fetcher.data.familyData);

				if (fetcher.data.isNewUser) {
					setIsNewUser(true);
					setNewUserId(fetcher.data.userId);
					setSearchParams({ step: "update-user-info" });
				} else {
					setSearchParams({ step: "select-child" });
				}
			} else {
				toast.error(fetcher.data.error || "Invalid verification code");
			}
		}

		// Handle response from check-in
		else if (fetcher.data._action === "checkin") {
			if (fetcher.data.success) {
				setCheckedInChildren(selectedChildren);
				setQrCodeUrl(fetcher.data.qrCodeUrl);
				setSearchParams({ step: "confirmed" });
				toast.success("Check-in successful!");
			} else {
				toast.error(fetcher.data.error || "Error during check-in");
			}
		}

		// Handle response from adding/updating a child
		else if (fetcher.data._action === "addChild" || fetcher.data._action === "updateChild") {
			if (fetcher.data.success) {
				// Update family data with the new child info
				if (fetcher.data.familyData) {
					setFamilyData(fetcher.data.familyData);
				}

				// Hide the form
				setShowAddChildForm(false);
				setChildBeingEdited(null);
				resetPhoto?.();

				// Show success message
				toast.success(
					fetcher.data._action === "addChild"
						? "Child added successfully"
						: "Child updated successfully"
				);
			} else {
				toast.error(fetcher.data.error || "Error saving child information");
			}
		}

		// We use fetcher.data._action to get the latest action - adding a ref to track the last action
	}, [fetcher.data, fetcher.state]);

	return (
		<div className="container max-w-md mx-auto py-8 px-4">
			<Card className="w-full mb-8">
				<CardHeader className="pb-4">
					<CardTitle className="text-2xl text-center">
						Children's Check-In
					</CardTitle>
					<CardDescription className="text-center">
						{organization.name}
					</CardDescription>
					{/* Hidden debug toggle */}
					<div className="absolute bottom-0 right-0 p-2">
						<button
							className="w-4 h-4 bg-transparent"
							onClick={toggleDebug}
							aria-label="Toggle debug mode"
						/>
					</div>
				</CardHeader>
			</Card>

			{/* Show stepper only for the main flow */}
			{!showEditFamily && !showAddChildForm && !childBeingEdited && (
				<div className="mb-6">
					<Stepper
						steps={STEP_NAMES}
						currentStep={currentStepIndex}
					/>
				</div>
			)}

			{/* DEBUG INFO - only show when enabled */}
			{showDebug && (
				<Card className="mb-4 bg-blue-50 border-blue-200">
					<CardHeader className="pb-2 pt-3">
						<CardTitle className="text-sm text-blue-800">Debug Panel</CardTitle>
					</CardHeader>
					<CardContent className="py-2">
						<div className="text-xs space-y-1 text-blue-700">
							<p><span className="font-semibold">Current Step:</span> {currentStep}</p>
							<p><span className="font-semibold">Step Index:</span> {currentStepIndex}</p>
							<p><span className="font-semibold">Family Data:</span> {familyData ? "✅" : "❌"}</p>
							<p><span className="font-semibold">Selected Children:</span> {selectedChildren.length}</p>
							<p><span className="font-semibold">Add Child Form:</span> {showAddChildForm ? "✅" : "❌"}</p>
							<p><span className="font-semibold">Child Being Edited:</span> {childBeingEdited ? "✅" : "❌"}</p>
							<p><span className="font-semibold">Fetcher State:</span> {fetcher.state}</p>
						</div>

						<div className="mt-2 pt-2 border-t border-blue-200">
							<div className="grid grid-cols-2 gap-2">
								<Button
									size="sm"
									variant="outline"
									className="text-xs h-8"
									onClick={handleStartAddChild}
								>
									Add Child
								</Button>
								<Button
									size="sm"
									variant="outline"
									className="text-xs h-8"
									onClick={handleStartOver}
								>
									Reset Flow
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Main content - ensure we always render something visible */}
			<div className="mb-6">
				{/* Try to render the appropriate step content */}
				{renderStepContent() || (
					// Fallback if no content was rendered
					<Card>
						<CardContent className="pt-6">
							<p className="text-center text-red-500 mb-4">
								There was an issue displaying content for the current step: {currentStep}
							</p>
							<p className="text-sm text-muted-foreground mb-4">
								This could be due to missing data or an unsupported step. You can try starting over.
							</p>
							<Button
								className="w-full"
								onClick={handleStartOver}
							>
								Start Over
							</Button>
						</CardContent>
					</Card>
				)}
			</div>

			{/* Render camera component */}
			<CameraComponent />
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
