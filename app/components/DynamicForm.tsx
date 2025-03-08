import React, { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "~/components/ui/alert";
import { FormFieldType, type FormConfig } from "./FormFieldTypes";
import { cn } from "~/lib/utils";

interface DynamicFormProps {
	formConfig: FormConfig;
	onSubmit: (data: FormSubmissionData) => Promise<boolean>;
	submitButtonText?: string;
	isSubmitting?: boolean;
	className?: string;
}

// Define a type for form submission data
export interface FormSubmissionData {
	formData: Record<string, string | boolean | string[]>;
	submitterEmail?: string;
	submitterName?: string;
}

export function DynamicForm({
	formConfig,
	onSubmit,
	submitButtonText = "Submit",
	isSubmitting = false,
	className,
}: DynamicFormProps) {
	const [formData, setFormData] = useState<
		Record<string, string | boolean | string[]>
	>({});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [submitSuccess, setSubmitSuccess] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const handleChange = (name: string, value: string | boolean | string[]) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
		// Clear error when field is changed
		if (errors[name]) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[name];
				return newErrors;
			});
		}
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};
		let isValid = true;

		formConfig.fields.forEach((field) => {
			// Skip validation for hidden fields
			if (field.type === "hidden") return;

			// Check required fields
			if (field.required) {
				const value = formData[field.name];
				if (
					value === undefined ||
					value === null ||
					value === "" ||
					(Array.isArray(value) && value.length === 0)
				) {
					newErrors[field.name] = "This field is required";
					isValid = false;
				}
			}

			// Email validation
			if (
				field.type === FormFieldType.EMAIL &&
				formData[field.name] &&
				!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData[field.name])
			) {
				newErrors[field.name] = "Invalid email address";
				isValid = false;
			}

			// Phone validation
			if (
				field.type === FormFieldType.PHONE &&
				formData[field.name] &&
				!/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im.test(
					formData[field.name],
				)
			) {
				newErrors[field.name] = "Invalid phone number";
				isValid = false;
			}
		});

		setErrors(newErrors);
		return isValid;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			// Scroll to the first error
			const firstErrorField = document.querySelector(".border-destructive");
			if (firstErrorField) {
				firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
			}
			return;
		}

		setSubmitError(null);

		try {
			// Add form metadata
			const submissionData: FormSubmissionData = {
				formData: { ...formData },
				submitterEmail: (formData.email as string) || "",
				submitterName:
					(formData.name as string) || (formData.fullName as string) || "",
			};

			const success = await onSubmit(submissionData);

			if (success) {
				setSubmitSuccess(true);
				setFormData({});
			} else {
				setSubmitError(
					"There was an error submitting the form. Please try again.",
				);
			}
		} catch (error) {
			console.error("Form submission error:", error);
			setSubmitError("An unexpected error occurred. Please try again later.");
		}
	};

	if (submitSuccess) {
		return (
			<div className="py-8 text-center">
				<div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-6 w-6 text-primary"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M5 13l4 4L19 7"
						/>
					</svg>
				</div>
				<h3 className="mb-2 text-xl font-semibold">Thank You!</h3>
				<p className="mb-6 text-muted-foreground">
					{formConfig.confirmationMessage ||
						"Your form has been submitted successfully."}
				</p>
				<Button
					variant="outline"
					onClick={() => {
						setSubmitSuccess(false);
						setFormData({});
					}}
				>
					Submit Another Response
				</Button>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
			{submitError && (
				<Alert variant="destructive" className="mb-6">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Error</AlertTitle>
					<AlertDescription>{submitError}</AlertDescription>
				</Alert>
			)}

			<div className="space-y-5">
				{formConfig.fields.map((field) => {
					const fieldId = `field-${field.name}`;
					const error = errors[field.name];

					return (
						<div key={field.id} className="space-y-2">
							{/* Don't show label for checkbox type without options */}
							{!(field.type === FormFieldType.CHECKBOX && !field.options) && (
								<Label
									htmlFor={fieldId}
									className="flex items-center gap-1 text-base font-medium"
								>
									{field.label}
									{field.required && (
										<span className="text-destructive">*</span>
									)}
								</Label>
							)}

							{/* Text, Email, Phone, Number, Date inputs */}
							{[
								FormFieldType.TEXT,
								FormFieldType.EMAIL,
								FormFieldType.PHONE,
								FormFieldType.NUMBER,
								FormFieldType.DATE,
							].includes(field.type as FormFieldType) && (
								<Input
									id={fieldId}
									name={field.name}
									type={
										field.type === FormFieldType.NUMBER
											? "number"
											: field.type === FormFieldType.DATE
												? "date"
												: field.type === FormFieldType.PHONE
													? "tel"
													: field.type === FormFieldType.EMAIL
														? "email"
														: "text"
									}
									placeholder={field.placeholder}
									value={formData[field.name] || ""}
									onChange={(e) => handleChange(field.name, e.target.value)}
									className={cn("w-full", error ? "border-destructive" : "")}
									aria-invalid={error ? "true" : "false"}
								/>
							)}

							{/* Textarea */}
							{field.type === FormFieldType.TEXTAREA && (
								<Textarea
									id={fieldId}
									name={field.name}
									placeholder={field.placeholder}
									value={formData[field.name] || ""}
									onChange={(e) => handleChange(field.name, e.target.value)}
									className={cn(error ? "border-destructive" : "")}
									rows={4}
									aria-invalid={error ? "true" : "false"}
								/>
							)}

							{/* Select dropdown */}
							{field.type === FormFieldType.SELECT && field.options && (
								<Select
									value={formData[field.name] || ""}
									onValueChange={(value) => handleChange(field.name, value)}
								>
									<SelectTrigger
										className={cn(error ? "border-destructive" : "")}
										aria-invalid={error ? "true" : "false"}
									>
										<SelectValue
											placeholder={field.placeholder || "Select an option"}
										/>
									</SelectTrigger>
									<SelectContent>
										{field.options.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}

							{/* Radio buttons */}
							{field.type === FormFieldType.RADIO && field.options && (
								<RadioGroup
									value={formData[field.name] || ""}
									onValueChange={(value) => handleChange(field.name, value)}
									className="space-y-2"
								>
									{field.options.map((option) => (
										<div
											key={option.value}
											className="flex items-center space-x-2"
										>
											<RadioGroupItem
												value={option.value}
												id={`${fieldId}-${option.value}`}
												aria-invalid={error ? "true" : "false"}
											/>
											<Label
												htmlFor={`${fieldId}-${option.value}`}
												className="cursor-pointer"
											>
												{option.label}
											</Label>
										</div>
									))}
								</RadioGroup>
							)}

							{/* Checkbox group */}
							{field.type === FormFieldType.CHECKBOX && field.options && (
								<div className="space-y-2">
									{field.options.map((option) => (
										<div
											key={option.value}
											className="flex items-center space-x-2"
										>
											<Checkbox
												id={`${fieldId}-${option.value}`}
												checked={
													Array.isArray(formData[field.name]) &&
													formData[field.name].includes(option.value)
												}
												onCheckedChange={(checked) => {
													const currentValues = Array.isArray(
														formData[field.name],
													)
														? [...formData[field.name]]
														: [];
													const newValues = checked
														? [...currentValues, option.value]
														: currentValues.filter(
																(value) => value !== option.value,
															);
													handleChange(field.name, newValues);
												}}
												aria-invalid={error ? "true" : "false"}
											/>
											<Label
												htmlFor={`${fieldId}-${option.value}`}
												className="cursor-pointer"
											>
												{option.label}
											</Label>
										</div>
									))}
								</div>
							)}

							{/* Single checkbox */}
							{field.type === FormFieldType.CHECKBOX && !field.options && (
								<div className="flex items-center space-x-2">
									<Checkbox
										id={fieldId}
										checked={!!formData[field.name]}
										onCheckedChange={(checked) => {
											handleChange(field.name, !!checked);
										}}
										aria-invalid={error ? "true" : "false"}
									/>
									<Label htmlFor={fieldId} className="cursor-pointer">
										{field.label}
										{field.required && (
											<span className="ml-1 text-destructive">*</span>
										)}
									</Label>
								</div>
							)}

							{/* Error message */}
							{error && (
								<p className="text-sm font-medium text-destructive">{error}</p>
							)}
						</div>
					);
				})}
			</div>

			<div className="pt-2">
				<Button
					type="submit"
					disabled={isSubmitting}
					className="w-full sm:w-auto"
				>
					{isSubmitting ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Submitting...
						</>
					) : (
						submitButtonText
					)}
				</Button>
			</div>
		</form>
	);
}
