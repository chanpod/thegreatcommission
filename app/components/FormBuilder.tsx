import {
	ArrowDown,
	ArrowUp,
	Plus,
	Trash2,
	Loader2,
	ChevronDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { FormField, FormFieldOption } from "./FormFieldTypes";
import {
	FormFieldType,
	DEFAULT_CONTACT_FORM,
	DEFAULT_PRAYER_REQUEST_FORM,
	DEFAULT_FIRST_TIME_VISITOR_FORM,
} from "./FormFieldTypes";
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
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Checkbox } from "./ui/checkbox";
import { cn } from "~/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "./ui/alert-dialog";

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
	onSave: (formConfig: FormBuilderConfig) => void;
	isSubmitting?: boolean;
	submitButtonText?: string;
}

// Define a type for the form config to avoid using 'any'
interface FormBuilderConfig {
	id?: string;
	name: string;
	formType: string;
	fields: FormField[];
	redirectUrl?: string;
	emailNotifications: boolean;
	notificationEmails?: string[];
	confirmationMessage?: string;
	active: boolean;
	churchOrganizationId?: string;
}

export function FormBuilder({
	initialFormConfig,
	onSave,
	isSubmitting = false,
	submitButtonText,
}: FormBuilderProps) {
	const [formConfig, setFormConfig] = useState<FormBuilderConfig>(
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
	const [activeTab, setActiveTab] = useState<"fields" | "settings">("fields");
	const [showAdvancedOptions, setShowAdvancedOptions] = useState<
		Record<string, boolean>
	>({});
	const [showPresetDialog, setShowPresetDialog] = useState(false);
	const [previousFormType, setPreviousFormType] = useState(formConfig.formType);

	// Initialize with at least one field if empty
	useEffect(() => {
		if (formConfig.fields.length === 0) {
			addField();
		}
	}, [formConfig.fields.length]);

	// Form type presets
	const formTypePresets: Record<string, Partial<FormBuilderConfig>> = {
		contact: {
			...DEFAULT_CONTACT_FORM,
			name: "Contact Form",
			formType: "contact",
		},
		prayer: {
			...DEFAULT_PRAYER_REQUEST_FORM,
			name: "Prayer Request Form",
			formType: "prayer",
		},
		"first-time": {
			...DEFAULT_FIRST_TIME_VISITOR_FORM,
			name: "First Time Visitor Form",
			formType: "first-time",
		},
		feedback: {
			name: "Feedback Form",
			formType: "feedback",
			fields: [
				{
					id: `field_${Date.now()}`,
					name: "name",
					label: "Name",
					type: FormFieldType.TEXT,
					placeholder: "Your Name",
					required: true,
				},
				{
					id: `field_${Date.now() + 1}`,
					name: "email",
					label: "Email",
					type: FormFieldType.EMAIL,
					placeholder: "Your Email",
					required: true,
				},
				{
					id: `field_${Date.now() + 2}`,
					name: "feedback",
					label: "Feedback",
					type: FormFieldType.TEXTAREA,
					placeholder: "Please share your feedback with us",
					required: true,
				},
				{
					id: `field_${Date.now() + 3}`,
					name: "rating",
					label: "How would you rate your experience?",
					type: FormFieldType.RADIO,
					required: true,
					options: [
						{ label: "Excellent", value: "excellent" },
						{ label: "Good", value: "good" },
						{ label: "Average", value: "average" },
						{ label: "Poor", value: "poor" },
						{ label: "Very Poor", value: "very_poor" },
					],
				},
			],
			confirmationMessage:
				"Thank you for your feedback! We appreciate your input.",
			emailNotifications: true,
		},
		registration: {
			name: "Event Registration Form",
			formType: "registration",
			fields: [
				{
					id: `field_${Date.now()}`,
					name: "name",
					label: "Full Name",
					type: FormFieldType.TEXT,
					placeholder: "Your Full Name",
					required: true,
				},
				{
					id: `field_${Date.now() + 1}`,
					name: "email",
					label: "Email",
					type: FormFieldType.EMAIL,
					placeholder: "Your Email",
					required: true,
				},
				{
					id: `field_${Date.now() + 2}`,
					name: "phone",
					label: "Phone",
					type: FormFieldType.PHONE,
					placeholder: "Your Phone Number",
					required: true,
				},
				{
					id: `field_${Date.now() + 3}`,
					name: "attendees",
					label: "Number of Attendees",
					type: FormFieldType.NUMBER,
					placeholder: "1",
					required: true,
				},
				{
					id: `field_${Date.now() + 4}`,
					name: "dietary",
					label: "Dietary Restrictions",
					type: FormFieldType.TEXTAREA,
					placeholder: "Please list any dietary restrictions or allergies",
				},
				{
					id: `field_${Date.now() + 5}`,
					name: "agree_terms",
					label: "I agree to the terms and conditions",
					type: FormFieldType.CHECKBOX,
					required: true,
				},
			],
			confirmationMessage:
				"Thank you for registering! We look forward to seeing you at the event.",
			emailNotifications: true,
		},
		volunteer: {
			name: "Volunteer Application Form",
			formType: "volunteer",
			fields: [
				{
					id: `field_${Date.now()}`,
					name: "name",
					label: "Full Name",
					type: FormFieldType.TEXT,
					placeholder: "Your Full Name",
					required: true,
				},
				{
					id: `field_${Date.now() + 1}`,
					name: "email",
					label: "Email",
					type: FormFieldType.EMAIL,
					placeholder: "Your Email",
					required: true,
				},
				{
					id: `field_${Date.now() + 2}`,
					name: "phone",
					label: "Phone",
					type: FormFieldType.PHONE,
					placeholder: "Your Phone Number",
					required: true,
				},
				{
					id: `field_${Date.now() + 3}`,
					name: "availability",
					label: "Availability",
					type: FormFieldType.CHECKBOX,
					options: [
						{ label: "Weekday Mornings", value: "weekday_morning" },
						{ label: "Weekday Afternoons", value: "weekday_afternoon" },
						{ label: "Weekday Evenings", value: "weekday_evening" },
						{ label: "Weekend Mornings", value: "weekend_morning" },
						{ label: "Weekend Afternoons", value: "weekend_afternoon" },
						{ label: "Weekend Evenings", value: "weekend_evening" },
					],
					required: true,
				},
				{
					id: `field_${Date.now() + 4}`,
					name: "interests",
					label: "Areas of Interest",
					type: FormFieldType.CHECKBOX,
					options: [
						{ label: "Children's Ministry", value: "children" },
						{ label: "Youth Ministry", value: "youth" },
						{ label: "Worship Team", value: "worship" },
						{ label: "Hospitality", value: "hospitality" },
						{ label: "Technical Support", value: "tech" },
						{ label: "Administration", value: "admin" },
					],
					required: true,
				},
				{
					id: `field_${Date.now() + 5}`,
					name: "experience",
					label: "Previous Volunteer Experience",
					type: FormFieldType.TEXTAREA,
					placeholder: "Please describe any previous volunteer experience",
				},
				{
					id: `field_${Date.now() + 6}`,
					name: "agree_background_check",
					label: "I agree to a background check if required",
					type: FormFieldType.CHECKBOX,
					required: true,
				},
			],
			confirmationMessage:
				"Thank you for your interest in volunteering! We will contact you soon.",
			emailNotifications: true,
		},
		custom: {
			name: "Custom Form",
			formType: "custom",
			fields: [
				{
					id: `field_${Date.now()}`,
					name: "name",
					label: "Name",
					type: FormFieldType.TEXT,
					placeholder: "Your Name",
					required: true,
				},
				{
					id: `field_${Date.now() + 1}`,
					name: "email",
					label: "Email",
					type: FormFieldType.EMAIL,
					placeholder: "Your Email",
					required: true,
				},
			],
			confirmationMessage: "Thank you for your submission!",
			emailNotifications: true,
		},
	};

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

	const handleFormTypeChange = (value: string) => {
		// If there are existing fields, show confirmation dialog
		if (formConfig.fields.length > 0 && value !== formConfig.formType) {
			setPreviousFormType(formConfig.formType);
			setFormConfig((prev) => ({ ...prev, formType: value }));
			setShowPresetDialog(true);
		} else {
			// If no fields, just apply the preset
			applyFormTypePreset(value);
		}
	};

	const applyFormTypePreset = (formType: string) => {
		const preset = formTypePresets[formType];
		if (preset) {
			// Keep the existing ID and churchOrganizationId if they exist
			const { id, churchOrganizationId } = formConfig;
			setFormConfig({
				...(preset as FormBuilderConfig),
				id,
				churchOrganizationId,
			});
		}
	};

	const cancelFormTypeChange = () => {
		// Revert to previous form type
		setFormConfig((prev) => ({ ...prev, formType: previousFormType }));
		setShowPresetDialog(false);
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

	const updateField = (
		index: number,
		field: string,
		value: string | boolean | string[] | FormFieldOption[],
	) => {
		const newFields = [...formConfig.fields];
		newFields[index] = { ...newFields[index], [field]: value };

		// Auto-generate field name from label if it's empty or if we're updating the label
		if (
			field === "label" &&
			typeof value === "string" &&
			(newFields[index].name === "" ||
				newFields[index].name === generateFieldName(newFields[index].label))
		) {
			newFields[index].name = generateFieldName(value);
		}

		// Reset options if changing from a field type that has options to one that doesn't
		if (
			field === "type" &&
			![
				FormFieldType.SELECT,
				FormFieldType.RADIO,
				FormFieldType.CHECKBOX,
			].includes(value as FormFieldType) &&
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

	// Generate a field name from a label
	const generateFieldName = (label: string): string => {
		return label
			.toLowerCase()
			.replace(/[^a-z0-9]/g, "_") // Replace non-alphanumeric with underscore
			.replace(/_+/g, "_") // Replace multiple underscores with a single one
			.replace(/^_|_$/g, ""); // Remove leading/trailing underscores
	};

	const toggleAdvancedOptions = (index: number) => {
		setShowAdvancedOptions((prev) => ({
			...prev,
			[index]: !prev[index],
		}));
	};

	// Form preview component
	const FormPreview = () => (
		<div className="p-4 border rounded-md bg-white">
			<h2 className="text-xl font-bold mb-4">
				{formConfig.name || "Untitled Form"}
			</h2>
			<div className="space-y-4">
				{formConfig.fields.map((field) => (
					<div key={field.id} className="space-y-2">
						<Label className="flex items-center gap-1">
							{field.label || "Untitled Field"}
							{field.required && <span className="text-destructive">*</span>}
						</Label>

						{field.type === FormFieldType.TEXT && (
							<Input placeholder={field.placeholder || ""} />
						)}

						{field.type === FormFieldType.EMAIL && (
							<Input
								type="email"
								placeholder={field.placeholder || "email@example.com"}
							/>
						)}

						{field.type === FormFieldType.PHONE && (
							<Input
								type="tel"
								placeholder={field.placeholder || "(123) 456-7890"}
							/>
						)}

						{field.type === FormFieldType.TEXTAREA && (
							<Textarea placeholder={field.placeholder || ""} rows={3} />
						)}

						{field.type === FormFieldType.NUMBER && (
							<Input type="number" placeholder={field.placeholder || ""} />
						)}

						{field.type === FormFieldType.DATE && <Input type="date" />}

						{field.type === FormFieldType.SELECT && field.options && (
							<Select>
								<SelectTrigger>
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

						{field.type === FormFieldType.RADIO && field.options && (
							<RadioGroup>
								{field.options.map((option) => (
									<div
										key={option.value}
										className="flex items-center space-x-2"
									>
										<RadioGroupItem
											value={option.value}
											id={`${field.id}-${option.value}`}
										/>
										<Label htmlFor={`${field.id}-${option.value}`}>
											{option.label}
										</Label>
									</div>
								))}
							</RadioGroup>
						)}

						{field.type === FormFieldType.CHECKBOX && field.options && (
							<div className="space-y-2">
								{field.options.map((option) => (
									<div
										key={option.value}
										className="flex items-center space-x-2"
									>
										<Checkbox id={`${field.id}-${option.value}`} />
										<Label htmlFor={`${field.id}-${option.value}`}>
											{option.label}
										</Label>
									</div>
								))}
							</div>
						)}

						{field.type === FormFieldType.CHECKBOX && !field.options && (
							<div className="flex items-center space-x-2">
								<Checkbox id={field.id} />
								<Label htmlFor={field.id}>{field.label}</Label>
							</div>
						)}
					</div>
				))}

				<Button type="button" className="mt-4">
					{submitButtonText || "Submit"}
				</Button>
			</div>
		</div>
	);

	return (
		<div className="space-y-6">
			<Tabs
				value={activeTab}
				onValueChange={(value) => setActiveTab(value as "fields" | "settings")}
			>
				<TabsList className="mb-6 w-full grid grid-cols-2">
					<TabsTrigger value="fields">Form Builder</TabsTrigger>
					<TabsTrigger value="settings">Form Settings</TabsTrigger>
				</TabsList>

				<form onSubmit={handleSubmit} className="space-y-6">
					<TabsContent value="fields">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
							<div>
								<Label htmlFor="name" className="text-base font-medium">
									Form Name
								</Label>
								<Input
									id="name"
									name="name"
									value={formConfig.name}
									onChange={handleChange}
									placeholder="Contact Form"
									required
									className="mt-1"
								/>
							</div>

							<div>
								<Label htmlFor="formType" className="text-base font-medium">
									Form Type
								</Label>
								<Select
									value={formConfig.formType}
									onValueChange={handleFormTypeChange}
								>
									<SelectTrigger className="mt-1">
										<SelectValue placeholder="Select form type" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="contact">Contact</SelectItem>
										<SelectItem value="prayer">Prayer Request</SelectItem>
										<SelectItem value="feedback">Feedback</SelectItem>
										<SelectItem value="registration">
											Event Registration
										</SelectItem>
										<SelectItem value="volunteer">
											Volunteer Application
										</SelectItem>
										<SelectItem value="first-time">
											First Time Visitor
										</SelectItem>
										<SelectItem value="custom">Custom</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{/* Form Fields Editor */}
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<h3 className="text-lg font-medium">Form Fields</h3>
									<Button
										type="button"
										onClick={addField}
										variant="outline"
										size="sm"
										className="flex items-center gap-1"
									>
										<Plus className="h-4 w-4" /> Add Field
									</Button>
								</div>

								<div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
									{formConfig.fields.map((field, index) => (
										<Card key={field.id} className="overflow-hidden">
											<div className="bg-muted p-3 flex items-center justify-between">
												<div className="font-medium">
													{field.label || `Field ${index + 1}`}
													<span className="ml-2 text-xs text-muted-foreground">
														({field.type})
													</span>
												</div>
												<div className="flex items-center gap-1">
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() => moveField(index, "up")}
														disabled={index === 0}
														className="h-8 w-8 p-0"
													>
														<ArrowUp className="h-4 w-4" />
													</Button>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() => moveField(index, "down")}
														disabled={index === formConfig.fields.length - 1}
														className="h-8 w-8 p-0"
													>
														<ArrowDown className="h-4 w-4" />
													</Button>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() => removeField(index)}
														className="h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</div>
											<CardContent className="p-4 pt-4">
												<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
													<div className="md:col-span-2">
														<Label htmlFor={`field-${index}-label`}>
															Field Label
														</Label>
														<Input
															id={`field-${index}-label`}
															value={field.label}
															onChange={(e) =>
																updateField(index, "label", e.target.value)
															}
															placeholder="Enter what users will see (e.g. Email Address)"
															className="mt-1"
														/>
														<p className="text-xs text-muted-foreground mt-1">
															This is what users will see on the form
														</p>
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
															<SelectTrigger
																id={`field-${index}-type`}
																className="mt-1"
															>
																<SelectValue placeholder="Select field type" />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value={FormFieldType.TEXT}>
																	Text
																</SelectItem>
																<SelectItem value={FormFieldType.EMAIL}>
																	Email
																</SelectItem>
																<SelectItem value={FormFieldType.PHONE}>
																	Phone
																</SelectItem>
																<SelectItem value={FormFieldType.TEXTAREA}>
																	Text Area
																</SelectItem>
																<SelectItem value={FormFieldType.NUMBER}>
																	Number
																</SelectItem>
																<SelectItem value={FormFieldType.DATE}>
																	Date
																</SelectItem>
																<SelectItem value={FormFieldType.SELECT}>
																	Dropdown
																</SelectItem>
																<SelectItem value={FormFieldType.RADIO}>
																	Radio Buttons
																</SelectItem>
																<SelectItem value={FormFieldType.CHECKBOX}>
																	Checkbox
																</SelectItem>
															</SelectContent>
														</Select>
													</div>
													<div>
														<Label htmlFor={`field-${index}-placeholder`}>
															Placeholder Text
														</Label>
														<Input
															id={`field-${index}-placeholder`}
															value={field.placeholder || ""}
															onChange={(e) =>
																updateField(
																	index,
																	"placeholder",
																	e.target.value,
																)
															}
															placeholder="Enter placeholder text"
															className="mt-1"
														/>
													</div>
													<div className="flex items-center space-x-2 md:col-span-2">
														<Switch
															id={`field-${index}-required`}
															checked={field.required}
															onCheckedChange={(checked) =>
																updateField(index, "required", checked)
															}
														/>
														<Label
															htmlFor={`field-${index}-required`}
															className="cursor-pointer"
														>
															Required Field
														</Label>
													</div>

													{/* Options for Select, Radio, and Checkbox fields */}
													{[
														FormFieldType.SELECT,
														FormFieldType.RADIO,
														FormFieldType.CHECKBOX,
													].includes(field.type as FormFieldType) && (
														<div className="md:col-span-2 space-y-3">
															<div className="flex items-center justify-between">
																<Label>Options</Label>
																<Button
																	type="button"
																	onClick={() => addOption(index)}
																	variant="outline"
																	size="sm"
																	className="flex items-center gap-1"
																>
																	<Plus className="h-3 w-3" /> Add Option
																</Button>
															</div>

															{field.options && field.options.length > 0 ? (
																<div className="space-y-2">
																	{field.options.map((option, optionIndex) => (
																		<div
																			key={`${field.id}-option-${optionIndex}`}
																			className="flex items-center gap-2"
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
																				className="flex-1"
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
																				className="flex-1"
																			/>
																			<Button
																				type="button"
																				variant="ghost"
																				size="sm"
																				onClick={() =>
																					removeOption(index, optionIndex)
																				}
																				className="h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
																			>
																				<Trash2 className="h-4 w-4" />
																			</Button>
																		</div>
																	))}
																</div>
															) : (
																<p className="text-sm text-muted-foreground">
																	No options added yet. Click "Add Option" to
																	add options.
																</p>
															)}
														</div>
													)}

													{/* Advanced Options Toggle */}
													<div className="md:col-span-2 pt-2">
														<Button
															type="button"
															variant="ghost"
															size="sm"
															onClick={() => toggleAdvancedOptions(index)}
															className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
														>
															{showAdvancedOptions[index] ? "Hide" : "Show"}{" "}
															Advanced Options
															<ChevronDown
																className={cn(
																	"h-3 w-3 transition-transform",
																	showAdvancedOptions[index]
																		? "rotate-180"
																		: "",
																)}
																aria-hidden="true"
															/>
														</Button>
													</div>

													{/* Advanced Options */}
													{showAdvancedOptions[index] && (
														<div className="md:col-span-2 pt-2 pb-1 px-3 bg-muted/30 rounded-md border border-dashed">
															<div className="py-2">
																<Label
																	htmlFor={`field-${index}-name`}
																	className="text-sm"
																>
																	Field Name (Technical ID)
																</Label>
																<Input
																	id={`field-${index}-name`}
																	value={field.name}
																	onChange={(e) =>
																		updateField(index, "name", e.target.value)
																	}
																	placeholder="field_name"
																	className="mt-1 text-sm"
																/>
																<p className="text-xs text-muted-foreground mt-1">
																	Technical identifier used in code.
																	Auto-generated from label if left empty.
																</p>
															</div>
														</div>
													)}
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							</div>

							{/* Live Preview */}
							<div className="space-y-4 sticky top-4">
								<h3 className="text-lg font-medium">Live Preview</h3>
								<Card>
									<CardContent className="p-4">
										<FormPreview />
									</CardContent>
								</Card>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="settings">
						<div className="space-y-6">
							<Card>
								<CardContent className="p-6">
									<h3 className="text-lg font-medium mb-4">Form Settings</h3>

									<div className="space-y-4">
										<div>
											<Label htmlFor="redirectUrl" className="text-base">
												Redirect URL (Optional)
											</Label>
											<Input
												id="redirectUrl"
												name="redirectUrl"
												value={formConfig.redirectUrl || ""}
												onChange={handleChange}
												placeholder="https://example.com/thank-you"
												className="mt-1"
											/>
											<p className="text-sm text-muted-foreground mt-1">
												Leave blank to show a confirmation message instead
											</p>
										</div>

										<div>
											<Label
												htmlFor="confirmationMessage"
												className="text-base"
											>
												Confirmation Message
											</Label>
											<Textarea
												id="confirmationMessage"
												name="confirmationMessage"
												value={formConfig.confirmationMessage || ""}
												onChange={handleChange}
												placeholder="Thank you for your submission!"
												className="mt-1"
											/>
											<p className="text-sm text-muted-foreground mt-1">
												This message will be shown after form submission if no
												redirect URL is set
											</p>
										</div>

										<div className="flex items-center space-x-2">
											<Switch
												id="emailNotifications"
												checked={formConfig.emailNotifications}
												onCheckedChange={(checked) =>
													handleSwitchChange("emailNotifications", checked)
												}
											/>
											<Label
												htmlFor="emailNotifications"
												className="cursor-pointer text-base"
											>
												Email Notifications
											</Label>
										</div>

										{formConfig.emailNotifications && (
											<div>
												<Label
													htmlFor="notificationEmails"
													className="text-base"
												>
													Notification Emails
												</Label>
												<Textarea
													id="notificationEmails"
													value={
														Array.isArray(formConfig.notificationEmails)
															? formConfig.notificationEmails.join(", ")
															: ""
													}
													onChange={(e) =>
														handleNotificationEmails(e.target.value)
													}
													placeholder="email@example.com, another@example.com"
													className="mt-1"
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
											<Label
												htmlFor="active"
												className="cursor-pointer text-base"
											>
												Form Active
											</Label>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					</TabsContent>

					<div className="flex justify-end gap-2 pt-4">
						<Button
							type="submit"
							disabled={isSubmitting}
							className="flex items-center gap-2"
						>
							{isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
							Save Form
						</Button>
					</div>
				</form>
			</Tabs>

			{/* Preset Confirmation Dialog */}
			<AlertDialog open={showPresetDialog} onOpenChange={setShowPresetDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Apply Form Template?</AlertDialogTitle>
						<AlertDialogDescription>
							Changing the form type will replace your current fields with a
							template for{" "}
							{formConfig.formType === "custom"
								? "a custom form"
								: `a ${formConfig.formType} form`}
							. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={cancelFormTypeChange}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								applyFormTypePreset(formConfig.formType);
								setShowPresetDialog(false);
							}}
						>
							Apply Template
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
