import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { io } from "socket.io-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, RefreshCw } from "lucide-react";
import { Report } from "@/types";
import { API_CONFIG } from "@/config/api";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.heat";

import icon from "leaflet/dist/images/marker-icon.png";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DEFAULT_CENTER: [number, number] = [28.6139, 77.209];
const API_ORIGIN = API_CONFIG.UPLOAD_BASE;

// Fix default marker paths for Vite bundler
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: icon,
  shadowUrl: iconShadow,
});

interface MapPoint {
  id: string;
  title: string;
  category: string;
  status: string;
  priority: number;
  lat: number;
  lng: number;
  address: string;
  createdAt: Date;
}

interface RealtimeMapDashboardProps {
  token: string;
  reports: Report[];
  apiUrl?: string;
}

function reportToMapPoint(report: Report): MapPoint | null {
  const lat = report.location?.lat;
  const lng = report.location?.lng;
  if (lat == null || lng == null || (lat === 0 && lng === 0)) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    id: report.id,
    title: report.title,
    category: report.category,
    status: report.status,
    priority: report.priority,
    lat,
    lng,
    address: report.location.address || "Unknown location",
    createdAt: report.createdAt,
  };
}

function socketPayloadToMapPoint(payload: {
  id?: string;
  _id?: string;
  title?: string;
  category: string;
  priority: number;
  status?: string;
  location?: { coordinates?: [number, number]; address?: string };
  createdAt: string;
}): MapPoint | null {
  const coords = payload.location?.coordinates;
  if (!coords || coords.length < 2) return null;
  const [lng, lat] = coords;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    id: String(payload.id || payload._id || `${lat}-${lng}`),
    title: payload.title || payload.category,
    category: payload.category,
    status: payload.status || "Submitted",
    priority: payload.priority,
    lat,
    lng,
    address: payload.location?.address || "Reported location",
    createdAt: new Date(payload.createdAt),
  };
}

function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const timers = [100, 300, 600].map((ms) =>
      setTimeout(() => map.invalidateSize({ animate: false }), ms)
    );
    return () => timers.forEach(clearTimeout);
  }, [map]);
  return null;
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) {
      map.setView(DEFAULT_CENTER, 12);
      return;
    }
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 15 });
  }, [map, points]);
  return null;
}

function HeatmapLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const heat = (L as typeof L & { heatLayer?: (p: [number, number, number][], o: object) => L.Layer }).heatLayer;
    if (!heat) return;

    const layer = heat(points, { radius: 28, blur: 18, maxZoom: 16, minOpacity: 0.35 });
    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, points]);
  return null;
}

