import { ChurchOrganization } from "@prisma/client";
import React from "react";
import { Input } from "../input/Input";

export interface IChurchFormData extends ChurchOrganization {
    name: string;
    city: string;
    state: string;
    zip: string;
}

interface Props {
    initialValues?: IChurchFormData | null;
    readOnly?: boolean;
}
const CreateChurchForm = (props: Props) => {
    return (
        <div className="flex flex-wrap space-y-3">
            <div className="flex-initial w-full">
                <Input
                    disabled={props.readOnly ?? false}
                    name="name"
                    label="Name"
                    defaultValue={props?.initialValues?.name ?? ""}
                />
            </div>
            <div className="flex flex-wrap space-x-3">
                <div className="flex-initial w-80">
                    <Input
                        disabled={props.readOnly ?? false}
                        name="city"
                        label="City"
                        defaultValue={props?.initialValues?.city ?? ""}
                    />
                </div>
                <div className="flex-initial w-80">
                    <Input
                        className="flex-1"
                        disabled={props.readOnly ?? false}
                        name="state"
                        label="State"
                        defaultValue={props?.initialValues?.state ?? ""}
                    />
                </div>
                <div className="flex-initial w-80">
                    <Input
                        className="flex-1"
                        disabled={props.readOnly ?? false}
                        name="zip"
                        label="Zip Code"
                        defaultValue={props?.initialValues?.zip ?? ""}
                    />
                </div>
            </div>
        </div>
    );
};

export default CreateChurchForm;
