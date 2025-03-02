import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import type { FormField } from "./FormFieldTypes";
import { FormFieldType } from "./FormFieldTypes";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";

interface FormBuilderProps {
	initialFormConfig?: {
		id?: string;
		name: string;
		formType: string;
		fields: FormField[];
		redirectUrl?: string;
		emailNotifications: boolean;
		notificationEmails?: string[];
		confirmationMessage?: string;
		active: boolean;
	};
	onSave: (formConfig: any) => void;
	isSubmitting?: boolean;
}

export function FormBuilder({
	initialFormConfig,
	onSave,
	isSubmitting = false,
}: FormBuilderProps) {
	const [formConfig, setFormConfig] = useState(
		initialFormConfig || {
			name: "",
			formType: "contact",
			fields: [],
			redirectUrl: "",
			emailNotifications: true,
			notificationEmails: [],
			confirmationMessage: "Thank you for your submission!",
			active: true,
		},
	);

	// Initialize with at least one field if empty
	useEffect(() => {
		if (formConfig.fields.length === 0) {
			addField();
		}
	}, []);

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		const { name, value } = e.target;
		setFormConfig((prev) => ({ ...prev, [name]: value }));
	};

	const handleSwitchChange = (name: string, checked: boolean) => {
		setFormConfig((prev) => ({ ...prev, [name]: checked }));
	};

	const addField = () => {
		const newField: FormField = {
			id: `field_${Date.now()}`,
			name: "",
			label: "",
			type: FormFieldType.TEXT,
			placeholder: "",
			required: false,
			options: [],
		};

		setFormConfig((prev) => ({
			...prev,
			fields: [...prev.fields, newField],
		}));
	};

	const updateField = (index: number, field: string, value: any) => {
		const newFields = [...formConfig.fields];
		newFields[index] = { ...newFields[index], [field]: value };

		// Reset options if changing from a field type that has options to one that doesn't
		if (
			field === "type" &&
			![
				FormFieldType.SELECT,
				FormFieldType.RADIO,
				FormFieldType.CHECKBOX,
			].includes(value) &&
			[
				FormFieldType.SELECT,
				FormFieldType.RADIO,
				FormFieldType.CHECKBOX,
			].includes(newFields[index].type as FormFieldType)
		) {
			newFields[index].options = [];
		}

		setFormConfig((prev) => ({
			...prev,
			fields: newFields,
		}));
	};

	const removeField = (index: number) => {
		const newFields = [...formConfig.fields];
		newFields.splice(index, 1);
		setFormConfig((prev) => ({
			...prev,
			fields: newFields,
		}));
	};

	const addOption = (fieldIndex: number) => {
		const newFields = [...formConfig.fields];
		const field = newFields[fieldIndex];

		if (!field.options) {
			field.options = [];
		}

		field.options.push({
			value: `option_${field.options.length + 1}`,
			label: `Option ${field.options.length + 1}`,
		});

		setFormConfig((prev) => ({
			...prev,
			fields: newFields,
		}));
	};

	const updateOption = (
		fieldIndex: number,
		optionIndex: number,
		field: string,
		value: string,
	) => {
		const newFields = [...formConfig.fields];
		const options = [...(newFields[fieldIndex].options || [])];
		options[optionIndex] = { ...options[optionIndex], [field]: value };
		newFields[fieldIndex].options = options;

		setFormConfig((prev) => ({
			...prev,
			fields: newFields,
		}));
	};

	const removeOption = (fieldIndex: number, optionIndex: number) => {
		const newFields = [...formConfig.fields];
		const options = [...(newFields[fieldIndex].options || [])];
		options.splice(optionIndex, 1);
		newFields[fieldIndex].options = options;

		setFormConfig((prev) => ({
			...prev,
			fields: newFields,
		}));
	};

	const moveField = (index: number, direction: "up" | "down") => {
		if (
			(direction === "up" && index === 0) ||
			(direction === "down" && index === formConfig.fields.length - 1)
		) {
			return;
		}

		const newFields = [...formConfig.fields];
		const newIndex = direction === "up" ? index - 1 : index + 1;
		[newFields[index], newFields[newIndex]] = [
			newFields[newIndex],
			newFields[index],
		];

		setFormConfig((prev) => ({
			...prev,
			fields: newFields,
		}));
	};

	const handleNotificationEmails = (value: string) => {
		const emails = value.split(",").map((email) => email.trim());
		setFormConfig((prev) => ({
			...prev,
			notificationEmails: emails,
		}));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSave(formConfig);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="space-y-4">
					<div>
						<Label htmlFor="name">Form Name</Label>
						<Input
							id="name"
							name="name"
							value={formConfig.name}
							onChange={handleChange}
							placeholder="Contact Form"
							required
						/>
					</div>

					<div>
						<Label htmlFor="formType">Form Type</Label>
						<Select
							value={formConfig.formType}
							onValueChange={(value) =>
								setFormConfig((prev) => ({ ...prev, formType: value }))
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select form type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="contact">Contact</SelectItem>
								<SelectItem value="prayer">Prayer Request</SelectItem>
								<SelectItem value="feedback">Feedback</SelectItem>
								<SelectItem value="registration">Event Registration</SelectItem>
								<SelectItem value="volunteer">Volunteer Application</SelectItem>
								<SelectItem value="custom">Custom</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div>
						<Label htmlFor="redirectUrl">Redirect URL (Optional)</Label>
						<Input
							id="redirectUrl"
							name="redirectUrl"
							value={formConfig.redirectUrl || ""}
							onChange={handleChange}
							placeholder="https://example.com/thank-you"
						/>
						<p className="text-sm text-muted-foreground mt-1">
							Leave blank to show a confirmation message instead
						</p>
					</div>

					<div>
						<Label htmlFor="confirmationMessage">Confirmation Message</Label>
						<Textarea
							id="confirmationMessage"
							name="confirmationMessage"
							value={formConfig.confirmationMessage || ""}
							onChange={handleChange}
							placeholder="Thank you for your submission!"
							rows={3}
						/>
					</div>

					<div className="flex items-center space-x-2">
						<Switch
							id="emailNotifications"
							checked={formConfig.emailNotifications}
							onCheckedChange={(checked) =>
								handleSwitchChange("emailNotifications", checked)
							}
						/>
						<Label htmlFor="emailNotifications">Email Notifications</Label>
					</div>

					{formConfig.emailNotifications && (
						<div>
							<Label htmlFor="notificationEmails">Notification Emails</Label>
							<Input
								id="notificationEmails"
								value={formConfig.notificationEmails?.join(", ") || ""}
								onChange={(e) => handleNotificationEmails(e.target.value)}
								placeholder="email@example.com, another@example.com"
							/>
							<p className="text-sm text-muted-foreground mt-1">
								Comma-separated list of email addresses
							</p>
						</div>
					)}

					<div className="flex items-center space-x-2">
						<Switch
							id="active"
							checked={formConfig.active}
							onCheckedChange={(checked) =>
								handleSwitchChange("active", checked)
							}
						/>
						<Label htmlFor="active">Form Active</Label>
					</div>
				</div>

				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-medium">Form Fields</h3>
						<Button
							type="button"
							onClick={addField}
							size="sm"
							variant="outline"
						>
							<Plus className="h-4 w-4 mr-2" />
							Add Field
						</Button>
					</div>

					<div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
						{formConfig.fields.map((field, index) => (
							<Card key={field.id} className="relative">
								<CardContent className="pt-6">
									<div className="absolute right-2 top-2 flex space-x-1">
										<Button
											type="button"
											onClick={() => moveField(index, "up")}
											size="icon"
											variant="ghost"
											disabled={index === 0}
											className="h-7 w-7"
										>
											<ArrowUp className="h-4 w-4" />
										</Button>
										<Button
											type="button"
											onClick={() => moveField(index, "down")}
											size="icon"
											variant="ghost"
											disabled={index === formConfig.fields.length - 1}
											className="h-7 w-7"
										>
											<ArrowDown className="h-4 w-4" />
										</Button>
										<Button
											type="button"
											onClick={() => removeField(index)}
											size="icon"
											variant="ghost"
											className="h-7 w-7 text-destructive"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>

									<div className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<div>
												<Label htmlFor={`field-${index}-name`}>
													Field Name
												</Label>
												<Input
													id={`field-${index}-name`}
													value={field.name}
													onChange={(e) =>
														updateField(index, "name", e.target.value)
													}
													placeholder="email"
													required
												/>
											</div>
											<div>
												<Label htmlFor={`field-${index}-type`}>
													Field Type
												</Label>
												<Select
													value={field.type}
													onValueChange={(value) =>
														updateField(index, "type", value)
													}
												>
													<SelectTrigger id={`field-${index}-type`}>
														<SelectValue placeholder="Select type" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value={FormFieldType.TEXT}>
															Text
														</SelectItem>
														<SelectItem value={FormFieldType.EMAIL}>
															Email
														</SelectItem>
														<SelectItem value={FormFieldType.TEXTAREA}>
															Text Area
														</SelectItem>
														<SelectItem value={FormFieldType.NUMBER}>
															Number
														</SelectItem>
														<SelectItem value={FormFieldType.SELECT}>
															Select
														</SelectItem>
														<SelectItem value={FormFieldType.CHECKBOX}>
															Checkbox
														</SelectItem>
														<SelectItem value={FormFieldType.RADIO}>
															Radio Buttons
														</SelectItem>
														<SelectItem value={FormFieldType.DATE}>
															Date
														</SelectItem>
														<SelectItem value={FormFieldType.PHONE}>
															Phone
														</SelectItem>
													</SelectContent>
												</Select>
											</div>
										</div>

										<div>
											<Label htmlFor={`field-${index}-label`}>Label</Label>
											<Input
												id={`field-${index}-label`}
												value={field.label}
												onChange={(e) =>
													updateField(index, "label", e.target.value)
												}
												placeholder="Email Address"
												required
											/>
										</div>

										<div>
											<Label htmlFor={`field-${index}-placeholder`}>
												Placeholder
											</Label>
											<Input
												id={`field-${index}-placeholder`}
												value={field.placeholder || ""}
												onChange={(e) =>
													updateField(index, "placeholder", e.target.value)
												}
												placeholder="Enter your email address"
											/>
										</div>

										<div className="flex items-center space-x-2">
											<Switch
												id={`field-${index}-required`}
												checked={field.required}
												onCheckedChange={(checked) =>
													updateField(index, "required", checked)
												}
											/>
											<Label htmlFor={`field-${index}-required`}>
												Required
											</Label>
										</div>

										{/* Options for select, checkbox, and radio fields */}
										{[
											FormFieldType.SELECT,
											FormFieldType.RADIO,
											FormFieldType.CHECKBOX,
										].includes(field.type as FormFieldType) && (
											<div className="space-y-2">
												<div className="flex items-center justify-between">
													<Label>Options</Label>
													<Button
														type="button"
														onClick={() => addOption(index)}
														size="sm"
														variant="outline"
													>
														<Plus className="h-3 w-3 mr-1" />
														Add Option
													</Button>
												</div>

												<div className="space-y-2 pl-2">
													{(field.options || []).map((option, optionIndex) => (
														<div
															key={optionIndex}
															className="flex items-center space-x-2"
														>
															<Input
																value={option.label}
																onChange={(e) =>
																	updateOption(
																		index,
																		optionIndex,
																		"label",
																		e.target.value,
																	)
																}
																placeholder="Option Label"
																className="flex-grow"
															/>
															<Input
																value={option.value}
																onChange={(e) =>
																	updateOption(
																		index,
																		optionIndex,
																		"value",
																		e.target.value,
																	)
																}
																placeholder="Value"
																className="w-24"
															/>
															<Button
																type="button"
																onClick={() => removeOption(index, optionIndex)}
																size="icon"
																variant="ghost"
																className="h-9 w-9"
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</div>
													))}
												</div>
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</div>

			<div className="flex justify-end">
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? "Saving..." : "Save Form"}
				</Button>
			</div>
		</form>
	);
}
