import { useState, useEffect } from "react";
import {
	useParams,
	useNavigate,
	useLoaderData,
	useFetcher,
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
import { db } from "@/server/db/dbConnection";
import { churchOrganization } from "@/server/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { data } from "react-router";
import LandingPage from "~/src/components/churchLandingPage/LandingPage";
// Import childCheckinService only for server-side code
import { childCheckinService } from "~/services/ChildCheckinService";
import { MessagingService } from "@/server/services/MessagingService";

// Create a temporary table in memory to store verification codes
// In a real implementation, this would be a database table
const verificationCodes = new Map();

// Helper function to generate a verification code
function generateVerificationCode() {
	return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
}

// Helper function to store a verification code with expiration
function storeVerificationCode(phone, organizationId) {
	const code = generateVerificationCode();
	const expiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiration

	const key = `${phone}-${organizationId}`;
	verificationCodes.set(key, {
		code,
		expiration,
		attempts: 0,
	});

	return code;
}

// Helper function to verify a code
function verifyCode(phone, organizationId, inputCode) {
	const key = `${phone}-${organizationId}`;
	const storedData = verificationCodes.get(key);

	if (!storedData) {
		return { valid: false, reason: "No verification code found" };
	}

	if (new Date() > storedData.expiration) {
		verificationCodes.delete(key);
		return { valid: false, reason: "Verification code expired" };
	}

	// Increment attempts
	storedData.attempts += 1;
	verificationCodes.set(key, storedData);

	// Check if too many attempts
	if (storedData.attempts > 5) {
		verificationCodes.delete(key);
		return { valid: false, reason: "Too many failed attempts" };
	}

	// Check if code matches
	if (storedData.code !== inputCode) {
		return { valid: false, reason: "Invalid verification code" };
	}

	// Code is valid, remove it from storage
	verificationCodes.delete(key);
	return { valid: true };
}

// Helper function to send verification code via SMS
async function sendVerificationCodeSMS(
	phone,
	code,
	organizationId,
	organizationName,
) {
	try {
		// Format the message
		const message = `Your verification code for ${organizationName} Child Check-in is: ${code}. This code will expire in 10 minutes.`;

		// Send the SMS
		const result = await MessagingService.sendSMS(
			{
				churchOrganizationId: organizationId,
				messageType: "sms",
				message,
				senderUserId: "system", // Using "system" as the sender ID for automated messages
			},
			{
				phone,
				// No user ID needed for public check-in
				preferences: {
					// Override preferences for verification codes
					smsNotifications: true,
				},
			},
			organizationName,
		);

		return result.success;
	} catch (error) {
		console.error("Error sending verification SMS:", error);
		return false;
	}
}

// Loader to fetch initial data - no authentication required
export async function loader({ params, request }) {
	const { organization } = params;

	if (!organization) {
		return data(
			{ success: false, error: "Invalid organization" },
			{ status: 400 },
		);
	}

	try {
		// Get organization details
		const org = await db
			.select()
			.from(churchOrganization)
			.where(eq(churchOrganization.id, organization))
			.then((res) => res[0]);

		if (!org) {
			return data(
				{ success: false, error: "Organization not found" },
				{ status: 404 },
			);
		}

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
			organization: org,
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
}

// Action to handle form submissions
export async function action({ params, request }) {
	const { organization } = params;
	const formData = await request.formData();
	const action = formData.get("_action");

	try {
		if (action === "findFamilyByPhone") {
			const phone = formData.get("phone");

			if (!phone) {
				return data(
					{ success: false, error: "Phone number is required" },
					{ status: 400 },
				);
			}

			// Find family by phone
			const result = await childCheckinService.findFamilyByPhone(
				phone,
				organization,
			);

			if (!result || !result.family) {
				return data({
					success: false,
					message: "Family not found",
				});
			}

			// Get children for this family
			const children = await childCheckinService.getChildrenByFamily(
				result.family.id,
			);

			if (!children || children.length === 0) {
				return data({
					success: false,
					message: "No children found for this family",
				});
			}

			// Get organization details for SMS
			const org = await db
				.select()
				.from(churchOrganization)
				.where(eq(churchOrganization.id, organization))
				.then((res) => res[0]);

			// Generate and store a verification code
			const verificationCode = storeVerificationCode(phone, organization);

			// Send the verification code via SMS
			const smsSent = await sendVerificationCodeSMS(
				phone,
				verificationCode,
				organization,
				org.name,
			);

			// For demo purposes, log the code
			console.log(`Verification code for ${phone}: ${verificationCode}`);

			return data({
				success: true,
				family: result.family,
				user: result.user,
				children,
				phoneNumber: phone, // Send back the phone number for verification
				requireVerification: true, // Flag to indicate verification is required
				smsSent, // Indicate if SMS was sent successfully
				// For demo purposes only - in production, don't send the code to the client
				verificationCode,
			});
		}

		if (action === "verifyPhone") {
			const verificationCode = formData.get("verificationCode");
			const phone = formData.get("phone");
			const familyId = formData.get("familyId");

			// Verify the code
			const verification = verifyCode(phone, organization, verificationCode);

			if (!verification.valid) {
				return data({
					success: false,
					message: verification.reason,
				});
			}

			// Get children for this family again
			const children = await childCheckinService.getChildrenByFamily(familyId);

			if (!children || children.length === 0) {
				return data({
					success: false,
					message: "No children found for this family",
				});
			}

			// Get family and user info
			const family = await childCheckinService.getFamilyById(familyId);
			const user = await childCheckinService.getUserById(
				family.primaryGuardianId || family.id,
			);

			return data({
				success: true,
				family,
				user,
				children,
				verified: true,
			});
		}

		if (action === "workerCheckin") {
			// This action is for workers checking in children without verification
			const phone = formData.get("phone");

			if (!phone) {
				return data(
					{ success: false, error: "Phone number is required" },
					{ status: 400 },
				);
			}

			// Find family by phone
			const result = await childCheckinService.findFamilyByPhone(
				phone,
				organization,
			);

			if (!result || !result.family) {
				return data({
					success: false,
					message: "Family not found",
				});
			}

			// Get children for this family
			const children = await childCheckinService.getChildrenByFamily(
				result.family.id,
			);

			if (!children || children.length === 0) {
				return data({
					success: false,
					message: "No children found for this family",
				});
			}

			return data({
				success: true,
				family: result.family,
				user: result.user,
				children,
				verified: true, // Skip verification for worker check-ins
			});
		}

		if (action === "checkinChild") {
			const childId = formData.get("childId");
			const roomId = formData.get("roomId");

			if (!childId || !roomId) {
				return data(
					{ success: false, error: "Missing required fields" },
					{ status: 400 },
				);
			}

			// Create check-in
			const checkinData = {
				childId,
				roomId,
				checkinTime: new Date(),
				status: "checked-in",
				secureId: crypto.randomUUID(),
				churchOrganizationId: organization,
				updatedAt: new Date(),
				checkedInByUserId: "system", // Using "system" as the user ID for public check-ins
			};

			const newCheckin = await childCheckinService.checkinChild(checkinData);

			return data({
				success: true,
				checkin: newCheckin,
				verifyUrl: `/churches/${organization}/childcheckin/verify/${newCheckin.secureId}`,
			});
		}

		if (action === "resendCode") {
			const phone = formData.get("phone");
			const familyId = formData.get("familyId");

			if (!phone || !familyId) {
				return data(
					{ success: false, error: "Missing required fields" },
					{ status: 400 },
				);
			}

			// Get organization details for SMS
			const org = await db
				.select()
				.from(churchOrganization)
				.where(eq(churchOrganization.id, organization))
				.then((res) => res[0]);

			// Generate and store a new verification code
			const verificationCode = storeVerificationCode(phone, organization);

			// Send the verification code via SMS
			const smsSent = await sendVerificationCodeSMS(
				phone,
				verificationCode,
				organization,
				org.name,
			);

			// For demo purposes, log the code
			console.log(`New verification code for ${phone}: ${verificationCode}`);

			return data({
				success: true,
				message: "Verification code resent",
				smsSent, // Indicate if SMS was sent successfully
				// For demo purposes only
				verificationCode,
			});
		}

		return data({ success: false, error: "Invalid action" }, { status: 400 });
	} catch (error) {
		console.error("Error in child check-in action:", error);
		return data(
			{ success: false, error: "An error occurred" },
			{ status: 500 },
		);
	}
}

// Child check-in content component
function ChildCheckinContent({ organization, rooms }) {
	const { organization: orgId } = useParams();
	const navigate = useNavigate();
	const fetcher = useFetcher();
	const [phoneNumber, setPhoneNumber] = useState("");
	const [step, setStep] = useState("phone"); // phone, verify, family, room, confirm, success
	const [familyData, setFamilyData] = useState(null);
	const [selectedChild, setSelectedChild] = useState(null);
	const [selectedRoom, setSelectedRoom] = useState(null);
	const [qrCodeUrl, setQrCodeUrl] = useState("");
	const [verificationCode, setVerificationCode] = useState("");
	const [expectedCode, setExpectedCode] = useState("");
	const [isWorkerMode, setIsWorkerMode] = useState(false);

	// Handle phone number search
	const handlePhoneSearch = (e) => {
		e.preventDefault();

		if (!phoneNumber || phoneNumber.length < 10) {
			toast.error("Please enter a valid phone number");
			return;
		}

		// Use fetcher to submit the form
		const formData = new FormData();
		formData.append(
			"_action",
			isWorkerMode ? "workerCheckin" : "findFamilyByPhone",
		);
		formData.append("phone", phoneNumber);

		fetcher.submit(formData, { method: "post" });
	};

	// Handle verification code submission
	const handleVerifyCode = (e) => {
		e.preventDefault();

		if (!verificationCode) {
			toast.error("Please enter the verification code");
			return;
		}

		// Use fetcher to submit the form
		const formData = new FormData();
		formData.append("_action", "verifyPhone");
		formData.append("verificationCode", verificationCode);
		formData.append("phone", phoneNumber);
		formData.append("familyId", familyData?.family?.id);

		fetcher.submit(formData, { method: "post" });
	};

	// Handle resend code
	const handleResendCode = () => {
		const formData = new FormData();
		formData.append("_action", "resendCode");
		formData.append("phone", phoneNumber);
		formData.append("familyId", familyData?.family?.id);

		fetcher.submit(formData, { method: "post" });
	};

	// Handle child selection
	const handleChildSelect = (child) => {
		setSelectedChild(child);
		setStep("room");
	};

	// Handle room selection
	const handleRoomSelect = (room) => {
		setSelectedRoom(room);
		setStep("confirm");
	};

	// Handle check-in submission
	const handleCheckin = () => {
		if (!selectedChild || !selectedRoom) {
			toast.error("Please select a child and room");
			return;
		}

		// Use fetcher to submit the form
		const formData = new FormData();
		formData.append("_action", "checkinChild");
		formData.append("childId", selectedChild.id);
		formData.append("roomId", selectedRoom.id);

		fetcher.submit(formData, { method: "post" });
	};

	// Toggle between guardian and worker mode
	const toggleWorkerMode = () => {
		setIsWorkerMode(!isWorkerMode);
		setStep("phone");
		setPhoneNumber("");
		setFamilyData(null);
		setSelectedChild(null);
		setSelectedRoom(null);
		setVerificationCode("");
	};

	// Watch for fetcher results
	useEffect(() => {
		if (fetcher.state === "idle" && fetcher.data) {
			if (fetcher.data.success) {
				// Handle successful response
				if (fetcher.data.requireVerification) {
					// Response from findFamilyByPhone - requires verification
					setFamilyData({
						family: fetcher.data.family,
						user: fetcher.data.user,
						children: fetcher.data.children,
					});
					setPhoneNumber(fetcher.data.phoneNumber);
					setStep("verify");

					if (fetcher.data.smsSent) {
						toast.success(
							`Verification code sent to ${fetcher.data.phoneNumber}`,
						);
					} else {
						toast.warning(
							`Could not send SMS. For demo purposes, the code is: ${fetcher.data.verificationCode}`,
						);
					}
				} else if (fetcher.data.message === "Verification code resent") {
					// Response from resendCode
					if (fetcher.data.smsSent) {
						toast.success(`New verification code sent to your phone`);
					} else {
						toast.warning(
							`Could not send SMS. For demo purposes, the code is: ${fetcher.data.verificationCode}`,
						);
					}
				} else if (fetcher.data.verified || fetcher.data.children) {
					// Response from verifyPhone or workerCheckin - already verified
					setFamilyData({
						family: fetcher.data.family,
						user: fetcher.data.user,
						children: fetcher.data.children,
					});
					setStep("family");
				} else if (fetcher.data.checkin) {
					// Response from checkinChild
					if (selectedChild) {
						toast.success(
							`${selectedChild.firstName} has been checked in successfully!`,
						);
					}
					setQrCodeUrl(fetcher.data.verifyUrl);
					setStep("success");
				}
			} else {
				// Handle error response
				toast.error(
					fetcher.data.message || fetcher.data.error || "An error occurred",
				);

				// If family not found, redirect to full check-in page
				if (
					fetcher.data.message === "Family not found" ||
					fetcher.data.message === "No children found for this family"
				) {
					navigate(`/churches/${orgId}/childcheckin?phone=${phoneNumber}`);
				}
			}
		}
	}, [
		fetcher.state,
		fetcher.data,
		navigate,
		phoneNumber,
		orgId,
		selectedChild,
	]);

	return (
		<div className="container mx-auto py-8 px-4">
			<Card className="max-w-md mx-auto">
				<CardHeader>
					<CardTitle className="text-2xl font-bold text-center">
						Child Check-in
					</CardTitle>
					<CardDescription className="text-center">
						{organization.name} Child Check-in System
					</CardDescription>
					<div className="flex justify-end mt-2">
						<Button
							variant="outline"
							size="sm"
							onClick={toggleWorkerMode}
							className="text-xs"
						>
							{isWorkerMode ? "Guardian Mode" : "Worker Mode"}
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{step === "phone" && (
						<fetcher.Form method="post" className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="phone">Phone Number</Label>
								<Input
									id="phone"
									name="phone"
									placeholder="(555) 123-4567"
									value={phoneNumber}
									onChange={(e) => setPhoneNumber(e.target.value)}
									required
								/>
								<p className="text-sm text-muted-foreground">
									{isWorkerMode
										? "Enter the guardian's phone number"
										: "Enter the phone number associated with your family"}
								</p>
							</div>
							<Button
								type="submit"
								className="w-full"
								disabled={fetcher.state !== "idle"}
								onClick={handlePhoneSearch}
							>
								{fetcher.state !== "idle" ? "Searching..." : "Find Family"}
							</Button>
						</fetcher.Form>
					)}

					{step === "verify" && (
						<fetcher.Form method="post" className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="verificationCode">Verification Code</Label>
								<Input
									id="verificationCode"
									name="verificationCode"
									placeholder="Enter 6-digit code"
									value={verificationCode}
									onChange={(e) => setVerificationCode(e.target.value)}
									required
								/>
								<p className="text-sm text-muted-foreground">
									Enter the 6-digit code sent to your phone
								</p>
							</div>
							<Button
								type="submit"
								className="w-full"
								disabled={fetcher.state !== "idle"}
								onClick={handleVerifyCode}
							>
								{fetcher.state !== "idle" ? "Verifying..." : "Verify Code"}
							</Button>
							<div className="flex justify-between mt-2">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setStep("phone")}
								>
									Back
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={handleResendCode}
									disabled={fetcher.state !== "idle"}
								>
									Resend Code
								</Button>
							</div>
						</fetcher.Form>
					)}

					{step === "family" && familyData && (
						<div className="space-y-4">
							<h3 className="font-medium">Select a child to check in:</h3>
							<div className="space-y-2">
								{familyData.children.map((child) => (
									<Button
										key={child.id}
										variant="outline"
										className="w-full justify-start text-left h-auto py-3"
										onClick={() => handleChildSelect(child)}
									>
										<div>
											<div className="font-medium">
												{child.firstName} {child.lastName}
											</div>
											<div className="text-sm text-muted-foreground">
												{new Date(child.dateOfBirth).toLocaleDateString()}
											</div>
										</div>
									</Button>
								))}
							</div>
							<Button
								variant="ghost"
								className="w-full"
								onClick={() => setStep("phone")}
							>
								Back
							</Button>
						</div>
					)}

					{step === "room" && selectedChild && (
						<div className="space-y-4">
							<h3 className="font-medium">Select a room:</h3>
							<div className="space-y-2">
								{rooms.map((room) => (
									<Button
										key={room.id}
										variant="outline"
										className="w-full justify-start text-left h-auto py-3"
										onClick={() => handleRoomSelect(room)}
									>
										<div>
											<div className="font-medium">{room.name}</div>
											{(room.minAge || room.maxAge) && (
												<div className="text-sm text-muted-foreground">
													{room.minAge && room.maxAge
														? `Ages ${room.minAge}-${room.maxAge}`
														: room.minAge
															? `Ages ${room.minAge}+`
															: `Up to age ${room.maxAge}`}
												</div>
											)}
										</div>
									</Button>
								))}
							</div>
							<Button
								variant="ghost"
								className="w-full"
								onClick={() => setStep("family")}
							>
								Back
							</Button>
						</div>
					)}

					{step === "confirm" && selectedChild && selectedRoom && (
						<fetcher.Form method="post" className="space-y-4">
							<h3 className="font-medium">Confirm Check-in:</h3>
							<div className="space-y-2 border rounded-md p-3">
								<div>
									<span className="font-medium">Child: </span>
									{selectedChild.firstName} {selectedChild.lastName}
								</div>
								<div>
									<span className="font-medium">Room: </span>
									{selectedRoom.name}
								</div>
							</div>
							<input type="hidden" name="childId" value={selectedChild.id} />
							<input type="hidden" name="roomId" value={selectedRoom.id} />
							<div className="flex space-x-2">
								<Button
									variant="ghost"
									className="flex-1"
									onClick={() => setStep("room")}
									type="button"
								>
									Back
								</Button>
								<Button
									className="flex-1"
									type="submit"
									disabled={fetcher.state !== "idle"}
									onClick={handleCheckin}
								>
									{fetcher.state !== "idle" ? "Processing..." : "Check In"}
								</Button>
							</div>
						</fetcher.Form>
					)}

					{step === "success" && qrCodeUrl && (
						<div className="space-y-4 text-center">
							<div className="text-green-600 font-medium">
								Check-in Successful!
							</div>
							<div className="flex justify-center">
								<div className="border p-4 inline-block">
									<img
										src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
											window.location.origin + qrCodeUrl,
										)}`}
										alt="QR Code"
										className="w-32 h-32"
									/>
								</div>
							</div>
							<p className="text-sm">
								Please take a screenshot of this QR code. You'll need to show it
								when picking up your child.
							</p>
							<Button
								className="w-full"
								onClick={() => {
									setStep("phone");
									setPhoneNumber("");
									setFamilyData(null);
									setSelectedChild(null);
									setSelectedRoom(null);
									setQrCodeUrl("");
									setVerificationCode("");
								}}
							>
								Done
							</Button>
						</div>
					)}
				</CardContent>
				<CardFooter className="flex justify-center">
					<p className="text-xs text-muted-foreground">
						Need help? Please ask a staff member for assistance.
					</p>
				</CardFooter>
			</Card>
		</div>
	);
}

export default function PublicChildCheckin() {
	const loaderData = useLoaderData<typeof loader>();
	const { organization: orgId } = useParams();
	const navigate = useNavigate();
	const fetcher = useFetcher();
	const [phoneNumber, setPhoneNumber] = useState("");
	const [step, setStep] = useState("phone"); // phone, verify, family, room, confirm, success
	const [familyData, setFamilyData] = useState(null);
	const [selectedChild, setSelectedChild] = useState(null);
	const [selectedRoom, setSelectedRoom] = useState(null);
	const [qrCodeUrl, setQrCodeUrl] = useState("");
	const [verificationCode, setVerificationCode] = useState("");
	const [expectedCode, setExpectedCode] = useState("");
	const [isWorkerMode, setIsWorkerMode] = useState(false);

	// Handle phone number search
	const handlePhoneSearch = (e) => {
		e.preventDefault();

		if (!phoneNumber || phoneNumber.length < 10) {
			toast.error("Please enter a valid phone number");
			return;
		}

		// Use fetcher to submit the form
		const formData = new FormData();
		formData.append(
			"_action",
			isWorkerMode ? "workerCheckin" : "findFamilyByPhone",
		);
		formData.append("phone", phoneNumber);

		fetcher.submit(formData, { method: "post" });
	};

	// Handle verification code submission
	const handleVerifyCode = (e) => {
		e.preventDefault();

		if (!verificationCode) {
			toast.error("Please enter the verification code");
			return;
		}

		// Use fetcher to submit the form
		const formData = new FormData();
		formData.append("_action", "verifyPhone");
		formData.append("verificationCode", verificationCode);
		formData.append("phone", phoneNumber);
		formData.append("familyId", familyData?.family?.id);

		fetcher.submit(formData, { method: "post" });
	};

	// Handle resend code
	const handleResendCode = () => {
		const formData = new FormData();
		formData.append("_action", "resendCode");
		formData.append("phone", phoneNumber);
		formData.append("familyId", familyData?.family?.id);

		fetcher.submit(formData, { method: "post" });
	};

	// Handle child selection
	const handleChildSelect = (child) => {
		setSelectedChild(child);
		setStep("room");
	};

	// Handle room selection
	const handleRoomSelect = (room) => {
		setSelectedRoom(room);
		setStep("confirm");
	};

	// Handle check-in submission
	const handleCheckin = () => {
		if (!selectedChild || !selectedRoom) {
			toast.error("Please select a child and room");
			return;
		}

		// Use fetcher to submit the form
		const formData = new FormData();
		formData.append("_action", "checkinChild");
		formData.append("childId", selectedChild.id);
		formData.append("roomId", selectedRoom.id);

		fetcher.submit(formData, { method: "post" });
	};

	// Toggle between guardian and worker mode
	const toggleWorkerMode = () => {
		setIsWorkerMode(!isWorkerMode);
		setStep("phone");
		setPhoneNumber("");
		setFamilyData(null);
		setSelectedChild(null);
		setSelectedRoom(null);
		setVerificationCode("");
	};

	// Watch for fetcher results
	useEffect(() => {
		if (fetcher.state === "idle" && fetcher.data) {
			if (fetcher.data.success) {
				// Handle successful response
				if (fetcher.data.requireVerification) {
					// Response from findFamilyByPhone - requires verification
					setFamilyData({
						family: fetcher.data.family,
						user: fetcher.data.user,
						children: fetcher.data.children,
					});
					setPhoneNumber(fetcher.data.phoneNumber);
					setStep("verify");

					if (fetcher.data.smsSent) {
						toast.success(
							`Verification code sent to ${fetcher.data.phoneNumber}`,
						);
					} else {
						toast.warning(
							`Could not send SMS. For demo purposes, the code is: ${fetcher.data.verificationCode}`,
						);
					}
				} else if (fetcher.data.message === "Verification code resent") {
					// Response from resendCode
					if (fetcher.data.smsSent) {
						toast.success(`New verification code sent to your phone`);
					} else {
						toast.warning(
							`Could not send SMS. For demo purposes, the code is: ${fetcher.data.verificationCode}`,
						);
					}
				} else if (fetcher.data.verified || fetcher.data.children) {
					// Response from verifyPhone or workerCheckin - already verified
					setFamilyData({
						family: fetcher.data.family,
						user: fetcher.data.user,
						children: fetcher.data.children,
					});
					setStep("family");
				} else if (fetcher.data.checkin) {
					// Response from checkinChild
					if (selectedChild) {
						toast.success(
							`${selectedChild.firstName} has been checked in successfully!`,
						);
					}
					setQrCodeUrl(fetcher.data.verifyUrl);
					setStep("success");
				}
			} else {
				// Handle error response
				toast.error(
					fetcher.data.message || fetcher.data.error || "An error occurred",
				);

				// If family not found, redirect to full check-in page
				if (
					fetcher.data.message === "Family not found" ||
					fetcher.data.message === "No children found for this family"
				) {
					navigate(`/churches/${orgId}/childcheckin?phone=${phoneNumber}`);
				}
			}
		}
	}, [
		fetcher.state,
		fetcher.data,
		navigate,
		phoneNumber,
		orgId,
		selectedChild,
	]);

	if (!loaderData.success || !loaderData.organization) {
		return <div>Loading...</div>;
	}

	return (
		<ChildCheckinContent
			organization={loaderData.organization}
			rooms={loaderData.rooms}
		/>
	);
}
