import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
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
    coordinatesChanged?: (coordinates: google.maps.LatLngLiteral) => void;
    pins?: google.maps.LatLngLiteral[];
    googleMapsApiKey: string;
}

function WorldMap(props: Props) {
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: props.googleMapsApiKey,
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);

    const onLoad = useCallback((map: google.maps.Map) => {
        const myLatlng = { lat: -25.363, lng: 131.044 };

        

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
            center={props.pins && props.pins[0] ? props.pins[0] : center}
            options={{
                streetViewControl: false,
                mapTypeControl: false,
            }}
            
            onLoad={onLoad}
            onUnmount={onUnmount}
        >
            {props.pins?.map((pin, index) => (
                <Marker key={index} position={pin} />
            ))}
        </GoogleMap>
    ) : (
        <></>
    );
}

export default memo(WorldMap);
