interface Props {
    label?: string;
    name: string;
    type?: string;
    placeholder?: string;
    className?: string;
    value?: string;
    id?: string;
    defaultValue?: string;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Input(props: Props) {
    const { label, name, id, type, className, placeholder, value, onChange, defaultValue, ...others } = props;

    return (
        <div className="input">
            <label className="input__label" htmlFor={name}>
                {label}
            </label>
            <input
                name={name}
                type="text"
                defaultValue={defaultValue ?? ""}
                id={id}
                style={{
                    "--tw-ring-shadow": "0 0 #000 !important",
                }}
                className="block rounded-md w-full p-2.5 bg-[#0a192f] border-gray-600 placeholder-gray-400 text-white border-none focus:border-none focus:border-ring-none"
                placeholder={placeholder}
                {...others}
            />
        </div>
    );
}
