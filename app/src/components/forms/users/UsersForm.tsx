import { Label } from "~/components/ui/label";
import { Input } from "../input/Input";

export default function UsersForm({ defaultValues }: { defaultValues: any }) {
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
                <Label className="text-sm font-medium">Preferred Communication Methods</Label>
                <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="preferEmail"
                            name="preferEmail"
                            defaultChecked={defaultValues.emailNotifications}
                            className="rounded border-gray-300"
                        />
                        <Label htmlFor="preferEmail" className="text-sm">Email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="preferText"
                            name="preferText"
                            defaultChecked={defaultValues.smsNotifications}
                            className="rounded border-gray-300"
                        />
                        <Label htmlFor="preferText" className="text-sm">Text Message</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="preferCall"
                            name="preferCall"
                            defaultChecked={defaultValues.phoneNotifications}
                            className="rounded border-gray-300"
                        />
                        <Label htmlFor="preferCall" className="text-sm">Phone Call</Label>
                    </div>
                </div>
            </div>
        </>
    );
}