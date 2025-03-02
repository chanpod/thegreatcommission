import { useState, useRef, useEffect } from "react";
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
import { childCheckinService } from "../services/ChildCheckinService";
import { fileUploadService } from "../services/FileUploadService";
import { QRCodeSVG } from "qrcode.react";
import { createAuthLoader } from "~/server/auth/authLoader";
import { data, redirect } from "react-router";

// Loader to fetch active check-in sessions
export const loader = createAuthLoader(async ({ params, request }) => {
	const { organization } = params;

	if (!organization) {
		return data({ sessions: [] }, { status: 400 });
	}

	try {
		const sessions =
			await childCheckinService.getActiveCheckinSessions(organization);
		return data({ sessions });
	} catch (error) {
		console.error("Error fetching sessions:", error);
		return data(
			{ sessions: [], error: "Failed to load check-in sessions" },
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
	}>;
	error?: string;
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
		// Create session
		if (action === "createSession") {
			const sessionName = formData.get("sessionName");

			if (!sessionName) {
				return data(
					{ success: false, error: "Session name is required" },
					{ status: 400 },
				);
			}

			const sessionData = {
				name: sessionName.toString(),
				churchOrganizationId: organization,
				startTime: new Date(),
				updatedAt: new Date(),
			};

			const newSession =
				await childCheckinService.createCheckinSession(sessionData);
			return data({ success: true, session: newSession });
		}

		// Complete check-in
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

			const sessionId = formData.get("sessionId");
			const pickupPersonsJson = formData.get("authorizedPickups");

			// Validate required fields
			if (
				!childFirstName ||
				!childLastName ||
				!guardianFirstName ||
				!guardianLastName ||
				!sessionId
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

			// Create child record
			const childData = {
				firstName: childFirstName?.toString(),
				lastName: childLastName?.toString(),
				dateOfBirth: dateOfBirth ? dateOfBirth?.toString() : undefined,
				allergies: allergies ? allergies?.toString() : undefined,
				specialNotes: specialNotes ? specialNotes?.toString() : undefined,
				photoUrl: processedChildPhotoUrl,
				churchOrganizationId: organization,
				updatedAt: new Date(),
			};
			const newChild = await childCheckinService.createChild(childData);

			// Create guardian record
			const guardianData = {
				firstName: guardianFirstName?.toString(),
				lastName: guardianLastName?.toString(),
				phone: phone ? phone?.toString() : undefined,
				email: email ? email?.toString() : undefined,
				photoUrl: processedGuardianPhotoUrl,
				churchOrganizationId: organization,
				updatedAt: new Date(),
			};
			const newGuardian =
				await childCheckinService.createGuardian(guardianData);

			// Link child to guardian
			await childCheckinService.linkChildToGuardian({
				childId: newChild.id,
				guardianId: newGuardian.id,
				relationship: "parent",
				updatedAt: new Date(),
			});

			// Create checkin record
			const checkinData = {
				childId: newChild.id,
				sessionId: sessionId.toString(),
				checkedInByGuardianId: newGuardian.id,
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
			const qrUrl = `${host}/churches/${organization}/childcheckin/verify/${newCheckin.secureId}`;

			return {
				success: true,
				checkin: newCheckin,
				qrCodeUrl: qrUrl,
				childInfo: newChild,
				guardianInfo: newGuardian,
			};
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

export default function ChildCheckin() {
	const { organization } = useParams();
	const navigate = useNavigate();
	const loaderData = useLoaderData<typeof loader>() as LoaderData;
	const sessions = loaderData?.sessions || [];
	const fetcher = useFetcher();

	const [activeTab, setActiveTab] = useState("session");
	const [activeSession, setActiveSession] = useState(null);
	const [childInfo, setChildInfo] = useState({
		firstName: "",
		lastName: "",
		dateOfBirth: "",
		allergies: "",
		specialNotes: "",
		photoUrl: "",
	});
	const [guardianInfo, setGuardianInfo] = useState({
		firstName: "",
		lastName: "",
		phone: "",
		email: "",
		photoUrl: "",
	});
	const [authorizedPickups, setAuthorizedPickups] = useState([]);
	const [childPhoto, setChildPhoto] = useState(null);
	const [guardianPhoto, setGuardianPhoto] = useState(null);
	const [qrCodeUrl, setQrCodeUrl] = useState("");
	const [checkinComplete, setCheckinComplete] = useState(false);

	// Refs for camera elements
	const childVideoRef = useRef(null);
	const childCanvasRef = useRef(null);
	const guardianVideoRef = useRef(null);
	const guardianCanvasRef = useRef(null);

	// Handle successful session creation
	useEffect(() => {
		if (fetcher.data?.success && fetcher.data?.session) {
			setActiveSession(fetcher.data.session);
			toast.success(
				`Session "${fetcher.data.session.name}" has been created successfully.`,
			);
			setActiveTab("child");
		}
	}, [fetcher.data]);

	// Handle successful check-in
	useEffect(() => {
		if (fetcher.data?.success && fetcher.data?.checkin) {
			setQrCodeUrl(fetcher.data.qrCodeUrl);
			setCheckinComplete(true);
			setActiveTab("complete");
			toast.success("Child has been successfully checked in.");
		}
	}, [fetcher.data]);

	// Handle errors
	useEffect(() => {
		if (fetcher.data && !fetcher.data.success && fetcher.data.error) {
			toast.error(fetcher.data.error);
		}
	}, [fetcher.data]);

	// Function to handle session creation
	const handleCreateSession = (e) => {
		e.preventDefault();
		const formData = new FormData(e.target);
		formData.append("_action", "createSession");
		fetcher.submit(formData, { method: "post" });
	};

	// Function to handle child info update
	const handleChildInfoChange = (e) => {
		const { name, value } = e.target;
		setChildInfo({
			...childInfo,
			[name]: value,
		});
	};

	// Function to handle guardian info update
	const handleGuardianInfoChange = (e) => {
		const { name, value } = e.target;
		setGuardianInfo({
			...guardianInfo,
			[name]: value,
		});
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
		if (guardianInfo.firstName && guardianInfo.lastName) {
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

			// Add session ID
			formData.append("sessionId", activeSession.id);

			// Add authorized pickup persons
			formData.append("authorizedPickups", JSON.stringify(authorizedPickups));

			// Submit form data
			fetcher.submit(formData, { method: "post" });
		} else {
			toast.error("Please enter the guardian's first and last name.");
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
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="session">Session</TabsTrigger>
					<TabsTrigger value="child" disabled={!activeSession}>
						Child Info
					</TabsTrigger>
					<TabsTrigger value="guardian" disabled={!childInfo.firstName}>
						Guardian Info
					</TabsTrigger>
					<TabsTrigger value="complete" disabled={!checkinComplete}>
						Complete
					</TabsTrigger>
				</TabsList>

				<TabsContent value="session">
					<Card>
						<CardHeader>
							<CardTitle>Check-in Session</CardTitle>
							<CardDescription>
								Create a new check-in session or select an existing one.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<fetcher.Form
								onSubmit={handleCreateSession}
								className="space-y-4"
							>
								<div className="space-y-2">
									<Label htmlFor="sessionName">Session Name</Label>
									<Input
										id="sessionName"
										name="sessionName"
										placeholder="e.g., Sunday School - June 2, 2024"
										required
									/>
								</div>
								<Button type="submit">Create Session</Button>
							</fetcher.Form>

							{sessions?.length > 0 && (
								<div className="mt-6">
									<h3 className="text-lg font-medium mb-2">Active Sessions</h3>
									<div className="space-y-2">
										{sessions?.map((session) => (
											<Card
												key={session.id}
												className={`p-4 cursor-pointer transition-all ${
													activeSession?.id === session.id
														? "border-2 border-primary bg-primary/5"
														: "hover:bg-muted/50"
												}`}
												onClick={() => {
													setActiveSession(session);
													toast.success(`Selected session: ${session.name}`);
												}}
											>
												<div className="font-medium">{session.name}</div>
												<div className="text-sm text-muted-foreground">
													Started:{" "}
													{new Date(session.startTime).toLocaleString()}
												</div>
												{activeSession?.id === session.id && (
													<div className="mt-2 text-sm font-medium text-primary">
														✓ Selected
													</div>
												)}
											</Card>
										))}
									</div>
								</div>
							)}
						</CardContent>
						<CardFooter>
							<Button
								onClick={() => {
									if (activeSession) {
										setActiveTab("child");
									}
								}}
								disabled={!activeSession}
							>
								Next: Child Information
							</Button>
						</CardFooter>
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
										/>
									</div>
								</div>
								<div className="space-y-4">
									<div className="space-y-2">
										<Label>Child's Photo</Label>
										{childPhoto ? (
											<div className="relative">
												<img
													src={childPhoto}
													alt="Child"
													className="w-full h-64 object-cover rounded-md"
												/>
												<Button
													variant="outline"
													size="sm"
													className="absolute top-2 right-2"
													onClick={() => setChildPhoto(null)}
												>
													Retake
												</Button>
											</div>
										) : (
											<div className="border rounded-md p-4">
												<video
													ref={childVideoRef}
													autoPlay
													playsInline
													className="w-full h-64 object-cover"
													onLoadedMetadata={() => console.log("Camera ready")}
												>
													<track kind="captions" />
												</video>
												<canvas
													ref={childCanvasRef}
													style={{ display: "none" }}
												/>
												<div className="flex space-x-2 mt-2">
													<Button className="flex-1" onClick={startChildCamera}>
														Start Camera
													</Button>
													<Button
														className="flex-1"
														onClick={captureChildPhoto}
													>
														Take Photo
													</Button>
												</div>
											</div>
										)}
									</div>
								</div>
							</div>
						</CardContent>
						<CardFooter className="flex justify-between">
							<Button variant="outline" onClick={() => setActiveTab("session")}>
								Back
							</Button>
							<Button
								onClick={() => {
									if (childInfo.firstName && childInfo.lastName) {
										setActiveTab("guardian");
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
		</div>
	);
}
