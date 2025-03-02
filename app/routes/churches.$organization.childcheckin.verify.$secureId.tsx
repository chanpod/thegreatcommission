import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { childCheckinService } from "~/services/ChildCheckinService";
import { useToast } from "~/hooks/use-toast";

export default function VerifyCheckin() {
	const { organization, secureId } = useParams();
	const navigate = useNavigate();
	const { toast } = useToast();
	const [checkin, setCheckin] = useState(null);
	const [child, setChild] = useState(null);
	const [guardian, setGuardian] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const verifyCheckin = async () => {
			try {
				setLoading(true);
				// Verify the checkin using the secure ID
				const checkinData =
					await childCheckinService.verifyCheckinBySecureId(secureId);

				if (!checkinData) {
					setError(
						"Invalid or expired QR code. Please try again or contact a volunteer.",
					);
					setLoading(false);
					return;
				}

				setCheckin(checkinData);

				// Get child details
				const childData = await childCheckinService.getChildById(
					checkinData.childId,
				);
				setChild(childData);

				// Get guardian details
				const guardianData = await childCheckinService.getGuardianById(
					checkinData.checkedInByGuardianId,
				);
				setGuardian(guardianData);

				setLoading(false);
			} catch (error) {
				console.error("Error verifying checkin:", error);
				setError(
					"An error occurred while verifying the check-in. Please try again or contact a volunteer.",
				);
				setLoading(false);
			}
		};

		verifyCheckin();
	}, [secureId]);

	const handleCheckout = async () => {
		try {
			if (!checkin || !guardian) return;

			await childCheckinService.checkoutChild(checkin.id, guardian.id);

			toast({
				title: "Check-out Complete",
				description: `${child.firstName} ${child.lastName} has been successfully checked out.`,
			});

			// Navigate back to the main checkin page
			navigate(`/churches/${organization}/childcheckin`);
		} catch (error) {
			console.error("Error checking out child:", error);
			toast({
				title: "Error",
				description:
					"Failed to complete check-out. Please try again or contact a volunteer.",
				variant: "destructive",
			});
		}
	};

	if (loading) {
		return (
			<div className="container mx-auto py-8 flex items-center justify-center min-h-[60vh]">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>Verifying Check-in</CardTitle>
						<CardDescription>
							Please wait while we verify the check-in information...
						</CardDescription>
					</CardHeader>
					<CardContent className="flex justify-center py-6">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
					</CardContent>
				</Card>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container mx-auto py-8 flex items-center justify-center min-h-[60vh]">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>Verification Error</CardTitle>
						<CardDescription>We couldn't verify this check-in.</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-destructive">{error}</p>
					</CardContent>
					<CardFooter>
						<Button
							onClick={() => navigate(`/churches/${organization}/childcheckin`)}
						>
							Return to Check-in
						</Button>
					</CardFooter>
				</Card>
			</div>
		);
	}

	if (checkin && checkin.status === "checked-out") {
		return (
			<div className="container mx-auto py-8 flex items-center justify-center min-h-[60vh]">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>Already Checked Out</CardTitle>
						<CardDescription>
							This child has already been checked out.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p>
							{child?.firstName} {child?.lastName} was checked out at{" "}
							{new Date(checkin.checkoutTime).toLocaleString()}.
						</p>
					</CardContent>
					<CardFooter>
						<Button
							onClick={() => navigate(`/churches/${organization}/childcheckin`)}
						>
							Return to Check-in
						</Button>
					</CardFooter>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-8">
			<Card className="w-full max-w-2xl mx-auto">
				<CardHeader>
					<CardTitle>Verify Check-out</CardTitle>
					<CardDescription>Confirm child pick-up information</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{child && (
						<div className="space-y-2">
							<h3 className="text-lg font-medium">Child Information</h3>
							<div className="flex items-center space-x-4">
								{child.photoUrl && (
									<img
										src={child.photoUrl}
										alt={`${child.firstName} ${child.lastName}`}
										className="w-20 h-20 rounded-full object-cover"
									/>
								)}
								<div>
									<p className="font-medium">
										{child.firstName} {child.lastName}
									</p>
									{child.dateOfBirth && (
										<p className="text-sm text-muted-foreground">
											Date of Birth:{" "}
											{new Date(child.dateOfBirth).toLocaleDateString()}
										</p>
									)}
									{child.allergies && (
										<p className="text-sm text-destructive">
											Allergies: {child.allergies}
										</p>
									)}
								</div>
							</div>
						</div>
					)}

					{guardian && (
						<div className="space-y-2">
							<h3 className="text-lg font-medium">Checked in by</h3>
							<div className="flex items-center space-x-4">
								{guardian.photoUrl && (
									<img
										src={guardian.photoUrl}
										alt={`${guardian.firstName} ${guardian.lastName}`}
										className="w-20 h-20 rounded-full object-cover"
									/>
								)}
								<div>
									<p className="font-medium">
										{guardian.firstName} {guardian.lastName}
									</p>
									{guardian.phone && (
										<p className="text-sm text-muted-foreground">
											Phone: {guardian.phone}
										</p>
									)}
								</div>
							</div>
						</div>
					)}

					{checkin && (
						<div className="space-y-2">
							<h3 className="text-lg font-medium">Check-in Details</h3>
							<p>
								<span className="font-medium">Check-in Time:</span>{" "}
								{new Date(checkin.checkinTime).toLocaleString()}
							</p>
							{checkin.checkinNotes && (
								<p>
									<span className="font-medium">Notes:</span>{" "}
									{checkin.checkinNotes}
								</p>
							)}
						</div>
					)}

					<div className="bg-amber-50 p-4 rounded-md border border-amber-200">
						<h3 className="text-lg font-medium text-amber-800 mb-2">
							Verification Instructions
						</h3>
						<p className="text-amber-700">
							Please verify the guardian's identity by comparing their face with
							the photo above. If the person picking up the child is not the
							same as the one who checked in, please ask for ID and verify they
							are authorized to pick up this child.
						</p>
					</div>
				</CardContent>
				<CardFooter className="flex justify-between">
					<Button
						variant="outline"
						onClick={() => navigate(`/churches/${organization}/childcheckin`)}
					>
						Cancel
					</Button>
					<Button onClick={handleCheckout}>Confirm Check-out</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
