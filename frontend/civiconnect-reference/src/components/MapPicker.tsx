import { useEffect, useState } from "react";
import { MapPin, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MapPickerProps {
  initialLocation?: { lat: number; lng: number };
  onLocationSelect: (lat: number, lng: number) => void;
}

const DEFAULT_LOCATION = { lat: 28.6139, lng: 77.209 };

export const MapPicker = ({ initialLocation, onLocationSelect }: MapPickerProps) => {
  const [location, setLocation] = useState<{ lat: number; lng: number }>(
    initialLocation || DEFAULT_LOCATION
  );

  useEffect(() => {
    if (initialLocation) {
      setLocation(initialLocation);
    }
  }, [initialLocation]);

  const updateLocation = (updates: Partial<{ lat: number; lng: number }>) => {
    const nextLocation = { ...location, ...updates };
    setLocation(nextLocation);

    if (Number.isFinite(nextLocation.lat) && Number.isFinite(nextLocation.lng)) {
      onLocationSelect(nextLocation.lat, nextLocation.lng);
    }
  };

  const nudge = (latDelta: number, lngDelta: number) => {
    updateLocation({
      lat: Number((location.lat + latDelta).toFixed(6)),
      lng: Number((location.lng + lngDelta).toFixed(6)),
    });
  };

  return (
    <div className="space-y-3">
      <div className="h-[300px] w-full rounded-md border border-input bg-muted/30 p-4">
        <div className="flex h-full flex-col items-center justify-center text-center">
          <MapPin className="mb-3 h-8 w-8 text-primary" />
          <p className="font-medium text-foreground">Location Picker</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            The interactive map was causing this screen to crash, so this fallback picker keeps report submission working.
          </p>
          <p className="mt-4 text-sm text-foreground">
            Selected: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
          </p>
          <a
            href={`https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}#map=16/${location.lat}/${location.lng}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Open in OpenStreetMap
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Latitude</label>
          <Input
            type="number"
            step="0.000001"
            value={location.lat}
            onChange={(e) => updateLocation({ lat: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Longitude</label>
          <Input
            type="number"
            step="0.000001"
            value={location.lng}
            onChange={(e) => updateLocation({ lng: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => nudge(0.001, 0)}>
          North
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => nudge(-0.001, 0)}>
          South
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => nudge(0, -0.001)}>
          West
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => nudge(0, 0.001)}>
          East
        </Button>
      </div>
    </div>
  );
};
