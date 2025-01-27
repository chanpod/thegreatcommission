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
        </>
    );
}