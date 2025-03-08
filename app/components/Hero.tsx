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
