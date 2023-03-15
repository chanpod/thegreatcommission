import { User } from "@prisma/client";
import React, { useContext } from "react";
import { UserContext } from "~/root";

const useIsLoggedIn = () => {
    const userContext = useContext(UserContext);

    return {
        isLoggedIn: userContext.user !== null,
        user: userContext.user,
    } as {
        isLoggedIn: boolean;
        user: User | null;
    };
};

export default useIsLoggedIn;
