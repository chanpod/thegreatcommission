import { useContext, useEffect, useState } from "react";
import { UserContext } from "~/root";
import type { users } from "server/db/schema";
import { isNil } from "lodash-es";

const useIsLoggedIn = () => {
    const userContext = useContext(UserContext);
    const [user, setUser] = useState(userContext.user);

    useEffect(() => {
        console.log(userContext.user);
        setUser(userContext.user);
    }, [userContext, userContext.user]);

    return {
        isLoggedIn: !isNil(user),
        user: user,
    } as {
        isLoggedIn: boolean;
        user: typeof users | null;
    };
};

export default useIsLoggedIn;
