import { rootAuthLoader } from "@clerk/react-router/ssr.server";
import {
	type FileRouter,
	createRouteHandler,
	createUploadthing,
} from "uploadthing/remix";
import { UploadThingError } from "uploadthing/server";
import { AuthService } from "~/services/AuthService";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
const uploadRouter = {
	// Define as many FileRoutes as you like, each with a unique routeSlug
	imageUploader: f({
		image: {
			/**
			 * For full list of options and defaults, see the File Route API reference
			 * @see https://docs.uploadthing.com/file-routes#route-config
			 */
			maxFileSize: "4MB",
			maxFileCount: 1,
		},
	})
		// Set permissions and file types for this FileRoute
		.middleware(async ({ event, req }) => {
			console.log("req", event);
			// This code runs on your server before upload
			return rootAuthLoader(event, async ({ request, params, context }) => {
				const userContext = await AuthService.getAuthenticatedUser(
					request.auth,
				);
				console.log("userId", userContext.user.id);
				// If you throw, the user will not be able to upload
				if (!userContext.user.id) throw new UploadThingError("Unauthorized");

				// Whatever is returned here is accessible in onUploadComplete as `metadata`
				return { userId: userContext.user.id };
			});
		})
		.onUploadComplete(async ({ metadata, file }) => {
			// This code RUNS ON YOUR SERVER after upload
			console.log("Upload complete for userId:", metadata.userId);

			console.log("file url", file.url);

			// !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
			return { uploadedBy: metadata.userId };
		}),

	// New uploader for event photos that allows multiple images
	eventPhotosUploader: f({
		image: {
			maxFileSize: "4MB",
			maxFileCount: 10, // Allow up to 10 photos
		},
	})
		.middleware(async ({ event, req }) => {
			// This code runs on your server before upload
			return rootAuthLoader(event, async ({ request, params, context }) => {
				const userContext = await AuthService.getAuthenticatedUser(
					request.auth,
				);

				// If you throw, the user will not be able to upload
				if (!userContext.user.id) throw new UploadThingError("Unauthorized");

				// Whatever is returned here is accessible in onUploadComplete as `metadata`
				return { userId: userContext.user.id };
			});
		})
		.onUploadComplete(async ({ metadata, file }) => {
			// This code RUNS ON YOUR SERVER after upload
			console.log("Event photo upload complete for userId:", metadata.userId);
			console.log("file url", file.url);

			// Return the file URL and metadata
			return { uploadedBy: metadata.userId, url: file.url };
		}),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;

const handlers = createRouteHandler({
	router: uploadRouter,

	// Apply an (optional) custom config:
	// config: { ... },
});

export const loader = handlers.loader;
export const action = handlers.action;
