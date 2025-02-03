import { Card, CardContent, CardHeader } from "~/components/ui/card";
import List from "../listItems/List";
import MissionaryListItem from "./MissionaryListItem";
import type { events } from "@/server/db/schema";


const MissionMissionaries = ({ mission }: { mission: typeof events.$inferSelect }) => {
    return (
        <Card>
            <CardContent>

                <CardHeader>
                    <div className="flex justify-between">
                        <h1 className="text-2xl">Missionaries</h1>
                        <div className="text-sm text-gray-500 items-center flex">

                            Volunteers Needed: {mission?.volunteersNeeded}
                        </div>
                    </div>
                </CardHeader>
                {mission?.missionaries?.length === 0 && (
                    <div className="text-center text-gray-500">No Missionaries</div>
                )}


                <List>
                    {mission?.missionaries?.map((missionary: typeof missionaries) => (
                        <MissionaryListItem key={missionary.id} missionary={missionary} />
                    ))}
                </List>
            </CardContent>
        </Card>
    );
};

export default MissionMissionaries;
