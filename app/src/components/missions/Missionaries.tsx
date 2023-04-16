import { Missionary, Missions } from "@prisma/client";
import { Card } from "flowbite-react";
import List from "../listItems/List";
import MissionaryListItem from "./MissionaryListItem";


const MissionMissionaries = ({ mission }: { mission: Missions }) => {
    return (
        <Card>
            <>
                <div className="flex justify-between">
                    <h1 className="text-2xl">Missionaries</h1>
                    <div className="text-sm text-gray-500 items-center flex">
                        Volunteers Needed: {mission?.volunteersNeeded}
                    </div>
                </div>
                {mission?.missionaries?.length === 0 && (
                    <div className="text-center text-gray-500">No Missionaries</div>
                )}
                <List>
                    {mission?.missionaries?.map((missionary: Missionary) => (
                        <MissionaryListItem  key={missionary.id} missionary={missionary} />
                    ))}
                </List>
            </>
        </Card>
    );
};

export default MissionMissionaries;
