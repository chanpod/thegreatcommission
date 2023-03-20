import { Popover, Transition } from "@headlessui/react";
import { ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { ChurchOrganization, Missionary } from "@prisma/client";
import { Link, useFetcher, useNavigate, useNavigation } from "@remix-run/react";
import { AnimatePresence, motion } from "framer-motion";
import React, { Fragment, useEffect, useRef, useState } from "react";
import { useClickOutside } from "~/src/hooks/useClickOutside";
import useDebounce from "~/src/hooks/useDebounce";
import EmptyAvatar from "../emptyAvatar/EmptyAvatar";
import { Input } from "../forms/input/Input";
import Row from "../listItems/Row";
import RowItem from "../listItems/RowItem";
import ChurchOrganizationList from "./ChurchOrganizationList";
import MissionariesList from "./MissionariesList";

interface Props {
    setLoading?: (loading: boolean) => void;
    onSelected?: (selected: ChurchOrganization | Missionary) => void;
    loadChurches?: boolean | undefined;
    loadMissionaries?: boolean | undefined;
    loadMissions?: boolean | undefined;
    loadAll?: boolean | undefined;
    showHeaders?: boolean | undefined;
    inputStyle?: "normal" | "header";
    label?: string;
}

const SearchBar = (props: Props) => {
    const searchFetcher = useFetcher();
    const [openPopover, setOpenPopover] = useState(false);
    const [search, setSearch] = useState("");
    const [churches, setChurches] = useState<ChurchOrganization[]>([]);
    const [missionaries, setMissionaries] = useState<Missionary[]>([]);
    const ref = useRef();
    const outsideClicked = useClickOutside(ref);
    const shortDebounce = useDebounce({ value: search, debounceDelay: 500 });
    const navigate = useNavigate();
    const [selectedEntity, setSelectedEntity] = useState(undefined);

    const loading = searchFetcher.state != "idle";

    useEffect(() => {
        if (search.length > 1) {
            searchFetcher.load(`/api/search?search=${encodeURI(search)}`, {});
        }
    }, [shortDebounce]);

    useEffect(() => {
        if (outsideClicked) {
            setOpenPopover(false);
        }
    }, [outsideClicked]);

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

    function onSelected(selected: ChurchOrganization | Missionary) {
        setSelectedEntity(selected);
        if (props.onSelected) {
            setSearch(selected.firstName === undefined ? selected.name : `${selected.firstName} ${selected.lastName}`);
            props.onSelected(selected);
        } else {
            navigate(selected.firstName === undefined ? `/churches/${selected.id}` : `/missionaries/${selected.id}`);
        }

        closePopover();
    }

    const headerStyle = props.inputStyle === "header";
    return (
        <div ref={ref} className={`pt-1 pb-1 relative z-10 text-white text-sm rounded-lg w-11/12 block z-10`}>
            {headerStyle ? (
                <input
                    onFocus={() => setOpenPopover(true)}
                    type="text"
                    autoComplete="off"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    id="first_name"
                    style={{
                        "--tw-ring-shadow": "0 0 #000 !important",
                    }}
                    className="block rounded-md w-full p-2.5 bg-[#0a192f] border-gray-600 placeholder-gray-400 text-white border-none focus:border-none focus:border-ring-none  ml-1 mr-1 "
                    placeholder="Search..."
                />
            ) : (
                <Input
                    className="rounded-md focus:border-none focus:border-ring-none "
                    onFocus={() => setOpenPopover(true)}
                    label={props.label ? props.label : "Search"}                    
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            )}

            <AnimatePresence>
                {openPopover && (
                    <motion.div
                        style={
                            headerStyle
                                ? {
                                      top: "50px",
                                  }
                                : {
                                      top: "74px",
                                  }
                        }
                        className={`p-3 pt-1 absolute top-3 bg-[#172b4d] shadow-lg text-white text-sm rounded-lg w-11/12 block z-10 ${
                            openPopover ? "h-auto" : "h-12"
                        }`}
                        initial={{ height: 0 }}
                        animate={{ height: "auto", overflow: "hidden" }}
                        exit={{ height: 0, overflow: "hidden" }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className=" left-1/2 z-10 mt-3 w-screen max-w-sm px-4 sm:px-0 lg:max-w-3xl">
                            {props.loadMissionaries !== false && (
                                <div className="relative flex-col gap-8 p-7 lg:grid-cols-2 border-gray-200">
                                    {props.showHeaders !== false ? (
                                        <span className="text-2xl">Missionaries</span>
                                    ) : null}
                                    <MissionariesList onSelected={onSelected} missionaries={missionaries} />
                                </div>
                            )}

                            {props.loadChurches !== false && (
                                <div className="relative  flex-col gap-8 p-7 lg:grid-cols-2 border-gray-200">
                                    {props.showHeaders !== false ? (
                                        <span className="text-2xl">Organizations</span>
                                    ) : null}

                                    <ChurchOrganizationList churches={churches} onSelected={onSelected} />
                                </div>
                            )}

                            <button className="flex items-center" onClick={() => setOpenPopover(false)}>
                                <XMarkIcon className="w-4 h-4" />
                                Close
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SearchBar;
