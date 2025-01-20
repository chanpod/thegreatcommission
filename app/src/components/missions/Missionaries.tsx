import { Card } from "~/components/ui/card";
import List from "../listItems/List";
import MissionaryListItem from "./MissionaryListItem";


const MissionMissionaries = ({ mission }: { mission: typeof missions }) => {
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
                    {mission?.missionaries?.map((missionary: typeof missionaries) => (
                        <MissionaryListItem  key={missionary.id} missionary={missionary} />
                    ))}
                </List>
            </>
        </Card>
    );
};

export default MissionMissionaries;
