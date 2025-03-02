import {
	ChurchIcon,
	Globe,
	Loader2,
	MenuIcon,
	PersonStanding,
	X,
} from "lucide-react";
import { useContext, useState } from "react";
import { Link, useNavigation } from "react-router";
import { Button } from "~/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "~/components/ui/sheet";

import {
	SignedIn,
	SignedOut,
	SignInButton,
	UserButton,
} from "@clerk/react-router";
import tgcIcon from "~/src/assets/images/tgc_background.png";
import { Sidenav } from "~/src/components/sidenav/Sidenav";
import useIsLoggedIn from "~/src/hooks/useIsLoggedIn";
import { ApplicationContext } from "~/src/providers/appContextProvider";
import LoginModal from "./LoginModal";
import SearchBar from "./SearchBar";

export const navigation = [
	{ name: "Churches", href: "/churches", current: true, icon: ChurchIcon },
	// {
	// 	name: "Missionaries",
	// 	href: "/missionaries",
	// 	current: false,
	// 	icon: PersonStanding,
	// },
	// { name: "Missions", href: "/missions", current: false, icon: Globe },
];

export default function Header() {
	const applicationContext = useContext(ApplicationContext);
	const transition = useNavigation();
	const [showLoginModal, setShowLoginModal] = useState(false);
	const loading = transition.state !== "idle";
	const [searchLoading, setSearchLoading] = useState(false);
	const { isLoggedIn, user } = useIsLoggedIn();

	function handleClose(success = false) {
		console.log("Closing");
		setShowLoginModal(false);
	}

	return (
		<nav className="bg-white pb-2">
			<div className="mx-auto px-2 sm:px-6 lg:px-8">
				<div className="relative flex h-16 items-center justify-between">
					<div className="inset-y-0 left-0 items-center lg:hidden">
						<Sheet
							open={applicationContext.sideNavOpen}
							onOpenChange={applicationContext.setSideNavOpen}
						>
							<SheetTrigger asChild>
								<Button variant="ghost" size="icon">
									<span className="sr-only">Open main menu</span>
									{applicationContext.sideNavOpen ? (
										<X className="h-6 w-6" />
									) : (
										<MenuIcon className="h-6 w-6" />
									)}
								</Button>
							</SheetTrigger>
							<SheetContent side="left" className="w-[250px] sm:w-[300px] p-0">
								<Sidenav />
							</SheetContent>
						</Sheet>
					</div>
					<div
						style={{ width: "60px" }}
						className="flex flex-none flex-1 items-center justify-center sm:items-stretch sm:justify-start"
					>
						<div>
							{loading || searchLoading ? (
								<Loader2 className="animate-spin h-10 w-10 text-gray-700" />
							) : (
								<Link to="/">
									<img
										src={tgcIcon}
										className="xs:w-10 xs:h-10 sm:w-10 sm:h-10 md:w-full md:h-full rounded-full"
										alt="The Great Commission Logo"
									/>
								</Link>
							)}
						</div>
					</div>
					<div className="flex flex-1 items-start align-items-start sm:items-stretch sm:justify-start relative">
						<SearchBar
							inputStyle="header"
							setLoading={(loading) => setSearchLoading(loading)}
						/>
					</div>
					<div>
						<SignedOut>
							<SignInButton style={{ color: "black" }} mode="modal" />
						</SignedOut>
						<SignedIn>
							<UserButton showName />
						</SignedIn>
						{/* <DropdownMenu>
							<DropdownMenuTrigger>
								<div className="flex flex-row items-center">
									<UserAvatar user={user} />
									<div className="text-sm pl-2 text-gray-700">
										{user?.firstName}
									</div>
								</div>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-48">
								{isLoggedIn ? (
									<>
										<DropdownMenuItem>
											<Link to="/user/profile" className="w-full">
												Your Profile
											</Link>
										</DropdownMenuItem>
										<DropdownMenuItem>
											<Link to="/logout" className="w-full">
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
						</DropdownMenu> */}
					</div>
				</div>
				<LoginModal showDialog={showLoginModal} onClose={handleClose} />
			</div>
		</nav>
	);
}
