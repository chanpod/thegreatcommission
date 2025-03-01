import { db } from "@/server/db/dbConnection";
import {
	formConfig as formConfigTable,
	formSubmission as formSubmissionTable,
} from "server/db/schema";
import { eq, desc, and } from "drizzle-orm";
import type { FormConfig } from "~/components/FormFieldTypes";
import { v4 as uuidv4 } from "uuid";

/**
 * Service for managing form configurations and submissions
 */
export const FormService = {
	/**
	 * Get all form configurations for a church
	 */
	async getFormConfigs(
		customDb = db,
		filters?: { churchId?: string; type?: string; activeOnly?: boolean },
	) {
		let query = customDb.select().from(formConfigTable);

		if (filters?.churchId) {
			query = query.where(
				eq(formConfigTable.churchOrganizationId, filters.churchId),
			);
		}

		if (filters?.type) {
			query = query.where(eq(formConfigTable.formType, filters.type));
		}

		if (filters?.activeOnly) {
			query = query.where(eq(formConfigTable.active, true));
		}

		return query.orderBy(desc(formConfigTable.updatedAt));
	},

	/**
	 * Get a single form configuration by ID
	 */
	async getFormConfigById(formId) {
		const result = await db
			.select()
			.from(formConfigTable)
			.where(eq(formConfigTable.id, formId));

		return result.length > 0 ? result[0] : null;
	},

	/**
	 * Create a new form configuration
	 */
	async createFormConfig(churchId, formData) {
		const formId = uuidv4();
		const now = new Date();

		await db.insert(formConfigTable).values({
			churchOrganizationId: churchId,
			name: formData.name,
			formFields: JSON.stringify(formData.fields),
			formType: formData.formType,
			redirectUrl: formData.redirectUrl || null,
			emailNotifications: formData.emailNotifications,
			notificationEmails: formData.notificationEmails?.join(",") || null,
			confirmationMessage: formData.confirmationMessage || null,
			active: formData.active,
		});

		return formId;
	},

	/**
	 * Update an existing form configuration
	 */
	async updateFormConfig(formId, formData) {
		await db
			.update(formConfigTable)
			.set({
				name: formData.name,
				formFields: JSON.stringify(formData.fields),
				formType: formData.formType,
				redirectUrl: formData.redirectUrl || null,
				emailNotifications: formData.emailNotifications,
				notificationEmails: formData.notificationEmails?.join(",") || null,
				confirmationMessage: formData.confirmationMessage || null,
				active: formData.active,
			})
			.where(eq(formConfigTable.id, formId));

		return formId;
	},

	/**
	 * Delete a form configuration
	 */
	async deleteFormConfig(formId) {
		// First delete all submissions for this form
		await db
			.delete(formSubmissionTable)
			.where(eq(formSubmissionTable.formConfigId, formId));

		// Then delete the form config
		await db.delete(formConfigTable).where(eq(formConfigTable.id, formId));

		return true;
	},

	/**
	 * Create a new form submission
	 */
	async createFormSubmission(
		formId,
		churchId,
		submissionData,
		submitterEmail,
		submitterName,
	) {
		const submissionId = uuidv4();

		await db.insert(formSubmissionTable).values({
			formConfigId: formId,
			churchOrganizationId: churchId,
			submissionData: JSON.stringify(submissionData),
			submitterEmail: submitterEmail || null,
			submitterName: submitterName || null,
			viewed: false,
			archived: false,
			notes: null,
		});

		return submissionId;
	},

	/**
	 * Get submissions for a form
	 */
	async getFormSubmissions(customDb = db, formId) {
		return customDb
			.select()
			.from(formSubmissionTable)
			.where(eq(formSubmissionTable.formConfigId, formId))
			.orderBy(desc(formSubmissionTable.createdAt));
	},

	/**
	 * Get all submissions for a church
	 */
	async getAllSubmissions(churchId) {
		return db
			.select()
			.from(formSubmissionTable)
			.where(eq(formSubmissionTable.churchOrganizationId, churchId))
			.orderBy(desc(formSubmissionTable.createdAt));
	},

	/**
	 * Mark a submission as viewed
	 */
	async markSubmissionViewed(submissionId, viewed = true) {
		await db
			.update(formSubmissionTable)
			.set({ viewed })
			.where(eq(formSubmissionTable.id, submissionId));
	},

	/**
	 * Archive a submission
	 */
	async archiveSubmission(submissionId, archived = true) {
		await db
			.update(formSubmissionTable)
			.set({ archived })
			.where(eq(formSubmissionTable.id, submissionId));
	},

	/**
	 * Add notes to a submission
	 */
	async addSubmissionNotes(submissionId, notes) {
		await db
			.update(formSubmissionTable)
			.set({ notes })
			.where(eq(formSubmissionTable.id, submissionId));
	},

	/**
	 * Delete a submission
	 */
	async deleteSubmission(submissionId) {
		await db
			.delete(formSubmissionTable)
			.where(eq(formSubmissionTable.id, submissionId));
	},
};
