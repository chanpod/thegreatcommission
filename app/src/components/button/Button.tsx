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
            {...props}
            className={"relative bg-gray-900 text-white text-lg font-bold py-2 px-4 rounded-md w-28 h-12 " + props.className}
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
