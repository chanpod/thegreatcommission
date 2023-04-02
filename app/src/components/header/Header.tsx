import { Disclosure, Menu, Transition } from "@headlessui/react";
import { Bars3Icon, PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Link, useMatches, useNavigation } from "@remix-run/react";
import { Fragment, useState } from "react";
import { TailSpin } from "react-loader-spinner";
import tgcIcon from "~/src/assets/images/tgcIcon.png";
import { classNames } from "~/src/helpers";
import useIsLoggedIn from "~/src/hooks/useIsLoggedIn";
import SearchBar from "./SearchBar";
export const navigation = [
    { name: "Churches", href: "/churches", current: true },
    { name: "Missionaries", href: "/missionaries", current: false },
    { name: "Missions", href: "/missions", current: false },
];



export default function Header() {
    const matches = useMatches();
    const transition = useNavigation();
    const loading = transition.state != "idle";
    const [searchLoading, setSearchLoading] = useState(false);
    const { isLoggedIn, user } = useIsLoggedIn();
    console.log("User from header", user);
    return (
        <Disclosure as="nav" className="bg-white">
            {({ open }) => (
                <>
                    <div className="mx-auto px-2 sm:px-6 lg:px-8">
                        <div className="relative flex h-16 items-center justify-between">
                            
                            <div
                                style={{ width: "60px" }}
                                className="flex flex-none flex-1 items-center justify-center sm:items-stretch sm:justify-start"
                            >
                                <div>
                                    {loading || searchLoading ? (
                                        <TailSpin height={40} width={40} />
                                    ) : (
                                        <Link to="/">
                                            <img src={tgcIcon} />
                                        </Link>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-1 items-start align-items-start sm:items-stretch sm:justify-start relative">
                                <SearchBar inputStyle="header" setLoading={(loading) => setSearchLoading(loading)} />
                            </div>
                            <div className="inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                                {/* <button
                                    type="button"
                                    className="rounded-full bg-[#0a192f] p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                                >
                                    <span className="sr-only">View notifications</span>
                                    <BellIcon className="h-6 w-6" aria-hidden="true" />
                                </button> */}

                                {/* Profile dropdown */}
                                <Menu as="div" className="relative ml-3">
                                    <div className="">
                                        <Menu.Button className="flex items-center">
                                            <span className="sr-only">Open user menu</span>
                                            <PhotoIcon className="h-8 w-8 mr-1 p-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 rounded-full bg-[#0a192f]" />
                                            {user?.firstName}
                                        </Menu.Button>
                                    </div>
                                    <Transition
                                        as={Fragment}
                                        enter="transition ease-out duration-100"
                                        enterFrom="transform opacity-0 scale-95"
                                        enterTo="transform opacity-100 scale-100"
                                        leave="transition ease-in duration-75"
                                        leaveFrom="transform opacity-100 scale-100"
                                        leaveTo="transform opacity-0 scale-95"
                                    >
                                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                            {isLoggedIn ? (
                                                <>
                                                    <Menu.Item>
                                                        {({ active }) => (
                                                            <Link
                                                                to="/user/profile"
                                                                className={classNames(
                                                                    active ? "bg-gray-100" : "",
                                                                    "block px-4 py-2 text-sm text-gray-700"
                                                                )}
                                                            >
                                                                Your Profile
                                                            </Link>
                                                        )}
                                                    </Menu.Item>
                                                    <Menu.Item>
                                                        {({ active }) => (
                                                            <Link
                                                                to="/logout"
                                                                className={classNames(
                                                                    active ? "bg-gray-100" : "",
                                                                    "block px-4 py-2 text-sm text-gray-700"
                                                                )}
                                                            >
                                                                Logout
                                                            </Link>
                                                        )}
                                                    </Menu.Item>
                                                </>
                                            ) : (
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <Link
                                                            to="/login/google"
                                                            className={classNames(
                                                                active ? "bg-gray-100" : "",
                                                                "block px-4 py-2 text-sm text-gray-700"
                                                            )}
                                                        >
                                                            Login
                                                        </Link>
                                                    )}
                                                </Menu.Item>
                                            )}
                                        </Menu.Items>
                                    </Transition>
                                </Menu>
                            </div>
                        </div>
                    </div>

                    <Disclosure.Panel className="sm:hidden">
                        <div className="space-y-1 px-2 pt-2 pb-3">
                            {navigation.map((item) => {
                                const current = matches.find((match) => match.pathname === item.href) != undefined;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={classNames(
                                            current
                                                ? "bg-gray-900 text-white"
                                                : "text-gray-300 hover:bg-gray-700 hover:text-white",
                                            "block rounded-md px-3 py-2 text-base font-medium"
                                        )}
                                        aria-current={current ? "page" : undefined}
                                    >
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </Disclosure.Panel>
                </>
            )}
        </Disclosure>
    );
}
