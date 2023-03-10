import { Link, useMatches } from "@remix-run/react";
import { navigation } from "../header/Header";
import { ArrowLongRightIcon, BuildingLibraryIcon } from "@heroicons/react/24/outline";
export function Sidenav() {
    const matches = useMatches();
    return (
        <div className="flex-col fixed h-screen w-full relative ">
            <div className="flex bg-gray-900 h-32 divide-y items-center justify-center">
                <Link to="/" className="text-white">
                    <BuildingLibraryIcon className="block h-20 w-20 " />
                    <span className="text-sm ">The Great Commission</span>
                </Link>
            </div>

            <div className="flex bg-gray-800 h-full flex-col ">
                {navigation.map((item) => {
                    const current = matches.find((match) => match.pathname === item.href) != undefined;
                    return (
                        <Link
                            className={`text-lg flex items-center text-gray-200 text-center p-3 m-2 ${
                                current ? "bg-gray-900 text-white justify-items-between rounded-md" : ""
                            }`}
                            style={
                                current
                                    ? {
                                          justifyContent: "space-between",
                                      }
                                    : null
                            }
                            key={item.name}
                            to={item.href}
                        >
                            {item.name}
                            {current ? <ArrowLongRightIcon className="block h-6 w-6" /> : null}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
