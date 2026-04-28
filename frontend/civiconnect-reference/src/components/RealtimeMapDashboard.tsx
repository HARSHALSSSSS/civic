import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io, Socket } from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Heatmap plugin
import 'leaflet.heat';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapReport {
  id: string;
  category: string;
  priority: number;
  location: {
    coordinates: [number, number];
    address: string;
  };
  createdAt: string;
}

interface RealtimeMapDashboardProps {
  token: string;
  apiUrl?: string;
}

function HeatmapLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length === 0) return;
    const heatLayer = (L as any).heatLayer(points, { radius: 25, blur: 15, maxZoom: 17 }).addTo(map);
    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}

export const RealtimeMapDashboard = ({ token, apiUrl = "http://localhost:5000" }: RealtimeMapDashboardProps) => {
  const [reports, setReports] = useState<MapReport[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showClusters, setShowClusters] = useState(true);

  useEffect(() => {
    // Fetch initial reports
    const fetchReports = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/reports/admin`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Convert backend reports to our MapReport interface
            const mapReports = data.reports.map((r: any) => ({
              id: r._id || r.id,
              category: r.category,
              priority: r.priority,
              location: r.location,
              createdAt: r.createdAt
            }));
            setReports(mapReports);
          }
        }
      } catch (error) {
        console.error("Failed to fetch reports for map:", error);
      }
    };

    fetchReports();

    // Socket for real-time updates
    const socket = io(apiUrl, {
      auth: { token },
      transports: ["websocket", "polling"]
    });

    socket.on("new_report_map_update", (newReport: MapReport) => {
      setReports(prev => [newReport, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [token, apiUrl]);

  const heatmapPoints: [number, number, number][] = reports.map(r => [
    r.location.coordinates[1],
    r.location.coordinates[0],
    r.priority / 5 // intensity
  ]);

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'text-red-600';
    if (priority >= 3) return 'text-amber-600';
    return 'text-green-600';
  };

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Real-time Issue Map</CardTitle>
          <div className="flex gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Switch id="heatmap-mode" checked={showHeatmap} onCheckedChange={setShowHeatmap} />
              <Label htmlFor="heatmap-mode">Heatmap</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="cluster-mode" checked={showClusters} onCheckedChange={setShowClusters} />
              <Label htmlFor="cluster-mode">Clustering</Label>
            </div>
            <Badge variant="outline">{reports.length} Reports</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 relative overflow-hidden">
        <MapContainer
          center={[-1.286389, 36.817223]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {showHeatmap && <HeatmapLayer points={heatmapPoints} />}
          
          {!showHeatmap && showClusters && (
            <MarkerClusterGroup>
              {reports.map(report => (
                <Marker key={report.id} position={[report.location.coordinates[1], report.location.coordinates[0]]}>
                  <Popup>
                    <div className="p-1">
                      <h3 className="font-bold">{report.category}</h3>
                      <p className="text-sm">{report.location.address}</p>
                      <p className={`text-xs font-semibold ${getPriorityColor(report.priority)}`}>
                        Priority: P{report.priority}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(report.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          )}

          {!showHeatmap && !showClusters && reports.map(report => (
            <Marker key={report.id} position={[report.location.coordinates[1], report.location.coordinates[0]]}>
              <Popup>
                <div className="p-1">
                  <h3 className="font-bold">{report.category}</h3>
                  <p className="text-sm">{report.location.address}</p>
                  <p className={`text-xs font-semibold ${getPriorityColor(report.priority)}`}>
                    Priority: P{report.priority}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </CardContent>
    </Card>
  );
};
