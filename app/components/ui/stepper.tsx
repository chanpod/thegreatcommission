import { cn } from "~/lib/utils";
import { Check } from "lucide-react";

interface StepperProps {
	steps: string[];
	currentStep: number;
	className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
	return (
		<div className={cn("w-full", className)}>
			<div className="flex items-center justify-between">
				{steps.map((step, index) => (
					<div key={step} className="flex flex-col items-center">
						{/* Step Circle */}
						<div
							className={cn(
								"flex h-8 w-8 items-center justify-center rounded-full border-2",
								{
									"border-primary bg-primary text-primary-foreground":
										index < currentStep,
									"border-primary bg-primary-foreground text-primary":
										index === currentStep,
									"border-muted-foreground bg-background": index > currentStep,
								},
							)}
						>
							{index < currentStep ? (
								<Check className="h-4 w-4" />
							) : (
								<span>{index + 1}</span>
							)}
						</div>

						{/* Step Label */}
						<span
							className={cn("mt-2 text-xs", {
								"text-primary font-medium": index <= currentStep,
								"text-muted-foreground": index > currentStep,
							})}
						>
							{step}
						</span>

						{/* Connector line (except for last item) */}
						{index < steps.length - 1 && (
							<div
								className={cn("absolute left-0 top-4 h-[2px] transition-all", {
									"bg-primary": index < currentStep,
									"bg-muted-foreground": index >= currentStep,
								})}
								style={{
									width: `calc((100% - ${steps.length * 2}rem) / ${steps.length - 1})`,
									transform: `translateX(${(index + 1) * 2}rem)`,
								}}
							/>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
