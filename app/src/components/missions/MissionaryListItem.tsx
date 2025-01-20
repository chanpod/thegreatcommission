import { Link, useFetcher } from "react-router";
import EmptyAvatar from "../avatar/EmptyAvatar";
import Row from "../listItems/Row";
import RowItem, { primaryText, secondaryText } from "../listItems/RowItem";
import type { missionaries } from "server/db/schema";
import { Trash as TrashIcon } from "lucide-react";
import { Button } from "~/components/ui/button";

const MissionaryListItem = ({ missionary, editing }: { missionary: typeof missionaries; editing?: boolean }) => {
    const deleteFetcher = useFetcher();

    function deleteMissionary(missionary: typeof missionaries) {
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
