import { ChurchOrganization, Missionary, Missions } from "@prisma/client";
import { format } from "date-fns";
import { Label, Textarea } from "flowbite-react";
import { useState } from "react";
import Datepicker from "react-tailwindcss-datepicker";
import { DateValueType } from "react-tailwindcss-datepicker/dist/types";
import SearchBar from "../../header/SearchBar";
import { Input } from "../input/Input";

export interface IMissionForm extends Missions {
    ChurchOrganization: ChurchOrganization;
}

interface Props {
    initialValues?: IMissionForm | null;
    readOnly?: boolean;
}

const CreateMissionForm = (props: Props) => {
    const [startDate, setStartDate] = useState<DateValueType | undefined>({
        startDate: props.initialValues?.beginDate ? format(new Date(props.initialValues?.beginDate), "yyyy-mm-dd") : new Date(),
        endDate: null,
    });
    const [endDate, setEndDate] = useState<DateValueType | undefined>();
    const [selectedOrg, setSelectedOrg] = useState<ChurchOrganization | undefined>();

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
            <Input
                defaultValue={props.initialValues?.title}
                disabled={props.readOnly ?? false}
                label="Title"
                name="title"
            />

            <SearchBar
                label="Associated Org"
                initialValue={props.initialValues?.ChurchOrganization?.name}
                showHeaders={false}
                loadMissionaries={false}
                onSelected={onChurchSelection}
            />
            <input style={{ display: "none" }} name="churchOrganizationId" value={selectedOrg?.id} />

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
            <input style={{ display: "none" }} name="beginDate" value={startDate?.startDate} />

            <>
                <div className="mb-2 block">
                    <Label htmlFor="title" value={"End Date"} />
                </div>
                <Datepicker
                    disabled={props.readOnly ?? false}
                    useRange={false}
                    name="endDate"
                    asSingle={true}
                    value={endDate}
                    onChange={endDateChanged}
                />
            </>

            <input style={{ display: "none" }} name="endDate" value={endDate?.startDate} />

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
        </div>
    );
};

export default CreateMissionForm;