import { ChurchOrganization, Missionary, Missions } from "@prisma/client";
import { addDays, format, subDays } from "date-fns";
import { Button, Checkbox, Label, Modal, Select, Textarea, Tooltip } from "flowbite-react";
import { useState } from "react";
import Datepicker from "react-tailwindcss-datepicker";
import { DateValueType } from "react-tailwindcss-datepicker/dist/types";
import { ClientOnly } from "remix-utils";
import SearchBar from "../../header/SearchBar";
import WorldMap from "../../maps/WorldMap";
import { Input } from "../input/Input";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

export interface IMissionForm extends Missions {
    ChurchOrganization: ChurchOrganization;
}

interface Props {
    initialValues?: IMissionForm | null;
    readOnly?: boolean;
}

const CreateMissionForm = (props: Props) => {
    const beginDate = props.initialValues?.beginDate ? new Date(props.initialValues?.beginDate) : new Date();
    const endDate = props.initialValues?.endDate ? new Date(props.initialValues?.endDate) : new Date();
    const [startDate, setStartDate] = useState<DateValueType | undefined>({
        startDate: beginDate,
        endDate: addDays(new Date(), 2),
    });
    const [endDateForm, setEndDate] = useState<DateValueType | undefined>({
        startDate: endDate,
        endDate: addDays(endDate, 2),
    });
    const [selectedOrg, setSelectedOrg] = useState<ChurchOrganization | undefined>();
    const [showLocationSelect, setShowLocationSelect] = useState(false);
    const [selectedCoordinates, setSelectedCoordinates] = useState({
        lat: props.initialValues?.location?.lat ?? 0,
        lng: props.initialValues?.location?.lng ?? 0,
    });

    const startDateChanged = (newValue: DateValueType) => {
        console.log("newValue:", newValue);
        setStartDate(newValue);
    };

    const endDateChanged = (newValue: DateValueType) => {
        console.log("newValue:", newValue);
        setEndDate(newValue);
    };

    function onChurchSelection(selected: ChurchOrganization | Missionary) {
        console.log(selected);
        setSelectedOrg(selected as ChurchOrganization);
    }

    return (
        <div className="space-y-3">
            <div>
                <div className="mb-2 block">
                    <Label htmlFor="countries" value="Mission Event Type" />
                </div>
                <Select>
                    <option value="1">Community</option>
                    <option value="2">Domestic</option>
                    <option value="3">International</option>
                </Select>
            </div>

            <Input
                defaultValue={props.initialValues?.title}
                disabled={props.readOnly ?? false}
                label="Title"
                name="title"
            />

            <div className="flex flex-col xl:flex-row space-x-2">
                <Input
                    defaultValue={props.initialValues?.volunteersNeeded}
                    disabled={props.readOnly ?? false}
                    label="Volunteers Needed"
                    type="number"
                    name="volunteersNeeded"
                />
                <Input
                    defaultValue={props.initialValues?.fundingRaised?.toString()}
                    disabled={props.readOnly ?? false}
                    label="Funding Raised"
                    type="text"
                    name="fundingRaised"
                />
                <Input
                    defaultValue={props.initialValues?.investment?.toString()}
                    disabled={props.readOnly ?? false}
                    label="Invested"
                    type="text"
                    name="investment"
                />
            </div>

            <Input
                onFocus={(e) => {
                    setShowLocationSelect(true);
                }}
                defaultValue={`${props.initialValues?.location?.lat} - ${props.initialValues?.location?.lng}`}
                disabled={props.readOnly ?? false}
                label="Location"
                value={`${selectedCoordinates?.lat} - ${selectedCoordinates?.lng}`}
                name="location"
            />
            <input style={{ display: "none" }} name="lat" value={selectedCoordinates?.lat} />
            <input style={{ display: "none" }} name="lng" value={selectedCoordinates?.lng} />

            <div className="flex items-center gap-2">
                <Checkbox id="accept" defaultChecked={true} />
                <Label htmlFor="accept">Sensitive</Label>
                <Tooltip
                    content="Select this if you do not wish to expose information about missionaries or location to anyone not a member of the organization"
                    style="light"
                >
                    <InformationCircleIcon className="w-5 h-5" />
                </Tooltip>
            </div>

            <SearchBar
                label="Associated Org"
                initialValue={props.initialValues?.ChurchOrganization?.name}
                showHeaders={false}
                loadMissionaries={false}
                onSelected={onChurchSelection}
            />
            <input style={{ display: "none" }} name="churchOrganizationId" value={selectedOrg?.id} />

            <div className="flex flex-col xl:flex-row space-x-2">
                <div className="flex-col">
                    <div className="mb-2 block">
                        <Label htmlFor="title" value={"Start Date"} />
                    </div>
                    <Datepicker
                        disabled={props.readOnly ?? false}
                        useRange={false}
                        name="beginDate"
                        asSingle={true}
                        value={startDate}
                        onChange={startDateChanged}
                    />
                    <Input
                        style={{ display: "none" }}
                        defaultValue={beginDate.toISOString()}
                        name="beginDate"
                        value={startDate?.startDate}
                    />
                </div>
                <div className="flex-col">
                    <>
                        <div className="mb-2 block">
                            <Label htmlFor="title" value={"End Date"} />
                        </div>
                        <Datepicker
                            disabled={props.readOnly ?? false}
                            useRange={false}
                            name="endDate"
                            asSingle={true}
                            value={endDateForm}
                            onChange={endDateChanged}
                        />
                    </>

                    <input style={{ display: "none" }} name="endDate" value={endDateForm?.startDate} />
                </div>
            </div>
            <div id="textarea">
                <div className="mb-2 block">
                    <Label htmlFor="comment" value="Description" />
                </div>
                <Textarea
                    disabled={props.readOnly ?? false}
                    defaultValue={props.initialValues?.description}
                    name="description"
                    id="comment"
                    required={true}
                    rows={4}
                />
            </div>
            <ClientOnly>
                {() => (
                    <Modal size="7xl" show={showLocationSelect} onClose={() => setShowLocationSelect(false)}>
                        <Modal.Header>Terms of Service</Modal.Header>
                        <Modal.Body>
                            <div className="space-y-6">
                                <WorldMap coordinatesChanged={(coordinates) => setSelectedCoordinates(coordinates)} />
                                Lat: {selectedCoordinates.lat} Lng: {selectedCoordinates.lng}
                            </div>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button onClick={() => setShowLocationSelect(false)}>I accept</Button>
                            <Button color="gray" onClick={() => setShowLocationSelect(false)}>
                                Decline
                            </Button>
                        </Modal.Footer>
                    </Modal>
                )}
            </ClientOnly>
        </div>
    );
};

export default CreateMissionForm;
