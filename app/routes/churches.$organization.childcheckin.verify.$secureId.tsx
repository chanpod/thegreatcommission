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
import { childCheckinService } from "~/services/ChildCheckinService";
import { useToast } from "~/hooks/use-toast";
import { createAuthLoader } from "~/server/auth/authLoader";
import { data, redirect } from "react-router";
import type { ChildCheckin, Child, Guardian } from "@/server/db/childCheckin";

// Define types for our loader data
interface LoaderData {
	checkin?: ChildCheckin;
	child?: Child;
	guardian?: Guardian;
	error?: string;
}

// Loader to fetch check-in data
export const loader = createAuthLoader(async ({ params, request }) => {
	const { secureId, organization } = params;

	if (!secureId || !organization) {
		return data(
			{
				error: "Invalid parameters",
			},
			{ status: 400 },
		);
	}

	try {
		// Verify the checkin using the secure ID
		const checkin = await childCheckinService.verifyCheckinBySecureId(secureId);

		if (!checkin) {
			return data(
				{
					error:
						"Invalid or expired QR code. Please try again or contact a volunteer.",
				},
				{ status: 404 },
			);
		}

		// Get child details
		const child = await childCheckinService.getChildById(checkin.childId);

		// Get guardian details
		const guardian = await childCheckinService.getGuardianById(
			checkin.checkedInByGuardianId,
		);

		return data({ checkin, child, guardian });
	} catch (error) {
		console.error("Error verifying checkin:", error);
		return data(
			{
				error:
					"An error occurred while verifying the check-in. Please try again or contact a volunteer.",
			},
			{ status: 500 },
		);
	}
});

// Action to handle checkout process
export const action = createAuthLoader(async ({ params, request }) => {
	const { secureId, organization } = params;

	if (!secureId || !organization) {
		return data(
			{
				success: false,
				error: "Invalid parameters",
			},
			{ status: 400 },
		);
	}

	try {
		const formData = await request.formData();
		const action = formData.get("_action");

		if (action === "checkout") {
			const checkinId = formData.get("checkinId");
			const guardianId = formData.get("guardianId");

			if (!checkinId || !guardianId) {
				return data(
					{
						success: false,
						error: "Missing required fields",
					},
					{ status: 400 },
				);
			}

			await childCheckinService.checkoutChild(
				checkinId.toString(),
				guardianId.toString(),
			);

			return redirect(`/churches/${organization}/childcheckin`);
		}

		return data(
			{
				success: false,
				error: "Invalid action",
			},
			{ status: 400 },
		);
	} catch (error) {
		console.error("Error checking out child:", error);
		return data(
			{
				success: false,
				error:
					"Failed to complete check-out. Please try again or contact a volunteer.",
			},
			{ status: 500 },
		);
	}
});

export default function VerifyCheckin() {
	const { organization } = useParams();
	const navigate = useNavigate();
	const fetcher = useFetcher();
	const { toast } = useToast();
	const loaderData = useLoaderData<typeof loader>() as LoaderData;

	// If there's a loader error, it means we couldn't verify the check-in
	const error = loaderData.error;

	// If there's no error, we have checkin, child, and guardian data
	const { checkin, child, guardian } = loaderData.error
		? { checkin: null, child: null, guardian: null }
		: loaderData;

	// Handle action errors
	useEffect(() => {
		if (fetcher.data && !fetcher.data.success && fetcher.data.error) {
			toast({
				title: "Error",
				description: fetcher.data.error,
				variant: "destructive",
			});
		}
	}, [fetcher.data, toast]);

	const handleCheckout = () => {
		if (!checkin || !guardian) return;

		// Show processing toast
		toast({
			title: "Processing...",
			description: "Processing checkout, please wait...",
		});

		const formData = new FormData();
		formData.append("_action", "checkout");
		formData.append("checkinId", checkin.id);
		formData.append("guardianId", guardian.id);
		fetcher.submit(formData, { method: "post" });
	};

	// Handle action completion
	useEffect(() => {
		if (fetcher.state === "idle" && fetcher.data && fetcher.data.success) {
			toast({
				title: "Check-out Complete",
				description: `${child?.firstName} ${child?.lastName} has been successfully checked out.`,
			});
			// Redirect after a short delay to allow the toast to be seen
			setTimeout(() => {
				navigate(`/churches/${organization}/childcheckin`);
			}, 2000);
		}
	}, [fetcher.state, fetcher.data, child, navigate, organization, toast]);

	if (!checkin && !error) {
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
				<CardFooter className="flex space-x-2 justify-between">
					<Button
						variant="outline"
						onClick={() =>
							navigate(`/churches/${organization}/childcheckin/list`)
						}
					>
						Back to Check-in List
					</Button>
					<fetcher.Form method="post">
						<input type="hidden" name="_action" value="checkout" />
						<input type="hidden" name="checkinId" value={checkin.id} />
						<input type="hidden" name="guardianId" value={guardian.id} />
						<Button type="submit" disabled={fetcher.state === "submitting"}>
							{fetcher.state === "submitting" ? (
								<>
									<div className="animate-spin -ml-1 mr-3 h-4 w-4 border-b-2 border-white rounded-full" />
									Processing...
								</>
							) : (
								"Confirm Check-out"
							)}
						</Button>
					</fetcher.Form>
				</CardFooter>
			</Card>
		</div>
	);
}
