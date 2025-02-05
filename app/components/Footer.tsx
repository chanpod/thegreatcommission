import { Link } from "react-router";
import type { churchOrganization } from "server/db/schema";

interface FooterProps {
  organization: typeof churchOrganization.$inferSelect;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  content?: string;
  socialLinks?: Record<string, string> | null;
}

export default function Footer({ organization, contactInfo, content, socialLinks }: FooterProps) {
  return (
    <footer id="contact" className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">Contact Us</h3>
            <div className="space-y-2">
              <p>{contactInfo.address}</p>
              <p>Email: {contactInfo.email}</p>
              <p>Phone: {contactInfo.phone}</p>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to={`/churches/${organization.id}/events`}
                  className="hover:text-gray-300"
                >
                  Events
                </Link>
              </li>
              <li>
                <Link
                  to={`/churches/${organization.id}/missions`}
                  className="hover:text-gray-300"
                >
                  Missions
                </Link>
              </li>
              <li>
                <Link
                  to={`/churches/${organization.id}/members`}
                  className="hover:text-gray-300"
                >
                  Members
                </Link>
              </li>
            </ul>
          </div>
          <div>
            {content && (
              <div className="text-gray-300 mb-4">
                <p>{content}</p>
              </div>
            )}
            {socialLinks && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Connect With Us</h3>
                <div className="flex space-x-4">
                  {Object.entries(socialLinks).map(([platform, url]) => (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-gray-300"
                    >
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="mt-8 text-center">
          <p>&copy; {new Date().getFullYear()} {organization.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

