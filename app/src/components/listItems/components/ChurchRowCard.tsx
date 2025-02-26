import { Link } from "react-router";
import ChurchPlaceholderImage from "~/src/assets/images/placeholderImage1.jpg";
import OrgLocation from "../../organizations/OrgLocation";
import CardButton from "./MissionRowCard";
import type { churchOrganization } from "server/db/schema";

type Props = {
	church: typeof churchOrganization.$inferSelect;
	linkActive?: boolean;
};

export const CardLabel = ({ children }: any) => (
	<label className="text-sm text-gray-500">{children}</label>
);
export const CardLabelData = ({ children }: any) => (
	<span className="text-gray-800">{children}</span>
);

const ChurchRowCard = ({ church, linkActive }: Props) => {
	// Parse theme colors with fallback
	const themeColors = church.themeColors
		? JSON.parse(church.themeColors)
		: { primary: "#3b82f6", secondary: "#1e293b", accent: "#8b5cf6" };

	const card = (
		<div
			className="flex flex-col overflow-hidden rounded-lg shadow-lg border transition-all hover:shadow-xl"
			style={{
				borderColor: `${themeColors.primary}40`, // Adding transparency to the border
			}}
		>
			{/* Banner Image */}
			<div className="relative h-40 overflow-hidden">
				<img
					className="absolute object-cover w-full h-full"
					src={church.churchBannerUrl || ChurchPlaceholderImage}
					alt={`${church.name} banner`}
				/>
				<div
					className="absolute inset-0"
					style={{
						background: `linear-gradient(to bottom, ${themeColors.secondary}00, ${themeColors.secondary}CC)`,
					}}
				/>
			</div>

			{/* Church Info */}
			<div className="flex flex-col p-4 flex-grow">
				<div className="flex items-center mb-3">
					{/* Logo */}
					{church.logoUrl && (
						<div className="mr-3 h-12 w-12 rounded-md overflow-hidden bg-white flex items-center justify-center p-1 border shadow-sm">
							<img
								src={church.logoUrl}
								alt={`${church.name} logo`}
								className="max-h-full max-w-full object-contain"
							/>
						</div>
					)}

					{/* Church Name */}
					<h2
						className="text-xl font-bold truncate"
						style={{ color: themeColors.secondary }}
					>
						{church.name}
					</h2>
				</div>

				{/* Description */}
				{church.description && (
					<p className="text-gray-700 mb-3 line-clamp-2 text-sm">
						{church.description}
					</p>
				)}

				{/* Location */}
				<div className="mt-auto">
					<OrgLocation org={church} />

					{/* Learn More Link */}
					{!linkActive && (
						<Link
							to={`/churches/${church.id}`}
							className="mt-3 inline-block px-4 py-2 rounded-md text-sm font-medium transition-colors"
							style={{
								backgroundColor: `${themeColors.primary}15`, // Very light primary color
								color: themeColors.primary,
							}}
						>
							Learn more
						</Link>
					)}
				</div>
			</div>
		</div>
	);

	return linkActive ? (
		<Link to={`/churches/${church.id}`}>
			<CardButton>{card}</CardButton>
		</Link>
	) : (
		card
	);
};

export default ChurchRowCard;
