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
	users,
	type Room
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
import { FamilyEditorForm } from "~/components/checkin/FamilyEditorForm";

export const ChildCheckinActions = {
	ADD_CHILD: "add-child",
	UPDATE_CHILD: "update-child",
	ADD_GUARDIAN: "add-guardian",
	REMOVE_GUARDIAN: "remove-guardian",
	UPDATE_USER_INFO: "update-user-info",
	UPDATE_FAMILY: "update-family",
	CHECK_IN: "check-in",
	VERIFY_PHONE: "verify-phone",
	VERIFY_CODE: "verify-code",

};

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
		case ChildCheckinActions.VERIFY_PHONE: {
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
					_action: ChildCheckinActions.VERIFY_PHONE,
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

		case ChildCheckinActions.VERIFY_CODE: {
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
						step: isNewUser ? ChildCheckinActions.UPDATE_USER_INFO : "select-child",
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

		case ChildCheckinActions.CHECK_IN: {
			try {
				// Get the children data from the form
				const childrenData = formData.get("children")?.toString();
				const guardianId = formData.get("guardianId")?.toString();
				const organizationId = formData.get("organizationId")?.toString() || organization;

				if (!childrenData || !guardianId) {
					return data({
						success: false,
						_action: ChildCheckinActions.CHECK_IN,
						error: "Children data and guardian are required",
					});
				}

				// Parse the children data
				const children = JSON.parse(childrenData);

				if (!Array.isArray(children) || children.length === 0) {
					return data({
						success: false,
						_action: ChildCheckinActions.CHECK_IN,
						error: "No children selected for check-in",
					});
				}

				// Process check-in for each child
				const checkinResults = await Promise.all(
					children.map(async (child) => {
						const { childId, roomId } = child;
						if (!childId || !roomId) {
							return {
								success: false,
								childId,
								message: "Child ID and room ID are required",
							};
						}

						return await processChildCheckin(childId, roomId, guardianId, organizationId);
					})
				);

				// Check if any check-ins failed
				const failedCheckins = checkinResults.filter(result => !result.success);
				if (failedCheckins.length > 0) {
					const errorMessages = failedCheckins.map(result => result.message).join("; ");
					return data({
						success: false,
						error: `Failed to check in some children: ${errorMessages}`,
						_action: ChildCheckinActions.CHECK_IN,
					});
				}

				// Get the guardian's phone number
				const guardian = await db.query.users.findFirst({
					where: eq(users.id, guardianId),
				});

				// Get the first successful check-in to use for QR code
				const successfulCheckins = checkinResults.filter(result => result.success && result.checkin);
				if (successfulCheckins.length === 0) {
					return data({
						success: false,
						error: "No successful check-ins were processed",
						_action: ChildCheckinActions.CHECK_IN,
					});
				}

				const firstCheckin = successfulCheckins[0].checkin;

				// Generate QR code URL
				const host = new URL(request.url).origin;
				const qrCodeUrl = `${host}/landing/${organizationId}/childcheckin/verify/${firstCheckin.secureId}`;

				// Send verification QR code as text message to guardian if phone is available
				if (guardian?.phone) {
					// Create message content with QR code link
					const message = `Thank you for checking in at ${organizationName}. Use this link to access your child's verification QR code: ${qrCodeUrl}`;

					// Send SMS via MessagingService
					await MessagingService.sendSMS(
						{
							churchOrganizationId: organizationId,
							messageType: "sms",
							message,
							senderUserId: guardianId,
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
					checkins: checkinResults.map(result => result.checkin),
					_action: ChildCheckinActions.CHECK_IN,
					step: "confirmed",
					qrCodeUrl,
				});
			} catch (error) {
				console.error("Error checking in children:", error);
				return data({
					success: false,
					error: "Error checking in children",
				});
			}
		}


		case ChildCheckinActions.ADD_CHILD: {
			// Get family ID from verification cookie
			const verificationData =
				await verificationService.getVerificationFromCookie(request);

			if (!verificationData?.familyId) {
				return data({
					success: false,
					error: "You must be verified to add a child",
					_action: ChildCheckinActions.ADD_CHILD
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
					_action: ChildCheckinActions.ADD_CHILD
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
					dateOfBirth: new Date(dateOfBirth.toString()),
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
						_action: ChildCheckinActions.ADD_CHILD
					});
				}

				// Get updated family data
				const updatedFamilyData = await childCheckinService.getFamilyWithChildrenAndGuardians(
					verificationData.familyId
				);

				return data({
					success: true,
					message: "Child added successfully",
					_action: ChildCheckinActions.ADD_CHILD,
					familyData: updatedFamilyData
				});
			} catch (error) {
				console.error("Error adding child:", error);
				return data({
					success: false,
					error: "Error adding child",
					_action: ChildCheckinActions.ADD_CHILD
				});
			}
		}

		case ChildCheckinActions.UPDATE_CHILD: {
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
					action: ChildCheckinActions.UPDATE_CHILD,
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

		case ChildCheckinActions.ADD_GUARDIAN: {
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

		case ChildCheckinActions.REMOVE_GUARDIAN: {
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

		case ChildCheckinActions.UPDATE_USER_INFO: {
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
			const phone = formData.get("phone")?.toString();

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
						phone: phone || null,
						email: email || null,
						updatedAt: new Date(),
					})
					.where(eq(users.id, userId));

				// Update family name if provided
				if (familyName) {
					console.log("Updating family name:", familyName);
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

		case ChildCheckinActions.UPDATE_FAMILY: {
			// Get family ID from verification cookie
			const verificationData =
				await verificationService.getVerificationFromCookie(request);

			if (!verificationData?.familyId) {
				return data({
					success: false,
					error: "You must be verified to update family information",
				});
			}

			const familyId = formData.get("familyId")?.toString();
			const familyName = formData.get("familyName")?.toString();

			// Create an array to hold guardian updates
			const guardianUpdates = [];

			// Process each existing guardian from the form data
			const formEntries = Array.from(formData.entries()) as [string, FormDataEntryValue][];

			// Find all guardian ids for existing guardians
			const guardianIdEntries = formEntries
				.filter(([key]) => key.match(/guardians\[\d+\]\.id/));

			// For each existing guardian id, build an update object
			for (const [key, value] of guardianIdEntries) {
				const match = key.match(/guardians\[(\d+)\]\.id/);
				if (!match) continue;

				const index = match[1];
				const guardianId = value.toString();

				const firstName = formData.get(`guardians[${index}].firstName`)?.toString();
				const lastName = formData.get(`guardians[${index}].lastName`)?.toString();
				const phone = formData.get(`guardians[${index}].phone`)?.toString();
				const email = formData.get(`guardians[${index}].email`)?.toString();

				if (guardianId && firstName && lastName && phone) {
					guardianUpdates.push({
						id: guardianId,
						firstName,
						lastName,
						phone,
						email: email || undefined,
						updatedAt: new Date()
					});
				}
			}

			// Process new guardians from form data
			const newGuardians = [];
			const newGuardianFirstNameEntries = formEntries
				.filter(([key]) => key.match(/newGuardians\[\d+\]\.firstName/));

			for (const [key, value] of newGuardianFirstNameEntries) {
				const match = key.match(/newGuardians\[(\d+)\]\.firstName/);
				if (!match) continue;

				const index = match[1];
				const firstName = value.toString();
				const lastName = formData.get(`newGuardians[${index}].lastName`)?.toString();
				const phone = formData.get(`newGuardians[${index}].phone`)?.toString();
				const email = formData.get(`newGuardians[${index}].email`)?.toString();

				if (firstName && lastName && phone) {
					newGuardians.push({
						firstName,
						lastName,
						phone,
						email: email || undefined,
						churchOrganizationId: organization,
						createdAt: new Date(),
						updatedAt: new Date()
					});
				}
			}

			try {
				// Update family name if provided
				if (familyId && familyName) {
					// Update the family name directly in the database
					await db.update(familiesTable)
						.set({
							name: familyName,
							updatedAt: new Date()
						})
						.where(eq(familiesTable.id, familyId));
				}

				// Update each existing guardian
				for (const guardianUpdate of guardianUpdates) {
					console.log("Updating guardian:", guardianUpdate);
					await db.update(users)
						.set({
							firstName: guardianUpdate.firstName,
							lastName: guardianUpdate.lastName,
							phone: guardianUpdate.phone,
							email: guardianUpdate.email,
							updatedAt: guardianUpdate.updatedAt
						})
						.where(eq(users.id, guardianUpdate.id));
				}

				// Create new guardians
				for (const newGuardian of newGuardians) {
					// First create the user/guardian
					const createdGuardian = await childCheckinService.createUser({
						firstName: newGuardian.firstName,
						lastName: newGuardian.lastName,
						phone: newGuardian.phone,
						email: newGuardian.email,
						churchOrganizationId: organization,
						isGuardian: true,
						createdAt: new Date(),
						updatedAt: new Date()
					});

					// Then link them to the family
					if (createdGuardian) {
						await childCheckinService.linkUserToFamily({
							userId: createdGuardian.id,
							familyId: verificationData.familyId,
							relationship: "Guardian",
							updatedAt: new Date()
						});
					}
				}

				// Get updated family data
				const updatedFamilyData = await childCheckinService.getFamilyWithChildrenAndGuardians(
					verificationData.familyId
				);

				return data({
					success: true,
					message: "Family information updated successfully",
					_action: ChildCheckinActions.UPDATE_FAMILY,
					familyData: updatedFamilyData
				});
			} catch (error) {
				console.error("Error updating family:", error);
				return data({
					success: false,
					error: "Error updating family information",
					_action: ChildCheckinActions.UPDATE_FAMILY
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

// Helper function to process a single child check-in
interface CheckinResult {
	success: boolean;
	childId: string;
	checkin?: any;
	message?: string;
}

async function processChildCheckin(childId: string, roomId: string, guardianId: string, organizationId: string): Promise<CheckinResult> {
	try {
		// Process the check-in
		const checkinResult = await childCheckinService.processCheckin(
			childId,
			roomId,
			guardianId,
			organizationId,
		);

		if (!checkinResult.success) {
			return {
				success: false,
				childId,
				message: checkinResult.message || "Failed to check in child",
			};
		}

		return {
			success: true,
			childId,
			checkin: checkinResult.checkin,
		};
	} catch (error) {
		console.error("Error checking in child:", error);
		return {
			success: false,
			childId,
			message: "Error checking in child",
		};
	}
}

function ChildCheckinContent({ organization, rooms }) {
	const loaderData = useLoaderData();
	const fetcher = useFetcher();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const { organization: orgId } = useParams();

	// State variables that truly need to be local state
	const [phone, setPhoneNumber] = useState("");
	const [verificationCode, setVerificationCode] = useState("");
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

	// Access familyData directly from loaderData instead of duplicating in state
	const familyData = loaderData.familyData || null;
	console.log("familyData", familyData);
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
			case ChildCheckinActions.UPDATE_USER_INFO:
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

	// Handle phone search
	const handlePhoneSearch = (e) => {
		e.preventDefault();

		fetcher.submit(
			{
				_action: ChildCheckinActions.VERIFY_PHONE,
				phone,
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
				_action: ChildCheckinActions.VERIFY_CODE,
				phone,
				verificationCode,
				organizationId: orgId,
			},
			{ method: "post" }
		);
	};

	// Handle resend code
	const handleResendCode = () => {
		fetcher.submit(
			{
				_action: "resendCode",
				phone,
				organizationId: orgId,
			},
			{ method: "post" }
		);
	};

	// Handle start over
	const handleStartOver = () => {
		// Clear state
		setPhoneNumber("");
		setVerificationCode("");
		setSelectedChildren([]);
		// Navigate to phone step instead of manually updating search params
		navigate(`/landing/${orgId}/childcheckin?step=phone`);
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

	// Find the best room for a child based on age
	const findRoomForChild = (child, availableRooms: any[]) => {
		// Calculate child's age in months
		const ageInMonths = getChildAgeInMonths(child.dateOfBirth);

		// Filter rooms by age range
		const eligibleRooms = availableRooms.filter(room => {
			return ageInMonths >= room.minAge && ageInMonths <= room.maxAge;
		});

		if (eligibleRooms.length === 0) {
			return null;
		}

		// Sort rooms by capacity and current count
		return eligibleRooms.sort((a, b) => {
			// If one room is at capacity and the other isn't, prioritize the one that's not at capacity
			const aCount = a.currentCount || 0;
			const bCount = b.currentCount || 0;

			if (aCount >= a.capacity && bCount < b.capacity) {
				return 1;
			}
			if (bCount >= b.capacity && aCount < a.capacity) {
				return -1;
			}

			// Otherwise, choose the room with fewer children
			return aCount - bCount;
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
				_action: ChildCheckinActions.CHECK_IN,
				children: JSON.stringify(childrenWithRooms),
				guardianId: familyData.guardians[0].id,
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
		formData.append("_action", ChildCheckinActions.ADD_CHILD);
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
		formData.append("_action", ChildCheckinActions.UPDATE_CHILD);
		formData.append("organizationId", orgId);

		fetcher.submit(formData, { method: "post" });
	};

	// Handle updating user info
	const handleUpdateUserInfo = (e) => {
		e.preventDefault();
		const formData = new FormData(e.target);
		formData.append("_action", ChildCheckinActions.UPDATE_USER_INFO);
		formData.append("organizationId", orgId);

		fetcher.submit(formData, { method: "post" });
	};

	// toggle debug panel
	const toggleDebug = useCallback(() => {
		setShowDebug(prev => !prev);
	}, []);

	// Render content based on current step
	const renderStepContent = () => {
		// If we're editing the family
		if (showEditFamily) {
			return (
				<FamilyEditorForm
					familyData={familyData}
					onClose={() => setShowEditFamily(false)}
					onSave={(formData) => {
						formData.append("_action", ChildCheckinActions.UPDATE_FAMILY);
						formData.append("organizationId", orgId);
						fetcher.submit(formData, { method: "post" });
					}}
					onEditChild={(child) => {
						setChildBeingEdited(child);
						setShowEditFamily(false);
					}}
					onAddChild={() => {
						handleStartAddChild(undefined);
						setShowEditFamily(false);
					}}
					isLoading={fetcher.state !== "idle"}
				/>
			);
		}

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
						phoneNumber={phone}
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
						phoneNumber={phone}
					/>
				);

			case ChildCheckinActions.UPDATE_USER_INFO:
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

	// Update after fetcher completes
	useEffect(() => {
		if (!fetcher.data || fetcher.state === "loading") return;

		// Handle response from phone search
		if (fetcher.data._action === ChildCheckinActions.VERIFY_PHONE) {
			if (fetcher.data.success) {
				if (fetcher.data.verified) {
					// User exists and is verified - navigate instead of setting state
					navigate(`/landing/${orgId}/childcheckin?step=select-child`, {
						replace: true
					});
				} else {
					// User exists but needs verification
					navigate(`/landing/${orgId}/childcheckin?step=verify`, {
						replace: true
					});
				}
			} else {
				toast.error(fetcher.data.error || "Error searching for phone number");
			}
		}

		// Handle response from code verification
		else if (fetcher.data._action === ChildCheckinActions.VERIFY_CODE) {
			if (fetcher.data.success) {
				if (fetcher.data.isNewUser) {
					setIsNewUser(true);
					setNewUserId(fetcher.data.userId);
					navigate(`/landing/${orgId}/childcheckin?step=${ChildCheckinActions.UPDATE_USER_INFO}`, {
						replace: true
					});
				} else {
					navigate(`/landing/${orgId}/childcheckin?step=select-child`, {
						replace: true
					});
				}
			} else {
				toast.error(fetcher.data.error || "Invalid verification code");
			}
		}

		// Handle response from check-in
		else if (fetcher.data._action === ChildCheckinActions.CHECK_IN) {
			if (fetcher.data.success) {
				setCheckedInChildren(selectedChildren);
				setQrCodeUrl(fetcher.data.qrCodeUrl);
				navigate(`/landing/${orgId}/childcheckin?step=confirmed`, {
					replace: true
				});
				toast.success("Check-in successful!");
			} else {
				toast.error(fetcher.data.error || "Error during check-in");
			}
		}

		// Handle response from family update
		else if (fetcher.data._action === ChildCheckinActions.UPDATE_FAMILY) {
			if (fetcher.data.success) {
				setShowEditFamily(false);
				toast.success("Family information updated successfully");
			} else {
				toast.error(fetcher.data.error || "Error updating family information");
			}
		}

		// Handle response from adding/updating a child
		else if (fetcher.data._action === ChildCheckinActions.ADD_CHILD || fetcher.data._action === ChildCheckinActions.UPDATE_CHILD) {
			if (fetcher.data.success) {
				// Hide the form
				setShowAddChildForm(false);
				setChildBeingEdited(null);
				resetPhoto?.();

				// Show success message
				toast.success(
					fetcher.data._action === ChildCheckinActions.ADD_CHILD
						? "Child added successfully"
						: "Child updated successfully"
				);
			} else {
				toast.error(fetcher.data.error || "Error saving child information");
			}
		}
	}, [fetcher.data, fetcher.state, orgId, navigate]);

	// Update step based on loader data
	useEffect(() => {
		const currentStep = searchParams.get("step") || "phone";

		// Don't redirect if in certain steps
		if (currentStep === 'success' ||
			currentStep === 'edit-family' ||
			showAddChildForm ||
			childBeingEdited) {
			return;
		}

		// Only redirect if appropriate
		if (loaderData?.familyData?.verified) {
			// Avoid causing a navigation loop by checking current step
			if (currentStep === 'phone' || currentStep === 'verify') {
				navigate(`/landing/${orgId}/childcheckin?step=select-child`, {
					replace: true
				});
			}
		}
	}, [loaderData?.familyData?.verified, searchParams, orgId, showAddChildForm, childBeingEdited, navigate]);

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
	console.log("loaderData", loaderData);

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
