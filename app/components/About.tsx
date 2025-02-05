interface AboutProps {
  title: string;
  content: string;
}

export default function About({ title, content }: AboutProps) {
  return (
    <section id="about" className="py-12 bg-gray-100">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">{title}</h2>
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gray-700">{content}</p>
        </div>
      </div>
    </section>
  );
}

