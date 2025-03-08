import { data } from "react-router";
import { childCheckinService } from "~/services/ChildCheckinService";

export async function action({ request }) {
	const requestData = await request.json();
	const { action, ...params } = requestData;

	try {
		switch (action) {
			case "findFamilyByPhone": {
				const { phone, organizationId } = params;

				if (!phone || !organizationId) {
					return data(
						{ success: false, error: "Missing required parameters" },
						{ status: 400 },
					);
				}

				// Find family by phone
				const result = await childCheckinService.findFamilyByPhone(
					phone,
					organizationId,
				);

				if (!result || !result.family) {
					return data({ success: false, message: "Family not found" });
				}

				// Get children for this family
				const children = await childCheckinService.getChildrenByFamily(
					result.family.id,
				);

				return data({
					success: true,
					data: {
						user: result.user,
						family: result.family,
						children: children || [],
					},
				});
			}

			case "checkinChild": {
				const { childId, roomId, organizationId } = params;

				if (!childId || !roomId || !organizationId) {
					return data(
						{ success: false, error: "Missing required parameters" },
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
					churchOrganizationId: organizationId,
					// Add required fields
					updatedAt: new Date(),
					checkedInByUserId: "system", // Using "system" as the user ID for public check-ins
				};

				const newCheckin = await childCheckinService.checkinChild(checkinData);

				return data({
					success: true,
					data: {
						checkin: newCheckin,
						verifyUrl: `/churches/${organizationId}/childcheckin/verify/${newCheckin.secureId}`,
					},
				});
			}

			default:
				return data(
					{ success: false, error: "Invalid action" },
					{ status: 400 },
				);
		}
	} catch (error) {
		console.error("Error in child check-in API:", error);
		return data(
			{ success: false, error: "An error occurred" },
			{ status: 500 },
		);
	}
}
