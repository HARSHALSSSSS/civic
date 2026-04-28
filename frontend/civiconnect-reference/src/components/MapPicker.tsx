import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet + Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
  initialLocation?: { lat: number; lng: number };
  onLocationSelect: (lat: number; lng: number) => void;
}

function LocationMarker({ location, setLocation, onLocationSelect }: { 
  location: { lat: number; lng: number }, 
  setLocation: (loc: { lat: number; lng: number }) => void,
  onLocationSelect: (lat: number; lng: number) => void 
}) {
  const map = useMapEvents({
    click(e) {
      const newLoc = { lat: e.latlng.lat, lng: e.latlng.lng };
      setLocation(newLoc);
      onLocationSelect(newLoc.lat, newLoc.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return location === null ? null : (
    <Marker 
      position={[location.lat, location.lng]} 
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const position = marker.getLatLng();
          setLocation({ lat: position.lat, lng: position.lng });
          onLocationSelect(position.lat, position.lng);
        },
      }}
    />
  );
}

// Component to recenter map when initialLocation changes
function RecenterMap({ location }: { location: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.setView([location.lat, location.lng], map.getZoom());
    }
  }, [location, map]);
  return null;
}

export const MapPicker = ({ initialLocation, onLocationSelect }: MapPickerProps) => {
  const [location, setLocation] = useState<{ lat: number; lng: number }>(
    initialLocation || { lat: -1.286389, lng: 36.817223 } // Default to Nairobi
  );

  return (
    <div className="h-[300px] w-full rounded-md overflow-hidden border border-input">
      <MapContainer
        center={[location.lat, location.lng]}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker location={location} setLocation={setLocation} onLocationSelect={onLocationSelect} />
        <RecenterMap location={location} />
      </MapContainer>
    </div>
  );
};
