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
import { eq } from "drizzle-orm";
import { data } from "react-router";
import LandingPage from "~/src/components/churchLandingPage/LandingPage";
// Import childCheckinService only for server-side code
import { childCheckinService } from "~/services/ChildCheckinService";

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

			return data({
				success: true,
				family: result.family,
				user: result.user,
				children,
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
	const [step, setStep] = useState("phone"); // phone, family, checkin
	const [familyData, setFamilyData] = useState(null);
	const [selectedChild, setSelectedChild] = useState(null);
	const [selectedRoom, setSelectedRoom] = useState(null);
	const [qrCodeUrl, setQrCodeUrl] = useState("");

	// Handle phone number search
	const handlePhoneSearch = (e) => {
		e.preventDefault();

		if (!phoneNumber || phoneNumber.length < 10) {
			toast.error("Please enter a valid phone number");
			return;
		}

		// Use fetcher to submit the form
		const formData = new FormData();
		formData.append("_action", "findFamilyByPhone");
		formData.append("phone", phoneNumber);

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

	// Watch for fetcher results
	useEffect(() => {
		if (fetcher.state === "idle" && fetcher.data) {
			if (fetcher.data.success) {
				// Handle successful response
				if (fetcher.data.children) {
					// Response from findFamilyByPhone
					setFamilyData({
						family: fetcher.data.family,
						user: fetcher.data.user,
						children: fetcher.data.children,
					});
					setStep("family");
				} else if (fetcher.data.checkin) {
					// Response from checkinChild
					toast.success(
						`${selectedChild.firstName} has been checked in successfully!`,
					);
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
									Enter the phone number associated with your family
								</p>
							</div>
							<Button
								type="submit"
								className="w-full"
								disabled={fetcher.state !== "idle"}
								onClick={handlePhoneSearch}
							>
								{fetcher.state !== "idle" ? "Searching..." : "Find My Family"}
							</Button>
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
