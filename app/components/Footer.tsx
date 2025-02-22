import { Link } from "react-router";
import type { churchOrganization } from "server/db/schema";

interface FooterProps {
	organization: typeof churchOrganization.$inferSelect;
	contactInfo: {
		email: string;
		phone: string;
		address: string;
	};
	content?: string;
	socialLinks?: Record<string, string> | null;
}

export default function Footer({
	organization,
	contactInfo,
	content,
	socialLinks,
}: FooterProps) {
	return (
		<footer className="primary-bg text-white py-12">
			<div className="container mx-auto px-4">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<div>
						<h3 className="text-lg font-semibold mb-4">{organization.name}</h3>
						{content && <p className="text-white/80">{content}</p>}
					</div>
					<div>
						<h3 className="text-lg font-semibold mb-4">Contact</h3>
						<div className="space-y-2 text-white/80">
							<p>{contactInfo.address}</p>
							<p>{contactInfo.phone}</p>
							<p>{contactInfo.email}</p>
						</div>
					</div>
					{socialLinks && Object.keys(socialLinks).length > 0 && (
						<div>
							<h3 className="text-lg font-semibold mb-4">Connect</h3>
							<div className="space-y-2">
								{Object.entries(socialLinks).map(([platform, url]) => (
									<a
										key={platform}
										href={url}
										target="_blank"
										rel="noopener noreferrer"
										className="block text-white/80 hover:text-accent transition-colors"
									>
										{platform}
									</a>
								))}
							</div>
						</div>
					)}
				</div>
				<div className="mt-8 pt-8 border-t border-white/10 text-center text-white/60">
					<p>
						&copy; {new Date().getFullYear()} {organization.name}. All rights
						reserved.
					</p>
				</div>
			</div>
		</footer>
	);
}
