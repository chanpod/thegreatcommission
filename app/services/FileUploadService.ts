import { v4 as uuidv4 } from "uuid";

/**
 * Service for handling file uploads
 * This is a simple implementation that converts data URLs to base64 strings
 * In a production environment, you would likely use a cloud storage service like AWS S3
 */
export class FileUploadService {
	/**
	 * Upload a file from a data URL
	 * @param dataUrl The data URL of the file
	 * @param prefix A prefix for the filename
	 * @returns The URL of the uploaded file
	 */
	async uploadFromDataUrl(
		dataUrl: string,
		prefix: string = "upload",
	): Promise<string> {
		if (!dataUrl || !dataUrl.startsWith("data:")) {
			throw new Error("Invalid data URL");
		}

		try {
			// In a real-world scenario, you would upload this to a storage service
			// For now, we'll just return the data URL with a unique ID
			// This simulates storing the image and returning a URL

			// Generate a unique ID for the file
			const fileId = uuidv4();
			const fileName = `${prefix}-${fileId}`;

			// In a real implementation, you would:
			// 1. Convert the data URL to a file
			// 2. Upload the file to a storage service
			// 3. Return the URL of the uploaded file

			// For now, we'll just return the data URL
			// In production, replace this with actual file storage logic
			return dataUrl;
		} catch (error) {
			console.error("Error uploading file:", error);
			throw new Error("Failed to upload file");
		}
	}

	/**
	 * Upload a child photo from a File object
	 * @param file The File object
	 * @param organizationId The ID of the organization
	 * @param filename The desired filename
	 * @returns The URL of the uploaded file
	 */
	static async uploadChildPhoto(
		file: File,
		organizationId: string,
		filename: string
	): Promise<string> {
		try {
			// Convert File to data URL
			const dataUrl = await this.fileToDataUrl(file);
			
			// In a real-world scenario, you would upload this to a storage service
			// For now, we'll just return the data URL with the filename
			
			// Format a safe filename
			const safeFilename = filename.replace(/[^a-z0-9]/gi, '-').toLowerCase();
			
			// In a real implementation, you would:
			// 1. Upload the file to a storage service
			// 2. Return the URL of the uploaded file
			
			// For demonstration, return a simulated URL path
			// In production, replace this with actual file storage logic
			return dataUrl;
		} catch (error) {
			console.error("Error uploading child photo:", error);
			return "";
		}
	}
	
	/**
	 * Convert a File object to a data URL
	 * @param file The File object
	 * @returns A Promise that resolves to the data URL
	 */
	private static fileToDataUrl(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	}
}

export const fileUploadService = new FileUploadService();
