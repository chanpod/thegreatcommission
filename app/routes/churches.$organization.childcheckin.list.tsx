import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
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

export default function ChildCheckinList() {
	const { organization } = useParams();
	const navigate = useNavigate();
	const { toast } = useToast();
	const [sessions, setSessions] = useState([]);
	const [activeSession, setActiveSession] = useState(null);
	const [checkins, setCheckins] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");

	useEffect(() => {
		const fetchSessions = async () => {
			try {
				setLoading(true);
				const sessionsData =
					await childCheckinService.getActiveCheckinSessions(organization);
				setSessions(sessionsData);

				if (sessionsData.length > 0) {
					setActiveSession(sessionsData[0]);
					fetchCheckins(sessionsData[0].id);
				} else {
					setLoading(false);
				}
			} catch (error) {
				console.error("Error fetching sessions:", error);
				toast({
					title: "Error",
					description: "Failed to load check-in sessions. Please try again.",
					variant: "destructive",
				});
				setLoading(false);
			}
		};

		fetchSessions();
	}, [organization, toast]);

	const fetchCheckins = async (sessionId) => {
		try {
			setLoading(true);
			const checkinsData =
				await childCheckinService.getActiveCheckins(sessionId);
			setCheckins(checkinsData);
			setLoading(false);
		} catch (error) {
			console.error("Error fetching checkins:", error);
			toast({
				title: "Error",
				description: "Failed to load check-ins. Please try again.",
				variant: "destructive",
			});
			setLoading(false);
		}
	};

	const handleSessionChange = (sessionId) => {
		const session = sessions.find((s) => s.id === sessionId);
		setActiveSession(session);
		fetchCheckins(sessionId);
	};

	const handleCheckout = async (checkinId, guardianId) => {
		try {
			await childCheckinService.checkoutChild(checkinId, guardianId);

			// Refresh the list
			fetchCheckins(activeSession.id);

			toast({
				title: "Check-out Complete",
				description: "Child has been successfully checked out.",
			});
		} catch (error) {
			console.error("Error checking out child:", error);
			toast({
				title: "Error",
				description: "Failed to complete check-out. Please try again.",
				variant: "destructive",
			});
		}
	};

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
							value={activeSession?.id || ""}
							onChange={(e) => handleSessionChange(e.target.value)}
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
										This tab would show all children, including those already
										checked out.
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
