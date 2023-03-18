import { User } from "@prisma/client";
import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "~/root";

const useIsLoggedIn = () => {
    const userContext = useContext(UserContext);
    const [user, setUser] = useState(userContext.user);

    useEffect(() => {
        console.log(userContext)
        setUser(userContext.user);
    }, [userContext, userContext.user]);

    return {
        isLoggedIn: user !== null,
        user: user,
    } as {
        isLoggedIn: boolean;
        user: User | null;
    };
};

export default useIsLoggedIn;
