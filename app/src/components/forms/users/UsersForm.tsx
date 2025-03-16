import { Label } from "~/components/ui/label";
import { Input } from "../input/Input";

export default function UsersForm({ defaultValues }: { defaultValues: any }) {

    console.log("defaultValues", defaultValues);

    return (
        <>
            <Input name="firstName" label="First Name" defaultValue={defaultValues.firstName} />
            <Input name="lastName" label="Last Name" defaultValue={defaultValues.lastName} />
            <Input name="middleName" label="Middle Name" defaultValue={defaultValues.middleName} />
            <Input name="email" label="email" defaultValue={defaultValues.email} />
            <Input name="city" label="City" defaultValue={defaultValues.city} />
            <Input name="state" label="State" defaultValue={defaultValues.state} />
            <Input name="zip" label="Zip Code" defaultValue={defaultValues.zip} />
            <Input name="phone" label="Phone" defaultValue={defaultValues.phone} />
            <div className="space-y-2">
                <Label className="text-sm font-medium">Communication Methods</Label>
                <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="preferEmail"
                            name="preferEmail"
                            defaultChecked={defaultValues.emailNotifications === true}
                            className="rounded border-gray-300"
                        />
                        <Label htmlFor="preferEmail" className="text-sm">Email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="preferText"
                            name="preferText"
                            defaultChecked={defaultValues.smsNotifications === true}
                            className="rounded border-gray-300"
                        />
                        <Label htmlFor="preferText" className="text-sm">Text Message</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="preferCall"
                            name="preferCall"
                            defaultChecked={defaultValues.phoneNotifications === true}
                            className="rounded border-gray-300"
                        />
                        <Label htmlFor="preferCall" className="text-sm">Phone Call</Label>
                    </div>
                </div>
            </div>

            <div className="space-y-2 mt-4">
                <Label className="text-sm font-medium">Preferred Communication Method</Label>
                <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                        <input
                            type="radio"
                            id="preferredEmail"
                            name="preferredCommunicationMethod"
                            value="email"
                            defaultChecked={defaultValues.preferredCommunicationMethod === "email" || !defaultValues.preferredCommunicationMethod}
                            className="rounded-full border-gray-300"
                        />
                        <Label htmlFor="preferredEmail" className="text-sm">Email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            type="radio"
                            id="preferredText"
                            name="preferredCommunicationMethod"
                            value="sms"
                            defaultChecked={defaultValues.preferredCommunicationMethod === "sms"}
                            className="rounded-full border-gray-300"
                        />
                        <Label htmlFor="preferredText" className="text-sm">Text Message</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            type="radio"
                            id="preferredCall"
                            name="preferredCommunicationMethod"
                            value="phone"
                            defaultChecked={defaultValues.preferredCommunicationMethod === "phone"}
                            className="rounded-full border-gray-300"
                        />
                        <Label htmlFor="preferredCall" className="text-sm">Phone Call</Label>
                    </div>
                </div>
            </div>
        </>
    );
}