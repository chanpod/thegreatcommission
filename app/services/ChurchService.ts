import type { IChurchFormData } from "~/src/components/forms/createChurch/CreateChurchForm";
import type {
	churchOrganization,
	users,
	organizationRoles,
	usersToOrganizationRoles,
} from "server/db/schema";
import { AuthorizationService } from "./AuthorizationService";

export class ChurchService {
	private church: typeof churchOrganization.$inferSelect | undefined;

	constructor(
		churchIn: typeof churchOrganization.$inferSelect | undefined = undefined,
	) {
		this.church = churchIn;
	}

	async getChurchFormDataFromRequest(
		request: Request,
	): Promise<IChurchFormData> {
		const formData = await request.formData();
		const church: IChurchFormData = {
			name: formData.get("name") as string,
			city: formData.get("city") as string,
			state: formData.get("state") as string,
			street: (formData.get("street") as string) || null,
			zip: formData.get("zip") as string,
			churchBannerUrl: (formData.get("churchBannerUrl") as string) || null,
			mainChurchWebsite: (formData.get("mainChurchWebsite") as string) || null,
		};

		return church;
	}

	userIsAdmin(
		user: typeof users.$inferSelect | null,
		organizationRolesIn: Array<typeof organizationRoles.$inferSelect> | null,
		userToRoles: Array<typeof usersToOrganizationRoles.$inferSelect> | null,
	): boolean {
		console.log("ChurchService.userIsAdmin check", {
			hasChurch: !!this.church,
			churchId: this.church?.id,
			hasUser: !!user,
			userId: user?.id,
			hasOrgRoles: !!organizationRolesIn,
			numOrgRoles: organizationRolesIn?.length,
			hasUserToRoles: !!userToRoles,
			numUserToRoles: userToRoles?.length,
		});

		if (!this.church || !user || !organizationRolesIn || !userToRoles)
			return false;

		const authService = new AuthorizationService(
			user,
			organizationRolesIn,
			userToRoles,
		);
		const isAdmin = authService.isAdmin(this.church.id);
		console.log("User admin status via roles:", isAdmin);
		return isAdmin;
	}
}
