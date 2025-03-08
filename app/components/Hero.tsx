interface HeroProps {
	imageUrl: string;
	headline: string;
	subheadline: string;
	imagePosition?: "center" | "top" | "bottom" | "left" | "right";
	imageObjectFit?: "cover" | "contain" | "fill";
	overlayOpacity?: number;
	height?: string;
}

export default function Hero({
	imageUrl,
	headline,
	subheadline,
	imagePosition = "center",
	imageObjectFit = "cover",
	overlayOpacity = 0.5,
	height = "500px",
}: HeroProps) {
	// Create object-position string based on imagePosition
	const getObjectPosition = () => {
		switch (imagePosition) {
			case "top":
				return "center top";
			case "bottom":
				return "center bottom";
			case "left":
				return "left center";
			case "right":
				return "right center";
			default:
				return "center center";
		}
	};

	return (
		<div className="relative overflow-hidden" style={{ height }}>
			<div className="absolute inset-0">
				<img
					src={imageUrl}
					alt="Church banner"
					className="w-full h-full"
					style={{
						objectFit: imageObjectFit,
						objectPosition: getObjectPosition(),
					}}
				/>
			</div>
			<div
				className="absolute inset-0 flex flex-col justify-center items-center text-white px-4 text-center"
				style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }}
			>
				{/* Decorative SVG elements - top right */}
				<div className="absolute top-0 right-0 w-64 h-64 opacity-20 text-white pointer-events-none overflow-hidden">
					<svg className="w-full h-full float-animation" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
						<path
							fill="currentColor"
							d="M42.8,-65.2C54.9,-56.3,63.7,-43.2,70.1,-28.7C76.4,-14.2,80.3,1.8,76.7,16.2C73.1,30.6,62,43.4,48.8,53.5C35.6,63.6,20.3,71,3.1,68.1C-14.1,65.2,-33.2,52,-45.9,37.4C-58.6,22.8,-64.9,6.8,-64.2,-9.1C-63.5,-25,-55.8,-40.8,-44.1,-50.1C-32.4,-59.4,-16.2,-62.2,-0.2,-61.9C15.8,-61.7,30.7,-74.1,42.8,-65.2Z"
							transform="translate(100 100)"
							className="animate-pulse"
							style={{ animationDuration: '8s' }}
						/>
					</svg>
				</div>

				{/* Decorative SVG elements - bottom left */}
				<div className="absolute bottom-0 left-0 w-64 h-64 opacity-20 text-white pointer-events-none overflow-hidden">
					<svg className="w-full h-full float-animation" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{ animationDelay: '2s' }}>
						<path
							fill="currentColor"
							d="M39.9,-51.6C50.4,-42.8,56.9,-28.9,59.5,-14.7C62.1,-0.5,60.8,13.9,54.4,25.4C48,36.9,36.5,45.5,23.4,52.2C10.3,58.9,-4.4,63.7,-17.4,60.8C-30.4,57.9,-41.7,47.3,-49.4,34.9C-57.1,22.5,-61.2,8.3,-60.2,-5.6C-59.2,-19.5,-53.1,-33.1,-42.9,-42C-32.7,-50.9,-18.4,-55.1,-2.7,-52.1C12.9,-49.1,29.4,-60.4,39.9,-51.6Z"
							transform="translate(100 100)"
							className="animate-pulse"
							style={{ animationDuration: '10s' }}
						/>
					</svg>
				</div>

				{/* Animated light rays */}
				<div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
					<svg className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-full" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
						<g className="animate-pulse" style={{ transformOrigin: 'center', animationDuration: '15s' }}>
							<line x1="400" y1="0" x2="400" y2="600" stroke="white" strokeWidth="1" strokeOpacity="0.3" />
							<line x1="0" y1="300" x2="800" y2="300" stroke="white" strokeWidth="1" strokeOpacity="0.3" />
							<line x1="0" y1="0" x2="800" y2="600" stroke="white" strokeWidth="1" strokeOpacity="0.3" />
							<line x1="800" y1="0" x2="0" y2="600" stroke="white" strokeWidth="1" strokeOpacity="0.3" />
						</g>
					</svg>
				</div>

				<h2 className="text-4xl md:text-5xl font-bold mb-4 max-w-3xl relative z-10 reveal-on-scroll">
					{headline}
				</h2>
				<p className="text-xl md:text-2xl max-w-2xl relative z-10 reveal-on-scroll">
					{subheadline}
				</p>
			</div>
		</div>
	);
}
