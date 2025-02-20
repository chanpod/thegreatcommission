interface HeroProps {
	imageUrl: string;
	headline: string;
	subheadline: string;
}

export default function Hero({ imageUrl, headline, subheadline }: HeroProps) {
	return (
		<div className="relative h-96 max-h-[500px] overflow-hidden">
			<img src={imageUrl} alt="Church banner" style={{ objectFit: "cover" }} />
			<div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-center items-center text-white">
				<h2 className="text-4xl font-bold mb-2">{headline}</h2>
				<p className="text-xl">{subheadline}</p>
			</div>
		</div>
	);
}
