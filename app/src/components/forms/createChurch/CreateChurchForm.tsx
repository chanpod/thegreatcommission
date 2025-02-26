import { useState } from "react";
import { fromAddress } from "react-geocode";
import { churchOrganization } from "server/db/schema";
import { Stack } from "../../layout/Stack";
import { Input } from "../input/Input";
import { Video, Image } from "lucide-react";
import { ColorPicker } from "~/components/forms/ColorPicker";
import { UploadButton } from "~/utils/uploadthing";
import { toast } from "sonner";

export interface IChurchFormData {
	name: string;
	street: string | null;
	city: string;
	state: string;
	zip: string;
	churchBannerUrl: string | null;
	mainChurchWebsite: string | null;
	liveStreamUrl: string | null;
	themeColors?: string;
	logoUrl?: string | null;
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
	try {
		const response = await fromAddress(address);
		return response?.results?.[0]?.geometry?.location;
	} catch (error) {
		console.error("Error converting address:", error);
		return undefined;
	}
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
	const [logoUrl, setLogoUrl] = useState(props?.initialValues?.logoUrl ?? "");
	const [themeColors, setThemeColors] = useState<Record<string, string>>(() => {
		try {
			return JSON.parse(
				props?.initialValues?.themeColors ||
					'{"primary":"#3b82f6","secondary":"#1e293b","accent":"#8b5cf6"}',
			);
		} catch (e) {
			console.error("Error parsing theme colors:", e);
			return {
				primary: "#3b82f6",
				secondary: "#1e293b",
				accent: "#8b5cf6",
			};
		}
	});

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
				<h3 className="text-gray-900">Church Logo</h3>
				{logoUrl && (
					<div className="relative w-40 h-40 rounded-lg overflow-hidden mb-2 bg-gray-100 flex items-center justify-center p-2 border">
						<img
							src={logoUrl}
							alt="Church Logo"
							className="max-w-full max-h-full object-contain"
						/>
					</div>
				)}

				{!props.readOnly && (
					<>
						<UploadButton
							endpoint="imageUploader"
							onClientUploadComplete={(res) => {
								if (res?.[0]) {
									setLogoUrl(res[0].url);
									toast.success("Logo uploaded successfully");
								}
							}}
							onUploadError={(error: Error) => {
								toast.error(`Upload failed: ${error.message}`);
							}}
						/>
						<Input type="hidden" name="logoUrl" value={logoUrl} />
					</>
				)}
			</div>

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

			<div className="space-y-4">
				<h3 className="text-lg font-medium">Theme Colors</h3>
				<p className="text-sm text-muted-foreground">
					Choose colors that reflect your church's identity.
				</p>
				<div className="space-y-3">
					<ColorPicker
						label="Primary Color"
						value={themeColors.primary}
						onChange={(value) =>
							setThemeColors((prev) => ({ ...prev, primary: value }))
						}
					/>
					<ColorPicker
						label="Secondary Color"
						value={themeColors.secondary}
						onChange={(value) =>
							setThemeColors((prev) => ({ ...prev, secondary: value }))
						}
					/>
					<ColorPicker
						label="Accent Color"
						value={themeColors.accent}
						onChange={(value) =>
							setThemeColors((prev) => ({ ...prev, accent: value }))
						}
					/>
				</div>
				<div className="mt-4 p-3 rounded-lg border bg-muted/30">
					<h4 className="text-sm font-medium mb-2">Preview</h4>
					<div className="grid grid-cols-3 gap-2">
						<div className="space-y-1 text-center">
							<div
								className="h-8 rounded-md shadow-sm"
								style={{ backgroundColor: themeColors.primary }}
								title="Primary Color"
							/>
							<span className="text-xs text-muted-foreground">Primary</span>
						</div>
						<div className="space-y-1 text-center">
							<div
								className="h-8 rounded-md shadow-sm"
								style={{ backgroundColor: themeColors.secondary }}
								title="Secondary Color"
							/>
							<span className="text-xs text-muted-foreground">Secondary</span>
						</div>
						<div className="space-y-1 text-center">
							<div
								className="h-8 rounded-md shadow-sm"
								style={{ backgroundColor: themeColors.accent }}
								title="Accent Color"
							/>
							<span className="text-xs text-muted-foreground">Accent</span>
						</div>
					</div>
				</div>
				<input
					type="hidden"
					name="themeColors"
					value={JSON.stringify(themeColors)}
				/>
			</div>
		</Stack>
	);
};

export default CreateChurchForm;
