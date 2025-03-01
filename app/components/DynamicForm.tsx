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
import { Loader2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "~/components/ui/alert";
import { FormFieldType, type FormConfig } from "./FormFieldTypes";

interface DynamicFormProps {
	formConfig: FormConfig;
	onSubmit: (data: Record<string, any>) => Promise<boolean>;
	submitButtonText?: string;
}

export function DynamicForm({
	formConfig,
	onSubmit,
	submitButtonText = "Submit",
}: DynamicFormProps) {
	const [formData, setFormData] = useState<Record<string, any>>({});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
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
			return;
		}

		setIsSubmitting(true);
		setSubmitError(null);

		try {
			// Add form metadata
			const submissionData = {
				formData: { ...formData },
				submitterEmail: formData.email || "",
				submitterName: formData.name || formData.fullName || "",
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
		} finally {
			setIsSubmitting(false);
		}
	};

	if (submitSuccess) {
		return (
			<div className="text-center py-8">
				<Alert
					variant="default"
					className="mb-4 bg-primary/10 border-primary/20"
				>
					<AlertTitle className="text-primary">
						Submission Successful
					</AlertTitle>
					<AlertDescription>
						{formConfig.confirmationMessage || "Thank you for your submission!"}
					</AlertDescription>
				</Alert>
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
		<form onSubmit={handleSubmit} className="space-y-6">
			{submitError && (
				<Alert variant="destructive">
					<AlertTitle>Error</AlertTitle>
					<AlertDescription>{submitError}</AlertDescription>
				</Alert>
			)}

			{formConfig.fields.map((field) => {
				const fieldId = `field-${field.name}`;
				const error = errors[field.name];

				switch (field.type) {
					case FormFieldType.TEXT:
					case FormFieldType.EMAIL:
					case FormFieldType.DATE:
					case FormFieldType.NUMBER:
					case FormFieldType.PHONE:
						return (
							<div key={field.id} className="space-y-2">
								<Label htmlFor={fieldId} className="flex items-center gap-1">
									{field.label}
									{field.required && (
										<span className="text-destructive">*</span>
									)}
								</Label>
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
									className={error ? "border-destructive" : ""}
								/>
								{error && <p className="text-sm text-destructive">{error}</p>}
							</div>
						);

					case FormFieldType.TEXTAREA:
						return (
							<div key={field.id} className="space-y-2">
								<Label htmlFor={fieldId} className="flex items-center gap-1">
									{field.label}
									{field.required && (
										<span className="text-destructive">*</span>
									)}
								</Label>
								<Textarea
									id={fieldId}
									name={field.name}
									placeholder={field.placeholder}
									value={formData[field.name] || ""}
									onChange={(e) => handleChange(field.name, e.target.value)}
									className={error ? "border-destructive" : ""}
									rows={4}
								/>
								{error && <p className="text-sm text-destructive">{error}</p>}
							</div>
						);

					case FormFieldType.SELECT:
						return (
							<div key={field.id} className="space-y-2">
								<Label className="flex items-center gap-1">
									{field.label}
									{field.required && (
										<span className="text-destructive">*</span>
									)}
								</Label>
								<Select
									value={formData[field.name] || ""}
									onValueChange={(value) => handleChange(field.name, value)}
								>
									<SelectTrigger className={error ? "border-destructive" : ""}>
										<SelectValue
											placeholder={field.placeholder || "Select an option"}
										/>
									</SelectTrigger>
									<SelectContent>
										{field.options?.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{error && <p className="text-sm text-destructive">{error}</p>}
							</div>
						);

					case FormFieldType.CHECKBOX:
						return (
							<div key={field.id} className="space-y-3">
								<Label className="flex items-center gap-1">
									{field.label}
									{field.required && (
										<span className="text-destructive">*</span>
									)}
								</Label>
								<div className="space-y-2">
									{field.options?.map((option) => {
										const checkboxId = `${fieldId}-${option.value}`;
										const values = (formData[field.name] || []) as string[];

										return (
											<div
												key={option.value}
												className="flex items-center space-x-2"
											>
												<Checkbox
													id={checkboxId}
													checked={values.includes(option.value)}
													onCheckedChange={(checked) => {
														const newValues = [...values];
														if (checked) {
															if (!newValues.includes(option.value)) {
																newValues.push(option.value);
															}
														} else {
															const index = newValues.indexOf(option.value);
															if (index > -1) {
																newValues.splice(index, 1);
															}
														}
														handleChange(field.name, newValues);
													}}
												/>
												<label
													htmlFor={checkboxId}
													className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
												>
													{option.label}
												</label>
											</div>
										);
									})}
								</div>
								{error && <p className="text-sm text-destructive">{error}</p>}
							</div>
						);

					case FormFieldType.RADIO:
						return (
							<div key={field.id} className="space-y-3">
								<Label className="flex items-center gap-1">
									{field.label}
									{field.required && (
										<span className="text-destructive">*</span>
									)}
								</Label>
								<RadioGroup
									value={formData[field.name] || ""}
									onValueChange={(value) => handleChange(field.name, value)}
									className="space-y-2"
								>
									{field.options?.map((option) => (
										<div
											key={option.value}
											className="flex items-center space-x-2"
										>
											<RadioGroupItem
												value={option.value}
												id={`${fieldId}-${option.value}`}
											/>
											<label
												htmlFor={`${fieldId}-${option.value}`}
												className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
											>
												{option.label}
											</label>
										</div>
									))}
								</RadioGroup>
								{error && <p className="text-sm text-destructive">{error}</p>}
							</div>
						);

					default:
						return null;
				}
			})}

			<div className="flex justify-end">
				<Button type="submit" disabled={isSubmitting}>
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
