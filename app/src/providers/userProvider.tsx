import { createContext, useEffect, useState } from "react";
import type {
	users,
	roles,
	usersToRoles,
	organizationRoles,
	usersToOrganizationRoles,
} from "server/db/schema";

interface UserContextType {
	user: typeof users.$inferSelect | null;
	siteRoles: Array<typeof roles.$inferSelect> | null;
	userToSiteRoles: Array<typeof usersToRoles.$inferSelect> | null;
	organizationRoles: Array<typeof organizationRoles.$inferSelect> | null;
	userToOrgRoles: Array<typeof usersToOrganizationRoles.$inferSelect> | null;
	isLoggedIn: boolean;
}

export const UserContext = createContext<UserContextType>({
	user: null,
	siteRoles: null,
	userToSiteRoles: null,
	organizationRoles: null,
	userToOrgRoles: null,
	isLoggedIn: false,
});

interface Props {
	user: typeof users.$inferSelect | null;
	siteRoles: Array<typeof roles.$inferSelect> | null;
	userToSiteRoles: Array<typeof usersToRoles.$inferSelect> | null;
	organizationRoles: Array<typeof organizationRoles.$inferSelect> | null;
	userToOrgRoles: Array<typeof usersToOrganizationRoles.$inferSelect> | null;
	children: React.ReactNode;
}

export function UserProvider({
	user,
	siteRoles,
	userToSiteRoles,
	organizationRoles,
	userToOrgRoles,
	children,
}: Props) {
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	useEffect(() => {
		setIsLoggedIn(!!user);
	}, [user]);

	return (
		<UserContext.Provider
			value={{
				user,
				siteRoles,
				userToSiteRoles,
				organizationRoles,
				userToOrgRoles,
				isLoggedIn,
			}}
		>
			{children}
		</UserContext.Provider>
	);
}
