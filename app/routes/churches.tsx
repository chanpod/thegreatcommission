import {
	Outlet,
	useLocation,
	Link,
	useNavigate,
	useSearchParams,
} from "react-router";
import { useState, useEffect } from "react";
import { cn } from "~/lib/utils";
import { Bell, Plus, Search } from "lucide-react";
import { Button } from "~/components/ui/button";
import stylesheet from "~/components/messaging/styles.css?url";
import { Input } from "~/components/ui/input";
import useIsLoggedIn from "~/src/hooks/useIsLoggedIn";
import { SearchEntityType } from "~/src/components/header/SearchBar";

export const links = () => [{ rel: "stylesheet", href: stylesheet }];

const NAV_ITEMS = [
	{ name: "All Organizations", href: "" },
	{ name: "My Organizations", href: "mine" },
];

const Churches = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const currentPath = location.pathname.split("/").pop() || "";
	const { isLoggedIn } = useIsLoggedIn();

	return (
		<div className="min-h-screen bg-gray-100">
			{/* Header */}
			<header className="bg-white shadow">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
					<div className="flex items-center">
						<h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
					</div>
					<div className="flex items-center space-x-4">
						<Input
							type="text"
							placeholder="Search organizations..."
							className="pl-10 h-9"
							defaultValue={searchParams.get("search") || ""}
							onChange={(e) => {
								const currentParams = new URLSearchParams(location.search);
								currentParams.set("search", e.target.value);
								setSearchParams(currentParams);
							}}
						/>
						<Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

						{isLoggedIn && (
							<Link to="/getting-started">
								<Button className="flex items-center gap-1">
									<Plus className="h-4 w-4" />
									<span>Create</span>
								</Button>
							</Link>
						)}
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4">
				{/* Navigation */}
				<nav className="mb-6">
					<div className="sm:hidden">
						<select
							className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
							value={currentPath}
							onChange={(e) => {
								const path = `/churches/${e.target.value}`;
								// Preserve search params when changing tabs
								if (searchParams.has("search")) {
									navigate(
										`${path}?search=${searchParams.get("search")}&type=${SearchEntityType.ChurchOrganization}`,
									);
								} else {
									navigate(path);
								}
							}}
						>
							{NAV_ITEMS.map((item) => (
								<option key={item.href} value={item.href}>
									{item.name}
								</option>
							))}
						</select>
					</div>
					<div className="hidden sm:block">
						<div className="border-b border-gray-200">
							<nav className="-mb-px flex space-x-8" aria-label="Tabs">
								{NAV_ITEMS.map((item) => {
									const isActive = currentPath === item.href;
									// Create path with preserved search params
									let linkPath = `/churches/${item.href}`;
									if (searchParams.has("search")) {
										linkPath += `?search=${searchParams.get("search") || ""}&type=${SearchEntityType.ChurchOrganization}`;
									}

									return (
										<Link
											key={item.href}
											to={linkPath}
											className={cn(
												"whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm",
												isActive
													? "border-indigo-500 text-indigo-600"
													: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
											)}
										>
											{item.name}
										</Link>
									);
								})}
							</nav>
						</div>
					</div>
				</nav>

				{/* Content Area */}
				<div
					className="bg-white shadow overflow-hidden rounded-lg"
					style={{
						borderRadius: "1rem",
					}}
				>
					<Outlet />
				</div>
			</main>
		</div>
	);
};

export default Churches;
