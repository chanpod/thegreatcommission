import { forwardRef } from "react";
import { cn } from "~/lib/utils";
import { Label } from "~/components/ui/label";
import { Input as TextInput } from "~/components/ui/input";

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {
	error?: string;
	prefix?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className, error, prefix, ...props }, ref) => {
		return (
			<div className="relative">
				{prefix && (
					<div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
						{prefix}
					</div>
				)}
				<input
					className={cn(
						"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
						prefix && "pl-10",
						error && "border-destructive",
						className,
					)}
					ref={ref}
					{...props}
				/>
				{error && <div className="mt-1 text-sm text-destructive">{error}</div>}
			</div>
		);
	},
);
Input.displayName = "Input";

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

export function InputComponent(props: Props) {
	const {
		label,
		name,
		id,
		type,
		disabled,
		className,
		placeholder,
		value,
		onChange,
		defaultValue,
		...others
	} = props;

	return (
		<div id={id} className={className}>
			<div className="mb-2 block">
				<Label htmlFor="title">{label}</Label>
			</div>
			<TextInput
				disabled={disabled}
				{...others}
				defaultValue={defaultValue ?? ""}
				type={type}
				value={value}
				name={name}
				onChange={onChange}
				id="title"
			/>
		</div>
	);
}

export { Input };
