import { useState, useEffect } from "react";
import { DynamicForm } from "./DynamicForm";
import type { FormConfig } from "./FormFieldTypes";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Loader2 } from "lucide-react";

interface ContactFormDialogProps {
	buttonText: string;
	churchId: string;
	formType?: string;
	buttonVariant?:
		| "default"
		| "outline"
		| "ghost"
		| "link"
		| "destructive"
		| "secondary";
	buttonSize?: "default" | "sm" | "lg" | "icon";
	buttonClassName?: string;
	dialogTitle?: string;
	dialogDescription?: string;
	className?: string;
}

export function ContactFormDialog({
	buttonText,
	churchId,
	formType = "contact",
	buttonVariant = "default",
	buttonSize = "default",
	buttonClassName = "",
	dialogTitle = "Contact Us",
	dialogDescription = "Fill out the form below and we'll get back to you as soon as possible.",
	className = "",
}: ContactFormDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [formConfig, setFormConfig] = useState<FormConfig | null>(null);

	// Fetch form configuration when dialog opens
	useEffect(() => {
		if (open && !formConfig) {
			fetchForm();
		}
	}, [open]);

	const fetchForm = async () => {
		setLoading(true);
		setError(null);

		try {
			// Fetch the most recent active form of the specified type
			const response = await fetch(
				`/api/forms/${churchId}?type=${formType}&active=true`,
			);

			if (!response.ok) {
				throw new Error("Failed to load form");
			}

			const data = await response.json();

			if (data.forms && data.forms.length > 0) {
				// Use the first/most recent form
				setFormConfig(data.forms[0]);
			} else {
				throw new Error("No form configured");
			}
		} catch (error) {
			console.error("Error loading form:", error);
			setError("Unable to load the form. Please try again later.");
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async (data: Record<string, any>): Promise<boolean> => {
		if (!formConfig) return false;

		try {
			const response = await fetch(
				`/landing/${churchId}/forms/${formConfig.id}/submit`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(data),
				},
			);

			if (!response.ok) {
				throw new Error("Form submission failed");
			}

			return true;
		} catch (error) {
			console.error("Form submission error:", error);
			return false;
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					variant={buttonVariant}
					size={buttonSize}
					className={buttonClassName}
				>
					{buttonText}
				</Button>
			</DialogTrigger>
			<DialogContent className={`sm:max-w-[550px] ${className}`}>
				<DialogHeader>
					<DialogTitle>{dialogTitle}</DialogTitle>
					<DialogDescription>{dialogDescription}</DialogDescription>
				</DialogHeader>

				{loading ? (
					<div className="flex justify-center py-8">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
						<span className="sr-only">Loading form...</span>
					</div>
				) : error ? (
					<div className="text-center py-8 text-red-500">
						<p>{error}</p>
						<Button variant="outline" onClick={fetchForm} className="mt-4">
							Try Again
						</Button>
					</div>
				) : formConfig ? (
					<DynamicForm formConfig={formConfig} onSubmit={handleSubmit} />
				) : null}
			</DialogContent>
		</Dialog>
	);
}
