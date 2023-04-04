import { PhotoIcon } from "@heroicons/react/24/outline";
import { User } from "@prisma/client";
import { Avatar } from "flowbite-react";
import React from "react";

export const UserAvatar = ({ user }: { user?: User | null }) => {
    return (
        <>
            {user?.avatarUrl ? (
                <Avatar img={user?.avatarUrl} size="md" rounded />
            ) : (
                <PhotoIcon className="h-8 w-8 mr-1 p-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 rounded-full bg-[#0a192f]" />
            )}
        </>
    );
};
