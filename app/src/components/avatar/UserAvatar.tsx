import { Image as PhotoIcon } from "lucide-react";


import React from "react";
import { Avatar, AvatarImage } from "~/components/ui/avatar";

export const UserAvatar = ({ user }: { user?: User | null }) => {
    return (
        <>
            {user?.avatarUrl ? (
                <Avatar>
                    <AvatarImage src={user?.avatarUrl} />
                </Avatar>
            ) : (
                <PhotoIcon className="h-8 w-8 mr-1 p-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 rounded-full bg-[#0a192f]" />
                
            )}
        </>
    );
};
