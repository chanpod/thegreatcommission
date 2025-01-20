import { Label } from "~/components/ui/label";
import { Input as TextInput } from "~/components/ui/input";

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
        <div id={id} className={className}>
            <div className="mb-2 block">
                <Label htmlFor="title">{label}</Label>
            </div>
            <TextInput disabled={disabled} {...others} defaultValue={defaultValue ?? ""} type={type} value={value} name={name} onChange={onChange} id="title" />
        </div>

    );
}
