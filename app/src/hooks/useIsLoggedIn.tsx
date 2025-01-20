import { useContext, useEffect, useState } from "react";
import { UserContext } from "~/root";
import type { users } from "server/db/schema";

const useIsLoggedIn = () => {
    const userContext = useContext(UserContext);
    const [user, setUser] = useState(userContext.user);

    useEffect(() => {
        setUser(userContext.user);
    }, [userContext, userContext.user]);

    return {
        isLoggedIn: user !== null,
        user: user,
    } as {
        isLoggedIn: boolean;
        user: typeof users | null;
    };
};

export default useIsLoggedIn;
