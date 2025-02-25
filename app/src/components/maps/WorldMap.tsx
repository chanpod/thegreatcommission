import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { memo, useCallback, useState } from "react";

const containerStyle = {
	width: "100%",
	height: "800px",
};
// 36.823832, -40.641859
const defaultCenter = {
	lng: -40.641,
	lat: 36.823,
} as google.maps.LatLngLiteral;

interface Props {
	coordinatesChanged?: (coordinates: google.maps.LatLngLiteral) => void;
	pins?: google.maps.LatLngLiteral[];
	googleMapsApiKey: string;
	initialCenter?: google.maps.LatLngLiteral;
	initialZoom?: number;
}

function WorldMap(props: Props) {
	const { isLoaded } = useJsApiLoader({
		id: "google-map-script",
		googleMapsApiKey: props.googleMapsApiKey,
	});

	const [map, setMap] = useState<google.maps.Map | null>(null);

	const onLoad = useCallback(
		(map: google.maps.Map) => {
			const myLatlng = { lat: -25.363, lng: 131.044 };

			map.addListener("click", (mapsMouseEvent: google.maps.MapMouseEvent) => {
				if (props.coordinatesChanged) {
					props.coordinatesChanged(mapsMouseEvent.latLng.toJSON());
				}
			});
		},
		[props.coordinatesChanged],
	);

	const onUnmount = useCallback((map: google.maps.Map) => {
		setMap(null);
	}, []);

	// Determine center: use initialCenter if provided, otherwise use first pin or default center
	const center =
		props.initialCenter || (props.pins?.[0] ? props.pins[0] : defaultCenter);

	// Determine zoom level: use initialZoom if provided, otherwise use default (3)
	const zoom = props.initialZoom || 3;

	if (!isLoaded) return <></>;

	return (
		<GoogleMap
			mapContainerStyle={containerStyle}
			zoom={zoom}
			center={center}
			options={{
				streetViewControl: false,
				mapTypeControl: false,
			}}
			onLoad={onLoad}
			onUnmount={onUnmount}
		>
			{props.pins?.map((pin, i) => (
				<Marker key={`marker-${i}-${pin.lat}-${pin.lng}`} position={pin} />
			))}
		</GoogleMap>
	);
}

export default memo(WorldMap);
