interface AboutProps {
	title: string;
	content: string;
}

export default function About({ title, content }: AboutProps) {
	return (
		<section className="py-12">
			<div className="container">
				<h2 className="text-2xl font-bold mb-6">{title}</h2>
				<div
					className="prose max-w-none"
					dangerouslySetInnerHTML={{ __html: content }}
				/>
			</div>
		</section>
	);
}
