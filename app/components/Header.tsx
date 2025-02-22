import { Link } from "react-router";

export default function Header({ churchName }: { churchName: string }) {
	return (
		<header className="border-b primary-bg">
			<div className="container mx-auto px-4 py-4">
				<div className="flex justify-between items-center">
					<h1 className="text-xl font-bold text-white">{churchName}</h1>
					<nav className="space-x-4">
						<a
							href="#services"
							className="text-white/80 hover:text-accent transition-colors"
						>
							Services
						</a>
						<a
							href="#events"
							className="text-white/80 hover:text-accent transition-colors"
						>
							Events
						</a>
						<a
							href="#about"
							className="text-white/80 hover:text-accent transition-colors"
						>
							About
						</a>
					</nav>
				</div>
			</div>
		</header>
	);
}
