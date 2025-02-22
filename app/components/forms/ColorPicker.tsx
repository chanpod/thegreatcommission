import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Paintbrush } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";

interface ColorPickerProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
	const [isOpen, setIsOpen] = useState(false);

	const presetColors = [
		"#3b82f6", // Blue
		"#ef4444", // Red
		"#22c55e", // Green
		"#f59e0b", // Yellow
		"#8b5cf6", // Purple
		"#ec4899", // Pink
		"#06b6d4", // Cyan
		"#1e293b", // Slate
	];

	return (
		<div className="space-y-2">
			<Label>{label}</Label>
			<Popover open={isOpen} onOpenChange={setIsOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className="w-full justify-start gap-2 h-auto py-2"
						type="button"
					>
						<div
							className="h-4 w-4 rounded-full border"
							style={{ backgroundColor: value }}
						/>
						<span className="truncate flex-1 text-left">{value}</span>
						<Paintbrush className="h-4 w-4 flex-shrink-0" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[280px] p-3" side="right" align="start">
					<div className="space-y-3">
						<div className="grid grid-cols-4 gap-2">
							{presetColors.map((color) => (
								<button
									key={color}
									type="button"
									className="h-10 rounded-md border transition-colors hover:opacity-90 relative group"
									style={{ backgroundColor: color }}
									onClick={() => {
										onChange(color);
										setIsOpen(false);
									}}
								>
									<span className="sr-only">Select color {color}</span>
									<span
										className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-white text-xs font-mono"
										style={{
											backgroundColor: "rgba(0,0,0,0.5)",
											borderRadius: "0.375rem",
										}}
									>
										{color}
									</span>
								</button>
							))}
						</div>
						<div className="space-y-1">
							<Label className="text-xs">Custom Color</Label>
							<Input
								type="color"
								value={value}
								onChange={(e) => onChange(e.target.value)}
								className="h-10"
							/>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}
