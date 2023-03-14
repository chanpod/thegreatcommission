import React, { useContext } from "react";
import { UserContext } from "~/root";
import { Button } from "~/src/components/button/Button";

const UserProfilePage = () => {
    const userContext = useContext(UserContext);
    return (
        <div className="flex-col">
            <div className="flex">
                <div className="text-5xl>">User Profile</div>
                <Button>Edit</Button>
            </div>
            <div>Email: {userContext.user?.email}</div>
            <div>First Name: {userContext.user?.firstName}</div>
            <div>Last Name: {userContext.user?.lastName}</div>
        </div>
    );
};

export default UserProfilePage;
