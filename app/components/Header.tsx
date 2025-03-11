import { Link } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Menu, X } from "lucide-react";
import { useState } from "react";

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
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	return (
		<header className="border-b primary-bg">
			<div className="container mx-auto px-4 py-4">
				<div className="flex justify-between items-center">
					<div className="flex items-center gap-3">
						<Link to={`/landing/${organizationId}`}>
							{logoUrl && (
								<Avatar>
									<AvatarImage src={logoUrl} alt={`${churchName} logo`} />
									<AvatarFallback>CN</AvatarFallback>
								</Avatar>
							)}
							<h1 className="text-xl font-bold text-white">{churchName}</h1>
						</Link>
					</div>

					{/* Desktop Navigation */}
					<nav className="hidden md:flex space-x-4">
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

					{/* Mobile Menu Button */}
					<button
						className="md:hidden text-white p-2"
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						aria-label="Toggle menu"
					>
						{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
					</button>
				</div>

				{/* Mobile Navigation */}
				{mobileMenuOpen && (
					<nav className="md:hidden py-4 flex flex-col space-y-4">
						<Link
							to={
								organizationId
									? `/landing/${organizationId}#services`
									: "#services"
							}
							className="text-white/80 hover:text-accent transition-colors block py-2"
							onClick={() => setMobileMenuOpen(false)}
						>
							Services
						</Link>
						<Link
							to={
								organizationId ? `/landing/${organizationId}#events` : "#events"
							}
							className="text-white/80 hover:text-accent transition-colors block py-2"
							onClick={() => setMobileMenuOpen(false)}
						>
							Events
						</Link>
						<Link
							to={
								organizationId ? `/landing/${organizationId}#about` : "#about"
							}
							className="text-white/80 hover:text-accent transition-colors block py-2"
							onClick={() => setMobileMenuOpen(false)}
						>
							About
						</Link>
						{organizationId && (
							<Link
								to={`/landing/${organizationId}/childcheckin`}
								className="text-white/80 hover:text-accent transition-colors block py-2"
								onClick={() => setMobileMenuOpen(false)}
							>
								Child Check-in
							</Link>
						)}
						{organizationId && canViewForms && (
							<Link
								to={`/churches/${organizationId}/forms`}
								className="text-white/80 hover:text-accent transition-colors block py-2"
								onClick={() => setMobileMenuOpen(false)}
							>
								Forms
							</Link>
						)}
					</nav>
				)}
			</div>
		</header>
	);
}
