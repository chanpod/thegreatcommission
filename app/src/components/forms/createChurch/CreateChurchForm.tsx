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
}
const CreateChurchForm = (props: Props) => {
    return (
        <>
            <Input name="name" label="Name" defaultValue={props?.initialValues?.name ?? ""} />
            <Input name="city" label="City" defaultValue={props?.initialValues?.city ?? ""} />
            <Input name="state" label="State" defaultValue={props?.initialValues?.state ?? ""} />            
            <Input name="zip" label="Zip Code" defaultValue={props?.initialValues?.zip ?? ""} />
        </>
    );
};

export default CreateChurchForm;
