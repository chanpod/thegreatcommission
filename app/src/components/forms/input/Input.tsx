import { forwardRef } from "react";
import { cn } from "~/lib/utils";
import { Label } from "~/components/ui/label";
import { Input as TextInput } from "~/components/ui/input";

export interface InputBaseProps
	extends React.InputHTMLAttributes<HTMLInputElement> {
	error?: string;
	prefix?: React.ReactNode;
}

// Base input with prefix support
const InputBase = forwardRef<HTMLInputElement, InputBaseProps>(
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
InputBase.displayName = "InputBase";

// Main Input component with label support
export interface InputProps {
	label?: string;
	name: string;
	type?: string;
	placeholder?: string;
	className?: string;
	value?: string;
	id?: string;
	defaultValue?: string;
	disabled?: boolean;
	error?: string;
	prefix?: React.ReactNode;
	onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Input({
	label,
	name,
	id,
	type = "text",
	disabled,
	className,
	placeholder,
	value,
	onChange,
	defaultValue,
	error,
	prefix,
	...props
}: InputProps) {
	return (
		<div id={id} className={className}>
			{label && (
				<div className="mb-2 block">
					<Label htmlFor={name}>{label}</Label>
				</div>
			)}
			<InputBase
				id={name}
				name={name}
				type={type}
				disabled={disabled}
				placeholder={placeholder}
				value={value}
				onChange={onChange}
				defaultValue={defaultValue}
				error={error}
				prefix={prefix}
				{...props}
			/>
		</div>
	);
}

export { InputBase };
