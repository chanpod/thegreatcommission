import {XIcon as XMarkIcon} from "lucide-react";
import { useFetcher, useNavigate } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { useClickOutside } from "~/src/hooks/useClickOutside";
import useDebounce from "~/src/hooks/useDebounce";
import { Input } from "../forms/input/Input";
import ChurchOrganizationList from "./ChurchOrganizationList";
import MissionariesList from "./MissionariesList";
import MissionsList from "./MissionsList";
import type { churchOrganization, missionaries, missions } from "server/db/schema";
export enum SearchEntityType {
    ChurchOrganization = "ChurchOrganization",
    Missionary = "Missionary",
    Mission = "Mission",
}

export type ISearchEntityTypes = typeof churchOrganization | typeof missionaries | typeof missions;

function NoResults() {
    return <div className="text-sm text-gray-300"> - No Results</div>;
}

interface Props {
    setLoading?: (loading: boolean) => void;
    onSelected?: (selected: ISearchEntityTypes) => void;
    loadChurches?: boolean | undefined;
    loadMissionaries?: boolean | undefined;
    loadMissions?: boolean | undefined;
    loadAll?: boolean | undefined;
    showHeaders?: boolean | undefined;
    inputStyle?: "normal" | "header";
    label?: string;
    initialValue?: string;
}

const SearchBar = (props: Props) => {
    const searchFetcher = useFetcher();
    const [openPopover, setOpenPopover] = useState(false);
    const [search, setSearch] = useState(props.initialValue ?? "");
    const [churches, setChurches] = useState<typeof churchOrganization[]>([]);
    const [missionaries, setMissionaries] = useState<typeof missionaries[]>([]);
    const [missions, setMissions] = useState<typeof missions[]>([]);
    const ref = useRef();
    const outsideClicked = useClickOutside(ref);
    const shortDebounce = useDebounce({ value: search, debounceDelay: 500 });
    const navigate = useNavigate();
    const [selectedEntity, setSelectedEntity] = useState<ISearchEntityTypes | undefined>(undefined);

    const loading = searchFetcher.state != "idle";
    const headerStyle = props.inputStyle === "header";

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
        if (searchFetcher.data) {
            handleSearchFinished(
                setChurches,
                searchFetcher.data?.churches,
                (props.loadChurches || props.loadAll) ?? true
            );
            handleSearchFinished(
                setMissionaries,
                searchFetcher.data?.missionary,
                (props.loadMissionaries || props.loadAll) ?? true
            );
            handleSearchFinished(
                setMissions,
                searchFetcher.data?.missions,
                (props.loadMissions || props.loadAll) ?? true
            );
        }
    }, [searchFetcher.data]);

    function handleSearchFinished(setValue: React.Dispatch<React.SetStateAction<any>>, data: any, shouldLoad: boolean) {
        if (data && shouldLoad) {
            if (data.length === 1 && props.onSelected) {
                onSelected(data[0]);
            }
            setValue(data);
        }
    }

    function closePopover() {
        setOpenPopover(false);
    }

    function getEntityRoute(entityType: SearchEntityType) {
        switch (entityType) {
            case SearchEntityType.ChurchOrganization:
                return `/churches/`;
            case SearchEntityType.Missionary:
                return `/missionaries/`;
            case SearchEntityType.Mission:
                return "/missions/";
            default:
                return "";
        }
    }

    function onSelected(selected: ISearchEntityTypes, entityType: SearchEntityType) {
        setSelectedEntity(selected);
        if (props.onSelected) {
            switch (entityType) {
                case SearchEntityType.ChurchOrganization:
                    setSearch((selected as typeof churchOrganization).name);
                    break;
                case SearchEntityType.Missionary:
                    setSearch((selected as typeof missionaries).firstName + " " + (selected as typeof missionaries).lastName);
                    break;
                case SearchEntityType.Mission:
                    setSearch((selected as typeof missions).title);
                default:
                    break;
            }

            props.onSelected(selected);
        } else {
            navigate(`${getEntityRoute(entityType) + selected.id}`);
        }

        closePopover();
    }

    return (
        <div ref={ref} className={`pt-1 pb-1 relative z-20 text-white text-sm rounded-lg w-11/12 block`}>
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
                                      minWidth: "350px",
                                  }
                                : {
                                      top: "74px",
                                      minWidth: "350px",
                                  }
                        }
                        className={`p-3 pt-1 absolute top-3 bg-[#172b4d] shadow-lg text-white -left-20 lg:left-0 text-sm rounded-lg w-11/12 block z-30 ${
                            openPopover ? "h-auto" : "h-12"
                        }`}
                        initial={{ height: 0 }}
                        animate={{ height: "auto", overflow: "hidden" }}
                        exit={{ height: 0, overflow: "hidden" }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="z-10 mt-3 w-screen max-w-sm space-y-7 px-4 sm:px-0 lg:max-w-3xl">
                            {props.loadMissionaries !== false && (
                                <div className="relative flex-col gap-8 lg:grid-cols-2 border-gray-200">
                                    {props.showHeaders !== false ? (
                                        <span className="lg:text-lg flex items-center">
                                            Missionaries{" "}
                                            {missionaries.length === 0 && search.length >= 2 && <NoResults />}
                                        </span>
                                    ) : null}
                                    <MissionariesList onSelected={onSelected} missionaries={missionaries} />
                                </div>
                            )}

                            {props.loadMissions !== false && (
                                <div className="relative flex-col gap-8 lg:grid-cols-2 border-gray-200">
                                    {props.showHeaders !== false ? (
                                        <span className="lg:text-lg flex items-center">
                                            Missions {missions.length === 0 && search.length >= 2 && <NoResults />}
                                        </span>
                                    ) : null}
                                    <MissionsList onSelected={onSelected} missions={missions} />
                                </div>
                            )}

                            {props.loadChurches !== false && (
                                <div className="relative  flex-col gap-8  lg:grid-cols-2 border-gray-200">
                                    {props.showHeaders !== false ? (
                                        <span className="lg:text-lg flex items-center">
                                            Organizations {churches.length === 0 && search.length >= 2 && <NoResults />}
                                        </span>
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
