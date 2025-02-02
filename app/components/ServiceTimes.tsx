const services = [
  { day: "Sunday", time: "9:00 AM", name: "Morning Worship" },
  { day: "Sunday", time: "11:00 AM", name: "Contemporary Service" },
  { day: "Wednesday", time: "7:00 PM", name: "Bible Study" },
]

export default function ServiceTimes() {
  return (
    <section id="services" className="py-12 bg-gray-100">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Service Times</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2">{service.day}</h3>
              <p className="text-gray-600">{service.time}</p>
              <p className="text-gray-800 mt-2">{service.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

