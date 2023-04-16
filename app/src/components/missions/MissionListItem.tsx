import { Link, useFetcher } from "@remix-run/react";
import React from "react";
import missionary from "~/routes/missions/$mission/missionary";
import EmptyAvatar from "../avatar/EmptyAvatar";
import Row from "../listItems/Row";
import RowItem, { primaryText, secondaryText } from "../listItems/RowItem";
import { Missionary } from "@prisma/client";
import { Button } from "flowbite-react";
import { TrashIcon } from "@heroicons/react/24/outline";

const MissionaryListItem = ({ missionary, editing }: { missionary: Missionary; editing?: boolean }) => {
    const deleteFetcher = useFetcher();

    function deleteMissionary(missionary: Missionary) {
        deleteFetcher.submit(
            {
                linkId: missionary.id,
            },
            { method: "delete", action: `/missions/${missionary?.id}/missionary` }
        );
    }

    return (
        <Row>
            <Link to={`/missionaries/${missionary.id}`}>
                <RowItem>
                    <div className="flex-shrink-0">
                        <EmptyAvatar />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={primaryText}>
                            {missionary.firstName} {missionary.lastName}
                        </p>
                        <p className={secondaryText}>{missionary.email}</p>
                    </div>
                    {editing && (
                        <div>
                            <Button
                                onClick={(event) => {
                                    event.preventDefault();
                                    deleteMissionary(missionary);
                                }}
                                className="bg-red-800"
                                pill
                            >
                                <TrashIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </RowItem>
            </Link>
        </Row>
    );
};

export default MissionaryListItem;
