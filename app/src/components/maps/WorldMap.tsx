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

interface Props {
    coordinatesChanged: (coordinates: google.maps.LatLngLiteral) => void;
}

function WorldMap(props: Props) {
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: "AIzaSyCfegy8_oZx8eMWjpQxzM1SpzV1J9IoJ0Y",
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);

    const onLoad = useCallback((map: google.maps.Map) => {
        const myLatlng = { lat: -25.363, lng: 131.044 };
        map.setMapTypeId("satellite");

        // Create the initial InfoWindow.
        let infoWindow = new google.maps.InfoWindow({
            content: "<div style = 'color:black;'>Click the map to get Lat/Lng!</div>",
            position: myLatlng,
        });

        infoWindow.open(map);

        map.addListener("click", (mapsMouseEvent: any) => {
            if (props.coordinatesChanged) {
                props.coordinatesChanged(mapsMouseEvent.latLng.toJSON());
            }
        });
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

export default memo(WorldMap);
