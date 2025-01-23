import { isNil } from "lodash-es";
import { useContext } from "react";
import type { users } from "server/db/schema";
import { UserContext } from "~/src/providers/userProvider";

const useIsLoggedIn = () => {
    const userContext = useContext(UserContext);
    
    return {
        isLoggedIn: !isNil(userContext.user),
        user: userContext.user,
    } as {
        isLoggedIn: boolean;
        user: typeof users.$inferSelect | undefined;
    };
};

export default useIsLoggedIn;
