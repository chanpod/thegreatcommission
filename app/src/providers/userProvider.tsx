import { createContext, useEffect, useState } from "react";
import type {
	users,
	organizationRoles,
	usersToOrganizationRoles,
} from "server/db/schema";

interface UserContextType {
	user: typeof users.$inferSelect | null;
	roles: any[] | null;
	organizationRoles: Array<typeof organizationRoles.$inferSelect> | null;
	userToRoles: Array<typeof usersToOrganizationRoles.$inferSelect> | null;
	isLoggedIn: boolean;
}

export const UserContext = createContext<UserContextType>({
	user: null,
	roles: null,
	organizationRoles: null,
	userToRoles: null,
	isLoggedIn: false,
});

interface Props {
	user: typeof users.$inferSelect | null;
	roles: any[] | null;
	organizationRoles: Array<typeof organizationRoles.$inferSelect> | null;
	userToRoles: Array<typeof usersToOrganizationRoles.$inferSelect> | null;
	children: React.ReactNode;
}

export function UserProvider({
	user,
	roles,
	organizationRoles,
	userToRoles,
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
				roles,
				organizationRoles,
				userToRoles,
				isLoggedIn,
			}}
		>
			{children}
		</UserContext.Provider>
	);
}
