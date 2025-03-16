import { google } from "googleapis";

export class LiveStreamService {
	private youtube;
	private apiKey: string;
	private referer: string;

	constructor(apiKey: string, referer = "https://thegreatcommission.org") {
		this.youtube = google.youtube("v3");
		this.apiKey = apiKey;
		this.referer = referer;
	}

	/**
	 * Extract channel ID from various YouTube URL formats
	 */
	private getChannelHandle(url: string): string | null {
		const match = url.match(/@([^/]+)/);
		return match ? match[1] : null;
	}

	/**
	 * Check if a YouTube channel is currently live
	 */
	async isStreamLive(url: string): Promise<boolean> {
		try {
			const channelHandle = this.getChannelHandle(url);
			if (!channelHandle) return false;

			// First get the channel ID from the handle
			const channelResponse = await this.youtube.search.list({
				key: this.apiKey,
				part: ["snippet"],
				q: channelHandle,
				type: ["channel"],
				maxResults: 1,
				headers: {
					Referer: this.referer,
				},
			});

			const channelId = channelResponse.data.items?.[0]?.snippet?.channelId;
			if (!channelId) return false;

			// Then search for live streams on this channel
			const response = await this.youtube.search.list({
				key: this.apiKey,
				part: ["snippet"],
				channelId: channelId,
				eventType: "live",
				type: ["video"],
				maxResults: 1,
				headers: {
					Referer: this.referer,
				},
			});

			// If we find any live streams, the channel is live
			return (response.data.items?.length ?? 0) > 0;
		} catch (error) {
			console.error("Error checking live stream status:", error);
			console.error("URL attempted:", url);
			return false;
		}
	}
}
