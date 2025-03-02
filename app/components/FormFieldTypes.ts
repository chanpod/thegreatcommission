export enum FormFieldType {
	TEXT = "text",
	EMAIL = "email",
	PHONE = "phone",
	TEXTAREA = "textarea",
	NUMBER = "number",
	DATE = "date",
	SELECT = "select",
	RADIO = "radio",
	CHECKBOX = "checkbox",
}

export interface FormFieldOption {
	label: string;
	value: string;
}

export interface FormField {
	id: string;
	name: string;
	label: string;
	type: FormFieldType | string;
	placeholder?: string;
	required: boolean;
	defaultValue?: string;
	options?: FormFieldOption[];
}

export interface FormConfig {
	id?: string;
	churchOrganizationId?: string;
	name: string;
	formType: string;
	fields: FormField[];
	redirectUrl?: string;
	emailNotifications: boolean;
	notificationEmails?: string[];
	confirmationMessage?: string;
	active: boolean;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface FormSubmission {
	id: string;
	formConfigId: string;
	submissionData: Record<string, any>;
	submitterEmail?: string;
	submitterName?: string;
	createdAt: Date;
	viewed: boolean;
	archived: boolean;
	notes?: string;
}

export const DEFAULT_CONTACT_FORM: Omit<
	FormConfig,
	"id" | "churchOrganizationId"
> = {
	name: "Contact Us",
	formType: "contact",
	fields: [
		{
			id: "name",
			name: "name",
			label: "Name",
			type: "text",
			placeholder: "Your Name",
			required: true,
		},
		{
			id: "email",
			name: "email",
			label: "Email",
			type: "email",
			placeholder: "Your Email",
			required: true,
		},
		{
			id: "phone",
			name: "phone",
			label: "Phone",
			type: "phone",
			placeholder: "Your Phone Number",
		},
		{
			id: "message",
			name: "message",
			label: "Message",
			type: "textarea",
			placeholder: "How can we help you?",
			required: true,
		},
	],
	emailNotifications: true,
	active: true,
	confirmationMessage:
		"Thank you for contacting us! We will get back to you as soon as possible.",
};

export const DEFAULT_PRAYER_REQUEST_FORM: Omit<
	FormConfig,
	"id" | "churchOrganizationId"
> = {
	name: "Prayer Request",
	formType: "prayer",
	fields: [
		{
			id: "name",
			name: "name",
			label: "Name",
			type: "text",
			placeholder: "Your Name",
			required: true,
		},
		{
			id: "email",
			name: "email",
			label: "Email",
			type: "email",
			placeholder: "Your Email",
			required: true,
		},
		{
			id: "prayerRequest",
			name: "prayerRequest",
			label: "Prayer Request",
			type: "textarea",
			placeholder: "How can we pray for you?",
			required: true,
		},
		{
			id: "keepPrivate",
			name: "keepPrivate",
			label: "Keep this request private",
			type: "checkbox",
			defaultValue: "false",
		},
	],
	emailNotifications: true,
	active: true,
	confirmationMessage:
		"Thank you for your prayer request. Our prayer team will be praying for you.",
};

export const DEFAULT_FIRST_TIME_VISITOR_FORM: Omit<
	FormConfig,
	"id" | "churchOrganizationId"
> = {
	name: "First Time Visitor",
	formType: "first-time",
	fields: [
		{
			id: "name",
			name: "name",
			label: "Name",
			type: "text",
			placeholder: "Your Name",
			required: true,
		},
		{
			id: "email",
			name: "email",
			label: "Email",
			type: "email",
			placeholder: "Your Email",
			required: true,
		},
		{
			id: "phone",
			name: "phone",
			label: "Phone",
			type: "phone",
			placeholder: "Your Phone Number",
		},
		{
			id: "howDidYouHear",
			name: "howDidYouHear",
			label: "How did you hear about us?",
			type: "select",
			options: [
				{ label: "Friend/Family", value: "friend" },
				{ label: "Social Media", value: "social" },
				{ label: "Search Engine", value: "search" },
				{ label: "Drove By", value: "drove_by" },
				{ label: "Other", value: "other" },
			],
		},
		{
			id: "interests",
			name: "interests",
			label: "I'm interested in learning more about:",
			type: "checkbox",
			options: [
				{ label: "Worship Services", value: "worship" },
				{ label: "Children's Ministry", value: "children" },
				{ label: "Youth Ministry", value: "youth" },
				{ label: "Small Groups", value: "small_groups" },
				{ label: "Volunteering", value: "volunteering" },
			],
		},
		{
			id: "message",
			name: "message",
			label: "Anything else you'd like us to know?",
			type: "textarea",
		},
	],
	emailNotifications: true,
	active: true,
	confirmationMessage:
		"Thank you for letting us know you visited! We look forward to seeing you again.",
};