function priorityMarkerIcon(priority: number) {
  const color =
    priority >= 5 ? "#dc2626" : priority >= 4 ? "#ea580c" : priority >= 3 ? "#d97706" : "#2563eb";

  return L.divIcon({
    className: "civic-map-marker",
    html: `<div style="
      background:${color};
      width:14px;height:14px;
      border-radius:50%;
      border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,.35);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export const RealtimeMapDashboard = ({
  token,
  reports,
  apiUrl = API_ORIGIN,
}: RealtimeMapDashboardProps) => {
  const [livePoints, setLivePoints] = useState<MapPoint[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showClusters, setShowClusters] = useState(true);
  const [loading, setLoading] = useState(false);

  const reportPoints = useMemo(
    () => reports.map(reportToMapPoint).filter((p): p is MapPoint => p !== null),
    [reports]
  );

  const mapPoints = useMemo(() => {
    const byId = new Map<string, MapPoint>();
    reportPoints.forEach((p) => byId.set(p.id, p));
    livePoints.forEach((p) => byId.set(p.id, p));
    return Array.from(byId.values());
  }, [reportPoints, livePoints]);

  const positions = useMemo(
    () => mapPoints.map((p) => [p.lat, p.lng] as [number, number]),
    [mapPoints]
  );

  const heatmapPoints = useMemo(
    () => mapPoints.map((p) => [p.lat, p.lng, p.priority / 5] as [number, number, number]),
    [mapPoints]
  );

  // Socket for real-time pins (supplements parent reports)
  useEffect(() => {
    if (!token) return;

    const socket = io(apiUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("new_report_map_update", (payload: Parameters<typeof socketPayloadToMapPoint>[0]) => {
      const point = socketPayloadToMapPoint(payload);
      if (point) {
        setLivePoints((prev) => {
          const next = prev.filter((p) => p.id !== point.id);
          return [point, ...next];
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, apiUrl]);

  const refreshFromApi = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/reports/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.reports)) {
          const points = data.reports
            .map((r: {
              _id: string;
              title: string;
              category: string;
              status: string;
              priority: number;
              location?: { coordinates?: [number, number]; address?: string };
              createdAt: string;
            }) =>
              socketPayloadToMapPoint({
                id: r._id,
                title: r.title,
                category: r.category,
                status: r.status,
                priority: r.priority,
                location: r.location,
                createdAt: r.createdAt,
              })
            )
            .filter((p: MapPoint | null): p is MapPoint => p !== null);
          setLivePoints(points);
        }
      }
    } catch (error) {
      console.error("Map refresh failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full overflow-hidden border-primary/10">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            Live Issue Map
          </CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch id="heatmap-mode" checked={showHeatmap} onCheckedChange={setShowHeatmap} />
              <Label htmlFor="heatmap-mode" className="text-sm">Heatmap</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="cluster-mode"
                checked={showClusters}
                onCheckedChange={setShowClusters}
                disabled={showHeatmap}
              />
              <Label htmlFor="cluster-mode" className="text-sm">Clusters</Label>
            </div>
            <Badge variant="outline">{mapPoints.length} on map</Badge>
            <Button variant="outline" size="sm" onClick={refreshFromApi} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Low</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" /> Medium</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-600 inline-block" /> High</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" /> Critical</span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="relative h-[min(560px,70vh)] w-full min-h-[420px] rounded-b-lg overflow-hidden border-t">
          {mapPoints.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/30 text-muted-foreground gap-2">
              <MapPin className="h-10 w-10 opacity-40" />
              <p className="font-medium">No reports with valid locations yet</p>
              <p className="text-sm">Submit a report with GPS/map pin to see it here</p>
            </div>
          ) : null}

          <MapContainer
            center={DEFAULT_CENTER}
            zoom={12}
            className="h-full w-full z-0"
            scrollWheelZoom
          >
            <MapResizeHandler />
            <FitBounds points={positions} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {showHeatmap && <HeatmapLayer points={heatmapPoints} />}

            {!showHeatmap && showClusters ? (
              <MarkerClusterGroup chunkedLoading maxClusterRadius={50}>
                {mapPoints.map((point) => (
                  <Marker
                    key={point.id}
                    position={[point.lat, point.lng]}
                    icon={priorityMarkerIcon(point.priority)}
                  >
                    <Popup minWidth={220}>
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold">{point.title}</p>
                        <p className="text-muted-foreground">{point.category} · {point.status}</p>
                        <p className="text-xs">{point.address}</p>
                        <p className="text-xs font-medium">Priority P{point.priority}</p>
                        <p className="text-[10px] text-gray-500">
                          {point.createdAt.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>
            ) : !showHeatmap ? (
              mapPoints.map((point) => (
                <Marker
                  key={point.id}
                  position={[point.lat, point.lng]}
                  icon={priorityMarkerIcon(point.priority)}
                >
                  <Popup minWidth={220}>
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold">{point.title}</p>
                      <p className="text-muted-foreground">{point.category} · {point.status}</p>
                      <p className="text-xs">{point.address}</p>
                      <p className="text-xs font-medium">Priority P{point.priority}</p>
                    </div>
                  </Popup>
                </Marker>
              ))
            ) : null}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
};
