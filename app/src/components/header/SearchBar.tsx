import { Popover, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { ChurchOrganization, Missionary } from "@prisma/client";
import { Link, useFetcher, useNavigation } from "@remix-run/react";
import { AnimatePresence, motion } from "framer-motion";
import React, { Fragment, useEffect, useState } from "react";
import EmptyAvatar from "../emptyAvatar/EmptyAvatar";
import Row from "../listItems/Row";
import RowItem from "../listItems/RowItem";

interface Props {
    setLoading?: (loading: boolean) => void;
}

const SearchBar = (props: Props) => {
    const searchFetcher = useFetcher();
    const [openPopover, setOpenPopover] = useState(false);
    const [search, setSearch] = useState("");
    const [churches, setChurches] = useState<ChurchOrganization[]>([]);
    const [missionaries, setMissionaries] = useState<Missionary[]>([]);

    const transition = useNavigation();
    const loading = searchFetcher.state != "idle";

    useEffect(() => {
        if (search.length > 1) {
            searchFetcher.load(`/api/search?search=${encodeURI(search)}`, {});
        }
    }, [search]);

    useEffect(() => {
        if (props.setLoading) {
            props.setLoading(loading);
        }
    }, [loading]);

    useEffect(() => {
        console.log(searchFetcher.data);
        if (searchFetcher.data?.churches) {
            setChurches(searchFetcher.data.churches);
        }

        if (searchFetcher.data?.missionary) {
            setMissionaries(searchFetcher.data.missionary);
        }
    }, [searchFetcher.data]);

    function closePopover() {
        setOpenPopover(false);
    }

    return (
        <div className={`pt-1 pb-1 bg-gray-900 text-white text-sm rounded-lg w-11/12 block z-10`}>
            <input
                onFocus={() => setOpenPopover(true)}
                type="text"
                autoComplete="off"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                id="first_name"
                className="block w-full p-2.5 dark:bg-gray-900 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white "
                placeholder="Search..."
            />

            <AnimatePresence>
                {openPopover && (
                    <motion.div
                        style={{
                            top: "50px",
                        }}
                        className={`p-3 pt-1 absolute top-3 bg-gray-900 text-white text-sm rounded-lg w-11/12 block z-10 ${
                            openPopover ? "h-auto" : "h-12"
                        }`}
                        initial={{ height: 0 }}
                        animate={{ height: "auto", overflow: "hidden" }}
                        exit={{ height: 0, overflow: "hidden" }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className=" left-1/2 z-10 mt-3 w-screen max-w-sm px-4 sm:px-0 lg:max-w-3xl">
                            <div className="relative flex-col gap-8 p-7 lg:grid-cols-2">
                                <span className="text-2xl">Missionaries - {loading ? "true" : "false"}</span>
                                <ul className="max-w-md divide-y flex-col divide-gray-200 dark:divide-gray-700">
                                    {missionaries?.map((missionary: Missionary) => {
                                        return (
                                            <Link
                                                key={missionary.id}
                                                to={`/missionaries/${missionary.id}`}
                                                onClick={closePopover}
                                            >
                                                <Row>
                                                    <RowItem>
                                                        <div className="flex-shrink-0">
                                                            <EmptyAvatar />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium  truncate">
                                                                {missionary.firstName}, {missionary.lastName}
                                                            </p>
                                                            <p className="text-sm  truncate ">
                                                                {missionary.city} {missionary.city ? "," : null}{" "}
                                                                {missionary.state}
                                                            </p>
                                                        </div>
                                                    </RowItem>
                                                </Row>
                                            </Link>
                                        );
                                    })}
                                </ul>

                                <ul className="max-w-md divide-y  divide-gray-200 dark:divide-gray-700">
                                    <span className="text-2xl">Churches</span>
                                    {churches?.map((church: ChurchOrganization) => {
                                        return (
                                            <Link key={church.id} to={`/churches/${church.id}`} onClick={closePopover}>
                                                <Row>
                                                    <RowItem>
                                                        <div className="flex-shrink-0">
                                                            <EmptyAvatar />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">
                                                                {church.name}
                                                            </p>
                                                            <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                                                                {church.city}, {church.state}
                                                            </p>
                                                        </div>
                                                        <div className="inline-flex items-center text-base font-semibold ">
                                                            {church.zip}
                                                        </div>
                                                    </RowItem>
                                                </Row>
                                            </Link>
                                        );
                                    })}
                                </ul>
                            </div>

                            <button onClick={() => setOpenPopover(false)}>Close</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SearchBar;
