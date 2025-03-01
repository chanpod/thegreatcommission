import { Container } from "./Container";
import { ContactFormDialog } from "./ContactFormDialog";

interface ContactSectionProps {
	title?: string;
	description?: string;
	buttonText?: string;
	churchId: string;
	backgroundColor?: string;
	textColor?: string;
}

export function ContactSection({
	title = "Get In Touch",
	description = "Have questions or want to learn more about our church? We'd love to hear from you!",
	buttonText = "Contact Us",
	churchId,
	backgroundColor = "#f9fafb", // Default to gray-50
	textColor = "#1f2937", // Default to gray-800
}: ContactSectionProps) {
	const sectionStyle = {
		backgroundColor: backgroundColor || "#f9fafb",
		color: textColor || "#1f2937",
	};

	return (
		<section className="py-12" style={sectionStyle}>
			<Container>
				<div className="text-center">
					<h2 className="text-3xl font-bold mb-6" style={{ color: textColor }}>
						{title}
					</h2>
					<p
						className="text-lg mb-8 max-w-2xl mx-auto"
						style={{ color: textColor }}
					>
						{description}
					</p>
					<ContactFormDialog
						buttonText={buttonText}
						churchId={churchId}
						buttonSize="lg"
					/>
				</div>
			</Container>
		</section>
	);
}
