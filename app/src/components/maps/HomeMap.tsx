import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { memo, useCallback, useState } from "react";

const containerStyle = {
    width: "100%",
    height: "800px",
};
// 36.823832, -40.641859
const center = {
    lng: -40.641,
    lat: 36.823,
} as google.maps.LatLngLiteral;

function MyComponent() {
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: "AIzaSyCfegy8_oZx8eMWjpQxzM1SpzV1J9IoJ0Y",
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);

    const onLoad = useCallback((map: google.maps.Map) => {
        map.setMapTypeId("satellite");
    }, []);

    const onUnmount = useCallback((map: google.maps.Map) => {
        setMap(null);
    }, []);

    return isLoaded ? (
        <GoogleMap
            mapContainerStyle={containerStyle}
            zoom={3}
            center={center}
            options={{
                streetViewControl: false,
                mapTypeControl: false,
            }}
            mapTypeId="satellite"
            onLoad={onLoad}
            onUnmount={onUnmount}
        >
            <></>
        </GoogleMap>
    ) : (
        <></>
    );
}

export default memo(MyComponent);
