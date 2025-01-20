import { Image as PhotoIcon } from "lucide-react";


import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

export const UserAvatar = ({ user }: { user?: User | null }) => {
    return (
        <>
            {user?.avatarUrl ? (
                <Avatar>
                    <AvatarImage src={user?.avatarUrl} />
                    <AvatarFallback>NA</AvatarFallback>
                </Avatar>
            ) : (
                <Avatar>                    
                    <AvatarFallback>NA</AvatarFallback>
                </Avatar>
            )}
        </>
    );
};
