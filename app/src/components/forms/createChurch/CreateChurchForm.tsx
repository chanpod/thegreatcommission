import { useState } from "react";
import { fromAddress } from "react-geocode";
import { churchOrganization } from "server/db/schema";
import { Stack } from "../../layout/Stack";
import { Input } from "../input/Input";
import { Video } from "lucide-react";

export interface IChurchFormData {
	name: string;
	street: string | null;
	city: string;
	state: string;
	zip: string;
	churchBannerUrl: string | null;
	mainChurchWebsite: string | null;
	liveStreamUrl: string | null;
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

export async function convertAddressToLocation(
	address: string,
): Promise<Location | undefined> {
	// Get latitude & longitude from address.
	return fromAddress(address).then(
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
		},
	);
}

const CreateChurchForm = (props: Props) => {
	const [churchBannerUrl, setChurchBannerUrl] = useState(
		props?.initialValues?.churchBannerUrl ?? "",
	);
	const [churchWebsiteUrl, setChurchWebsiteUrl] = useState(
		props?.initialValues?.mainChurchWebsite ?? "",
	);
	const [liveStreamUrl, setLiveStreamUrl] = useState(
		props?.initialValues?.liveStreamUrl ?? "",
	);

	const churchBannerUrlValid =
		churchBannerUrl.length > 0 ? checkForValidUrl(churchBannerUrl) : true;
	const churchWebsiteUrlValid =
		churchWebsiteUrl.length > 0 ? checkForValidUrl(churchWebsiteUrl) : true;
	const liveStreamUrlValid =
		liveStreamUrl.length > 0 ? checkForValidUrl(liveStreamUrl) : true;

	return (
		<Stack>
			<Input
				disabled={props.readOnly ?? false}
				name="name"
				label="Name"
				defaultValue={props?.initialValues?.name ?? ""}
			/>

			<Input
				disabled={props.readOnly ?? false}
				name="street"
				label="Street"
				defaultValue={props?.initialValues?.street ?? ""}
			/>

			<Input
				disabled={props.readOnly ?? false}
				name="city"
				label="City"
				defaultValue={props?.initialValues?.city ?? ""}
			/>

			<Input
				className="flex-1"
				disabled={props.readOnly ?? false}
				name="state"
				label="State"
				defaultValue={props?.initialValues?.state ?? ""}
			/>

			<Input
				className="flex-1"
				disabled={props.readOnly ?? false}
				name="zip"
				label="Zip Code"
				defaultValue={props?.initialValues?.zip ?? ""}
			/>

			<div className="space-y-4">
				<h3 className="text-gray-900">Online Presence</h3>
				<Input
					className="max-w-lg"
					disabled={props.readOnly ?? false}
					name="mainChurchWebsite"
					label="Main Website"
					defaultValue={props?.initialValues?.mainChurchWebsite ?? ""}
					onChange={(e) => setChurchWebsiteUrl(e.target.value)}
				/>
				<Input
					label="Live Stream URL"
					name="liveStreamUrl"
					defaultValue={props?.initialValues?.liveStreamUrl ?? ""}
					placeholder="https://www.youtube.com/embed/your-stream-id"
					prefix={<Video className="h-4 w-4" />}
					onChange={(e) => setLiveStreamUrl(e.target.value)}
				/>
			</div>
		</Stack>
	);
};

export default CreateChurchForm;
