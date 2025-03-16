import { data } from "react-router";
import { UTApi } from "uploadthing/server";
import { createAuthLoader } from "~/server/auth/authLoader";

// Initialize the UploadThing API client
const utapi = new UTApi();

export const action = createAuthLoader(
	async ({ request, params, userContext }) => {
		if (!userContext?.user?.id) {
			return data({ success: false, error: "Unauthorized" }, { status: 401 });
		}

		try {
			// Get the image URL from the request body
			const body = await request.json();
			const { imageUrl } = body;

			if (!imageUrl) {
				return data(
					{ success: false, error: "No image URL provided" },
					{ status: 400 },
				);
			}

			// Extract the file key from the URL
			// UploadThing URLs typically look like: https://uploadthing.com/f/[file-key]
			const fileKey = imageUrl.split("/").pop();

			if (!fileKey) {
				return data(
					{ success: false, error: "Invalid image URL" },
					{ status: 400 },
				);
			}

			// Delete the file from UploadThing
			await utapi.deleteFiles(fileKey);

			return data({ success: true }, { status: 200 });
		} catch (error) {
			console.error("Error deleting file from UploadThing:", error);
			return data(
				{ success: false, error: "Failed to delete image" },
				{ status: 500 },
			);
		}
	},
	true, // Require authentication
);
