interface Props {
    label?: string;
    name: string;
    type?: string;
    placeholder?: string;
    className?: string;
    value?: string;
    id?: string;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Input(props: Props) {
    const { label, name, id, type, className, placeholder, value, onChange, ...others } = props;

    return (
        <div className="input">
            <label className="input__label" htmlFor={name}>
                {label}
            </label>
            <input
                name={name}
                type="text"
                id={id}
                className={
                    className +
                    " bg-gray-900 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-900 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                }
                placeholder={placeholder}
                {...others}
            />
        </div>
    );
}
