import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight as ArrowLongRightIcon } from "lucide-react";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useMatches } from "react-router";
import { Button } from "~/components/ui/button";
import tgcIcon from "~/src/assets/images/tgc_background.png";
import { useClickOutside } from "~/src/hooks/useClickOutside";
import { ApplicationContext } from "~/src/providers/appContextProvider";
import { navigation } from "../header/Header";

export function Sidenav() {
	const matches = useMatches();
	const ref = useRef(null);
	const outsideClicked = useClickOutside(ref);

	const [isMobile, setIsMobile] = useState(false);
	const [showSidebar, setShowSidebar] = useState(false);

	const { sideNavOpen, setSideNavOpen } = useContext(ApplicationContext);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(max-width: 1024px)");

		setIsMobile(mediaQuery.matches);

		const handleResize = () => {
			setIsMobile(mediaQuery.matches);
		};

		mediaQuery.addListener(handleResize);

		return () => {
			mediaQuery.removeListener(handleResize);
		};
	}, []);

	useEffect(() => {
		if (outsideClicked) {
			setSideNavOpen(false);
		}
	}, [outsideClicked, setSideNavOpen]);

	useEffect(() => {
		if (isMobile) {
			setShowSidebar(sideNavOpen);
		} else {
			setShowSidebar(true);
		}
	}, [isMobile, sideNavOpen]);

	const menuWidth = 250;

	return (
		<div
			className="sidenav-container"
			style={{ position: "fixed", height: "100vh", zIndex: 50 }}
		>
			<AnimatePresence>
				{showSidebar && (
					<motion.aside
						key="sidenav"
						style={{
							position: isMobile ? "fixed" : "fixed",
							top: 0,
							left: 0,
							bottom: 0,
							height: "100vh",
						}}
						initial={{
							width: 0,
							minHeight: "100vh",
							height: "100vh",
							zIndex: 100,
							opacity: 0,
						}}
						animate={{
							width: menuWidth,
							opacity: 1,
						}}
						exit={{
							width: 0,
							height: "100vh",
							opacity: 0,
							transition: { duration: 0.3 },
						}}
						ref={ref}
						className="sidebar dark bg-background shadow-md overflow-y-auto"
					>
						<div
							className="sidebar-header flex items-center justify-center py-4"
							style={{ minWidth: menuWidth, overflow: "hidden" }}
						>
							<div className="inline-flex">
								<Link
									to="/"
									className="text-foreground flex-col items-center justify-center"
								>
									<div className="flex items-center justify-center">
										<div
											className="rounded-full mr-2 "
											style={{ maxWidth: "60px" }}
										>
											<img
												src={tgcIcon}
												className="rounded-full "
												style={{ width: "60px", height: "60px" }}
												alt="The Great Commission"
											/>
										</div>
									</div>
									<span className="text-sm">The Great Commission</span>
								</Link>
							</div>
						</div>
						<hr />
						<div className="sidebar-content">
							<ul className="flex flex-col w-full">
								{navigation.map((item) => {
									const current =
										matches.find((match) => match.pathname === item.href) !==
										undefined;
									return (
										<Link
											onClick={() => setSideNavOpen(false)}
											className={`flex flex-row items-center justify-between m-2 h-11 px-2 rounded-lg ${
												current
													? "bg-primary text-white rounded-md"
													: "bg-background text-foreground hover:bg-accent hover:text-accent-foreground rounded-md"
											}`}
											key={item.name}
											to={item.href}
										>
											<div className="flex flex-row items-center space-x-2">
												<div>{React.createElement(item.icon)}</div>
												<div>{item.name}</div>
											</div>
											{current ? (
												<ArrowLongRightIcon className="block h-6 w-6" />
											) : null}
										</Link>
									);
								})}
							</ul>
						</div>
						{isMobile && (
							<Button
								variant="outline"
								className="w-full mt-10 mb-4 mx-2"
								onClick={() => setSideNavOpen(!sideNavOpen)}
							>
								Close
							</Button>
						)}
					</motion.aside>
				)}
			</AnimatePresence>
		</div>
	);
}
