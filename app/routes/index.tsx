import { Outlet, useNavigation } from "@remix-run/react";
import Header from "~/src/components/header/Header";

export default function Index() {
    return (
        <div>
            <h1 className="text-3xl font-bold underline">Hello world!</h1>

            <Outlet />
        </div>
    );
}
