import { ReactComponentElement, Ref, useEffect, useState } from "react";

export function useClickOutside(ref: any) {
    const [outsideClicked, setOutsideClicked] = useState(false);

    useEffect(() => {
        /**
         * Alert if clicked on outside of element
         */
        function handleClickOutside(event) {
            if (ref.current && !ref.current.contains(event.target)) {
                setOutsideClicked(true);

                setTimeout(() => {
                    setOutsideClicked(false);
                }, 200);
            }
        }
        // Bind the event listener
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            // Unbind the event listener on clean up
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [ref]);

    return outsideClicked;
}
