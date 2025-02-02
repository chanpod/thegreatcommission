import { Link } from "react-router";


export default function Header({ churchName }: { churchName: string }) {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">{churchName}</h1>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link to="#services" className="text-gray-600 hover:text-gray-800">
                Services
              </Link>
            </li>
            <li>
              <Link to="#events" className="text-gray-600 hover:text-gray-800">
                Events
              </Link>
            </li>
            <li>
              <Link to="#about" className="text-gray-600 hover:text-gray-800">
                About
              </Link>
            </li>
            <li>
              <Link to="#contact" className="text-gray-600 hover:text-gray-800">
                Contact
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

