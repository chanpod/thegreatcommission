import { Link, useMatches, useNavigation } from "react-router";
import { Fragment, useContext, useState } from "react";
import { Button } from "~/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "~/components/ui/sheet"
import { MenuIcon, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"

import { ApplicationContext } from "~/root";
import tgcIcon from "~/src/assets/images/tgcIcon.png";
import { classNames } from "~/src/helpers";
import useIsLoggedIn from "~/src/hooks/useIsLoggedIn";
import { UserAvatar } from "../avatar/UserAvatar";
import LoginModal from "./LoginModal";
import SearchBar from "./SearchBar";

export const navigation = [
    { name: "Churches", href: "/churches", current: true },
    { name: "Missionaries", href: "/missionaries", current: false },
    { name: "Missions", href: "/missions", current: false },
];

export default function Header() {
    const matches = useMatches();
    const applicationContext = useContext(ApplicationContext);
    const transition = useNavigation();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const loading = transition.state != "idle";
    const [searchLoading, setSearchLoading] = useState(false);
    const { isLoggedIn, user } = useIsLoggedIn();

    function handleClose(success = false){
        console.log("Closing")
        setShowLoginModal(false);
    }

    return (
        <nav className="bg-white">
            <div className="mx-auto px-2 sm:px-6 lg:px-8">
                <div className="relative flex h-16 items-center justify-between">
                    <div className="inset-y-0 left-0 items-center lg:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => applicationContext.setSideNavOpen(!applicationContext.sideNavOpen)}
                                    className="text-gray-400 hover:bg-gray-700 hover:text-white"
                                >
                                    <span className="sr-only">Open main menu</span>
                                    {applicationContext.sideNavOpen ? (
                                        <X className="h-6 w-6" />
                                    ) : (
                                        <MenuIcon className="h-6 w-6" />
                                    )}
                                </Button>
                            </SheetTrigger>
                        </Sheet>
                    </div>
                    <div
                        style={{ width: "60px" }}
                        className="flex flex-none flex-1 items-center justify-center sm:items-stretch sm:justify-start"
                    >
                        <div>
                            {loading || searchLoading ? (
                                <div className="animate-spin h-10 w-10" />
                            ) : (
                                <Link to="/">
                                    <img
                                        src={tgcIcon}
                                        className="xs:w-10 xs:h-10 sm:w-10 sm:h-10 md:w-full md:h-full"
                                    />
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-1 items-start align-items-start sm:items-stretch sm:justify-start relative">
                        <SearchBar inputStyle="header" setLoading={(loading) => setSearchLoading(loading)} />
                    </div>
                    <div className="inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex items-center">
                                    <span className="sr-only">Open user menu</span>
                                    <UserAvatar user={user} />
                                    {user?.firstName}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-48">
                                {isLoggedIn ? (
                                    <>
                                        <DropdownMenuItem>
                                            <Link
                                                to="/user/profile"
                                                className="w-full"
                                            >
                                                Your Profile
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Link
                                                to="/logout"
                                                className="w-full"
                                            >
                                                Logout
                                            </Link>
                                        </DropdownMenuItem>
                                    </>
                                ) : (
                                    <DropdownMenuItem onSelect={() => setShowLoginModal(true)}>
                                        Login
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                <LoginModal showDialog={showLoginModal} onClose={handleClose} />
            </div>
        </nav>
    );
}
