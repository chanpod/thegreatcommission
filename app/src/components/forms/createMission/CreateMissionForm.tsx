import { addDays } from "date-fns";
import { use, useContext, useState } from "react";
import { InfoIcon as InfoCircledIcon } from "lucide-react";

import SearchBar from "../../header/SearchBar";
import WorldMap from "../../maps/WorldMap";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Textarea } from "~/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "~/components/ui/tooltip";

import { DatePicker } from "../../datepicker/DatePicker";
import { Stack } from "../../layout/Stack";
import { ApplicationContext } from "~/src/providers/appContextProvider";
import { missions } from "@/server/db/schema";
import type { missions as missionsType } from "@/server/db/schema";
import type { churchOrganization } from "@/server/db/schema";

export interface IMissionForm extends missionsType {
    churchOrganization: typeof churchOrganization.$inferSelect;
}


interface Props {
    initialValues?: IMissionForm | null;
    readOnly?: boolean;
}

const CreateMissionForm = (props: Props) => {
    const beginDate = props.initialValues?.beginDate ? new Date(props.initialValues?.beginDate) : new Date();
    const endDate = props.initialValues?.endDate ? new Date(props.initialValues?.endDate) : new Date();
    const [startDate, setStartDate] = useState<Date | undefined>(beginDate);
    const [endDateForm, setEndDate] = useState<Date | undefined>(endDate);
    const [selectedOrg, setSelectedOrg] = useState<typeof churchOrganization | undefined>();
    const [showLocationSelect, setShowLocationSelect] = useState(false);
    const { env } = use(ApplicationContext);
    const [selectedCoordinates, setSelectedCoordinates] = useState({
        lat: props.initialValues?.lat ?? 0,
        lng: props.initialValues?.lng ?? 0,
    });

    const startDateChanged = (newValue: Date) => {
        console.log("newValue:", newValue);
        setStartDate(newValue);
    };

    const endDateChanged = (newValue: Date) => {
        console.log("newValue:", newValue);
        setEndDate(newValue);
    };

    function onChurchSelection(selected: typeof churchOrganization) {
        console.log(selected);
        setSelectedOrg(selected as typeof churchOrganization);
    }


    return (
        <Stack>
            <div>
                <Label>Mission Event Type</Label>
                <Select>
                    <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">Community</SelectItem>
                        <SelectItem value="2">Domestic</SelectItem>
                        <SelectItem value="3">International</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Title</Label>
                <Input
                    defaultValue={props.initialValues?.title}
                    disabled={props.readOnly ?? false}
                    name="title"
                />
            </div>

            <div className="flex flex-col xl:flex-row space-x-2">
                <div className="space-y-2">
                    <Label>Volunteers Needed</Label>
                    <Input
                        defaultValue={props.initialValues?.volunteersNeeded}
                        disabled={props.readOnly ?? false}
                        type="number"
                        name="volunteersNeeded"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Funding Raised</Label>
                    <Input
                        defaultValue={props.initialValues?.fundingRaised?.toString()}
                        disabled={props.readOnly ?? false}
                        type="text"
                        name="fundingRaised"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Invested</Label>
                    <Input
                        defaultValue={props.initialValues?.investment?.toString()}
                        disabled={props.readOnly ?? false}
                        type="text"
                        name="investment"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Location</Label>
                <Input
                    onFocus={() => setShowLocationSelect(true)}
                    defaultValue={`${props.initialValues?.lat} - ${props.initialValues?.lng}`}
                    disabled={props.readOnly ?? false}
                    value={`${selectedCoordinates?.lat} - ${selectedCoordinates?.lng}`}
                    name="location"
                />
            </div>
            <input type="hidden" name="lat" value={selectedCoordinates?.lat} />
            <input type="hidden" name="lng" value={selectedCoordinates?.lng} />

            <div className="flex items-center gap-2">
                <Checkbox
                    id="sensitive"
                    defaultChecked={props.initialValues?.sensitive}
                    name="sensitive"
                />
                <Label htmlFor="sensitive">Sensitive</Label>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <InfoCircledIcon className="w-5 h-5" />
                        </TooltipTrigger>
                        <TooltipContent>
                            Select this if you do not wish to expose information about missionaries or location to anyone not a member of the organization
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <SearchBar
                label="Associated Org"
                initialValue={props.initialValues?.churchOrganization?.name}
                showHeaders={false}
                loadMissionaries={false}
                onSelected={onChurchSelection}
            />
            <input type="hidden" name="churchOrganizationId" value={selectedOrg?.id} />

            <div className="flex flex-col xl:flex-row space-x-2">
                <div className="flex-col">
                    <Label>Start Date</Label>
                    <DatePicker
                        disabled={props.readOnly ?? false}
                        useRange={false}
                        name="beginDate"
                        date={startDate}
                        onChange={startDateChanged}
                    />
                    <input
                        type="hidden"
                        defaultValue={beginDate}
                        name="beginDate"
                        value={startDate}
                    />
                </div>
                <div className="flex-col">
                    <Label>End Date</Label>
                    <DatePicker
                        disabled={props.readOnly ?? false}
                        useRange={false}
                        name="endDate"
                        date={endDateForm}
                        onChange={endDateChanged}
                    />
                    <input
                        type="hidden"
                        defaultValue={endDateForm}
                        name="endDate"
                        value={endDateForm}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                    disabled={props.readOnly ?? false}
                    defaultValue={props.initialValues?.description}
                    name="description"
                    required
                    rows={4}
                />
            </div>

            <Dialog open={showLocationSelect} onOpenChange={setShowLocationSelect}>
                <DialogContent className="max-w-7xl">
                    <DialogHeader>
                        <DialogTitle>Select Location</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                        <WorldMap coordinatesChanged={(coordinates) => setSelectedCoordinates(coordinates)} googleMapsApiKey={env.mapsApiZ} />
                        <p>Lat: {selectedCoordinates.lat} Lng: {selectedCoordinates.lng}</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowLocationSelect(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => setShowLocationSelect(false)}>
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Stack>
    );
};

export default CreateMissionForm;
