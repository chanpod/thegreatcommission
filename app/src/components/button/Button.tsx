import { ColorRing } from "react-loader-spinner";

interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    loading?: boolean;
    type?: "button" | "submit" | "reset";
}

export function Button({ children, ...props }: ButtonProps) {
    return (
        <button
            onClick={props.onClick}
            // {...props}
            // className={"relative bg-gray-900 text-white text-lg font-bold py-2 px-4 rounded-md w-28 h-12 " + props.className}
            data-te-ripple-init
            data-te-ripple-color="light"
            className={
                "inline-block rounded bg-[#172b4d] hover:bg-[#2a4365] px-6 py-2.5 text-xs font-medium uppercase leading-tight text-white shadow-md transition duration-150 ease-in-out  hover:shadow-lg focus:bg-primary-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-primary-800 active:shadow-lg" +
                props.className
            }
        >
            {props.loading ? (
                <ColorRing
                    visible={true}
                    ariaLabel="blocks-loading"
                    wrapperClass="w-full h-full relative"
                    colors={["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"]}
                />
            ) : (
                children
            )}
        </button>
    );
}
