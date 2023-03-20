import { Label, TextInput } from "flowbite-react";

interface Props {
    label?: string;
    name: string;
    type?: string;
    placeholder?: string;
    className?: string;
    value?: string;
    id?: string;
    defaultValue?: string;
    disabled?: boolean;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    others?: any;
}

export function Input(props: Props) {
    const { label, name, id, type, disabled, className, placeholder, value, onChange, defaultValue, ...others } = props;

    return (
        <div id={id}>
            <div className="mb-2 block">
                <Label htmlFor="title" value={label} />
            </div>
            <TextInput disabled={disabled} {...others} defaultValue={defaultValue ?? ""} value={value} name={name} onChange={onChange} id="title" />
        </div>

    );
}
