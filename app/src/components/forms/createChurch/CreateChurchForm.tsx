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
        <>
            <Input
                disabled={props.readOnly ?? false}
                name="name"
                label="Name"
                defaultValue={props?.initialValues?.name ?? ""}
            />
            <Input disabled={props.readOnly ?? false} name="city" label="City" defaultValue={props?.initialValues?.city ?? ""} />
            <Input disabled={props.readOnly ?? false} name="state" label="State" defaultValue={props?.initialValues?.state ?? ""} />
            <Input disabled={props.readOnly ?? false} name="zip" label="Zip Code" defaultValue={props?.initialValues?.zip ?? ""} />
        </>
    );
};

export default CreateChurchForm;
