
import Geocode from "react-geocode";
import React, { useRef, useState } from "react";
import { Input } from "../input/Input";
import { churchOrganization } from "server/db/schema";


export interface IChurchFormData extends typeof churchOrganization.$inferSelect {
    name: string;
    city: string;
    state: string;
    zip: string;
}

interface Props {
    initialValues?: IChurchFormData | null;
    readOnly?: boolean;
}

function checkForValidUrl(value: string) {
    const regex =
        /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;

    return regex.test(value);
}

export async function convertAddressToLocation(address: string): Promise<Location | undefined> {
    // Get latitude & longitude from address.
    return Geocode.fromAddress(address).then(
        (response) => {
            if (response && response.results && response.results.length > 0) {
                const location = response.results[0].geometry.location;
                console.log(location);
                return location;
            } else {
                console.error(response);
            }
        },
        (error) => {
            console.error(error);
        }
    );
}

const CreateChurchForm = (props: Props) => {
    const [churchBannerUrl, setChurchBannerUrl] = useState(props?.initialValues?.churchBannerUrl ?? "");
    const [churchWebsiteUrl, setChurchWebsiteUrl] = useState(props?.initialValues?.mainChurchWebsite ?? "");

    const churchBannerUrlValid = churchBannerUrl.length > 0 ? checkForValidUrl(churchBannerUrl) : true;
    const churchWebsiteUrlValid = churchWebsiteUrl.length > 0 ? checkForValidUrl(churchWebsiteUrl) : true;

    return (
        <div className="flex flex-wrap space-y-3">
            <div className="flex-initial w-full">
                <Input
                    disabled={props.readOnly ?? false}
                    name="name"
                    label="Name"
                    required
                    defaultValue={props?.initialValues?.name ?? ""}
                />
            </div>
            <div className="flex-initial w-full">
                <Input
                    disabled={props.readOnly ?? false}
                    name="street"
                    label="Street"                    
                    defaultValue={props?.initialValues?.street ?? ""}
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
            <div className="flex-initial w-full">
                <Input
                    className="max-w-lg"
                    disabled={props.readOnly ?? false}
                    name="churchBannerUrl"
                    label="Church Banner Image URL"
                    defaultValue={props?.initialValues?.churchBannerUrl ?? ""}
                    color={churchBannerUrlValid ? "" : "failure"}
                    onChange={(e) => setChurchBannerUrl(e.target.value)}
                    helperText={churchBannerUrlValid ? "" : "Invalid URL"}
                />
            </div>
            <div className="flex-initial w-full">
                <Input
                    className="max-w-lg"
                    disabled={props.readOnly ?? false}
                    name="mainChurchWebsite"
                    label="Main Website"
                    defaultValue={props?.initialValues?.mainChurchWebsite ?? ""}
                    color={churchWebsiteUrlValid ? "" : "failure"}
                    onChange={(e) => setChurchWebsiteUrl(e.target.value)}
                    helperText={churchWebsiteUrlValid ? "" : "Invalid URL"}
                />
            </div>
        </div>
    );
};

export default CreateChurchForm;
