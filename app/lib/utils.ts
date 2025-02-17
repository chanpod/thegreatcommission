import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function stripHtml(html: string) {
	// Basic HTML stripping for text content
	return html?.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ") || "";
}

export function formatDescription(html: string) {
	// Convert HTML line breaks and paragraphs to newlines
	return stripHtml(html)
		.split(/(?:<br\s*\/?>\s*|\n|<\/p>\s*<p>)/)
		.filter((line) => line.trim())
		.join("\n\n");
}
