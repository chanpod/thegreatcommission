import { useParams } from "react-router";
import { Outlet } from "react-router";
import { Badge } from "~/components/ui/badge";
import { UsersIcon, CalendarIcon } from "lucide-react";

export default function ChildCheckinLayout() {
	const { organization } = useParams();

	return (
		<div className="container mx-auto py-8">
			<Outlet />
		</div>
	);
}
