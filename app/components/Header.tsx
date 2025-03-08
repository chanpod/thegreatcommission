import { Link } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export default function Header({
	churchName,
	logoUrl,
	organizationId,
	canViewForms = false,
}: {
	churchName: string;
	logoUrl?: string | null;
	organizationId?: string;
	canViewForms?: boolean;
}) {
	return (
		<header className="border-b primary-bg">
			<div className="container mx-auto px-4 py-4">
				<div className="flex justify-between items-center">
					<div className="flex items-center gap-3">
						{logoUrl && (
							<Avatar>
								<AvatarImage src={logoUrl} alt={`${churchName} logo`} />
								<AvatarFallback>CN</AvatarFallback>
							</Avatar>
						)}
						<h1 className="text-xl font-bold text-white">{churchName}</h1>
					</div>
					<nav className="space-x-4">
						<Link
							to={
								organizationId
									? `/landing/${organizationId}#services`
									: "#services"
							}
							className="text-white/80 hover:text-accent transition-colors"
						>
							Services
						</Link>
						<Link
							to={
								organizationId ? `/landing/${organizationId}#events` : "#events"
							}
							className="text-white/80 hover:text-accent transition-colors"
						>
							Events
						</Link>
						<Link
							to={
								organizationId ? `/landing/${organizationId}#about` : "#about"
							}
							className="text-white/80 hover:text-accent transition-colors"
						>
							About
						</Link>
						{organizationId && (
							<Link
								to={`/landing/${organizationId}/childcheckin`}
								className="text-white/80 hover:text-accent transition-colors"
							>
								Child Check-in
							</Link>
						)}
						{organizationId && canViewForms && (
							<Link
								to={`/churches/${organizationId}/forms`}
								className="text-white/80 hover:text-accent transition-colors"
							>
								Forms
							</Link>
						)}
					</nav>
				</div>
			</div>
		</header>
	);
}
