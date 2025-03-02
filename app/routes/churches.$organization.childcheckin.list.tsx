import { useState, useEffect } from "react";
import {
	useParams,
	useNavigate,
	Link,
	useLoaderData,
	useFetcher,
} from "react-router";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
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

// Loader to fetch sessions and checkins
export const loader = createAuthLoader(async ({ params, request }) => {
	const { organization } = params;

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
		if (sessions.length > 0) {
			checkins = await childCheckinService.getActiveCheckins(sessions[0].id);
		}

		return data({
			sessions,
			checkins,
			activeSessionId: sessions.length > 0 ? sessions[0].id : null,
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
			return data({
				success: true,
				checkins,
				activeSessionId: sessionId.toString(),
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

			return data({
				success: true,
				message: "Child has been successfully checked out",
				checkins,
				activeSessionId: sessionId.toString(),
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

export default function ChildCheckinList() {
	const { organization } = useParams();
	const navigate = useNavigate();
	const { toast } = useToast();
	const {
		sessions,
		checkins: initialCheckins,
		activeSessionId: initialSessionId,
		error,
	} = useLoaderData<typeof loader>();
	const fetcher = useFetcher();

	const [activeSessionId, setActiveSessionId] = useState(initialSessionId);
	const [checkins, setCheckins] = useState(initialCheckins);
	const [loading, setLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");

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
		if (fetcher.data && fetcher.data.success) {
			setCheckins(fetcher.data.checkins);
			setActiveSessionId(fetcher.data.activeSessionId);
			setLoading(false);

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
			setLoading(false);
		}
	}, [fetcher.data, toast]);

	// Set loading state when fetcher is submitting
	useEffect(() => {
		if (fetcher.state === "submitting") {
			setLoading(true);
		}
	}, [fetcher.state]);

	const handleSessionChange = (sessionId) => {
		setLoading(true);
		const formData = new FormData();
		formData.append("_action", "getCheckins");
		formData.append("sessionId", sessionId);
		fetcher.submit(formData, { method: "post" });
	};

	const handleCheckout = (checkinId, guardianId) => {
		const formData = new FormData();
		formData.append("_action", "checkout");
		formData.append("checkinId", checkinId);
		formData.append("guardianId", guardianId);
		formData.append("sessionId", activeSessionId);
		fetcher.submit(formData, { method: "post" });
	};

	const activeSession = sessions.find((s) => s.id === activeSessionId);
	const filteredCheckins = checkins.filter((checkin) => {
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
					<div className="mb-6">
						<Label htmlFor="session-select">Select Session</Label>
						<select
							id="session-select"
							className="w-full p-2 border rounded-md mt-1"
							value={activeSessionId || ""}
							onChange={(e) => handleSessionChange(e.target.value)}
							disabled={loading}
						>
							{sessions.map((session) => (
								<option key={session.id} value={session.id}>
									{session.name} -{" "}
									{new Date(session.startTime).toLocaleDateString()}
								</option>
							))}
						</select>
					</div>

					<div className="mb-6">
						<Label htmlFor="search">Search Children</Label>
						<Input
							id="search"
							type="text"
							placeholder="Search by name..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="mt-1"
						/>
					</div>

					<Tabs defaultValue="checked-in">
						<TabsList className="mb-4">
							<TabsTrigger value="checked-in">Checked In</TabsTrigger>
							<TabsTrigger value="all">All</TabsTrigger>
						</TabsList>

						<TabsContent value="checked-in">
							{loading ? (
								<div className="flex justify-center py-12">
									<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
								</div>
							) : filteredCheckins.length === 0 ? (
								<Card>
									<CardContent className="pt-6">
										<p className="text-center text-muted-foreground">
											No children currently checked in.
										</p>
									</CardContent>
								</Card>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{filteredCheckins.map((checkin) => (
										<Card key={checkin.id}>
											<CardHeader className="pb-2">
												<CardTitle>
													{checkin.child.firstName} {checkin.child.lastName}
												</CardTitle>
												<CardDescription>
													Checked in:{" "}
													{new Date(checkin.checkinTime).toLocaleTimeString()}
												</CardDescription>
											</CardHeader>
											<CardContent>
												<div className="flex items-center space-x-4 mb-4">
													{checkin.child.photoUrl && (
														<img
															src={checkin.child.photoUrl}
															alt={`${checkin.child.firstName} ${checkin.child.lastName}`}
															className="w-16 h-16 rounded-full object-cover"
														/>
													)}
													<div>
														{checkin.child.allergies && (
															<p className="text-sm text-destructive">
																<span className="font-medium">Allergies:</span>{" "}
																{checkin.child.allergies}
															</p>
														)}
														{checkin.child.specialNotes && (
															<p className="text-sm">
																<span className="font-medium">Notes:</span>{" "}
																{checkin.child.specialNotes}
															</p>
														)}
													</div>
												</div>

												<div className="flex justify-between">
													<Button variant="outline" size="sm" asChild>
														<Link
															to={`/churches/${organization}/childcheckin/verify/${checkin.secureId}`}
														>
															View Details
														</Link>
													</Button>
													<Button
														size="sm"
														onClick={() =>
															handleCheckout(
																checkin.id,
																checkin.checkedInByGuardianId,
															)
														}
														disabled={loading}
													>
														Check Out
													</Button>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							)}
						</TabsContent>

						<TabsContent value="all">
							<Card>
								<CardContent className="pt-6">
									<p className="text-center text-muted-foreground">
										All check-ins view will be implemented soon.
									</p>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</>
			)}
		</div>
	);
}
