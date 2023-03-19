import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { memo, useCallback, useState } from "react";

const containerStyle = {
    width: "100%",
    height: "800px",
};

const center = {
    lat: -3.745,
    lng: -38.523,
};

function MyComponent() {
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: "AIzaSyCfegy8_oZx8eMWjpQxzM1SpzV1J9IoJ0Y",
    });

    const [map, setMap] = useState(null);

    const onLoad = useCallback(function callback(map) {
        // This is just an example of getting and using the map instance!!! don't just blindly copy!
        const bounds = new window.google.maps.LatLngBounds(center);
        map.fitBounds(bounds);
        map.zoom = 15
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map) {
        setMap(null);
    }, []);

    return isLoaded ? (
        <GoogleMap mapContainerStyle={containerStyle} zoom={21} onLoad={onLoad} onUnmount={onUnmount}>
            
        </GoogleMap>
    ) : (
        <></>
    );
}

export default memo(MyComponent);
