const events = [
  { name: "Community Picnic", date: "July 15, 2023", time: "12:00 PM" },
  { name: "Youth Camp", date: "August 1-5, 2023", time: "All Day" },
  { name: "Christmas Concert", date: "December 18, 2023", time: "7:00 PM" },
]

export default function Events() {
  return (
    <section id="events" className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Upcoming Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map((event, index) => (
            <div key={index} className="bg-gray-100 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">{event.name}</h3>
              <p className="text-gray-600">{event.date}</p>
              <p className="text-gray-800 mt-2">{event.time}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

