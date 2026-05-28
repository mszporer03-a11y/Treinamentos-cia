"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon (broken with webpack)
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

type Store = { id: string; name: string; code: string; city: string | null; active: boolean; lat: number | null; lng: number | null };

export default function StoreMap({ stores }: { stores: Store[] }) {
  const mapped = stores.filter((s) => s.lat !== null && s.lng !== null);
  if (mapped.length === 0) return null;

  const center: [number, number] = [
    mapped.reduce((a, s) => a + s.lat!, 0) / mapped.length,
    mapped.reduce((a, s) => a + s.lng!, 0) / mapped.length,
  ];

  return (
    <MapContainer center={center} zoom={5} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {mapped.map((s) => (
        <Marker key={s.id} position={[s.lat!, s.lng!]} icon={icon}>
          <Popup>
            <div className="text-sm">
              <p className="font-bold">{s.name}</p>
              <p className="text-gray-500">{s.code} · {s.city}</p>
              <p className={`mt-1 text-xs font-medium ${s.active ? "text-green-600" : "text-gray-400"}`}>
                {s.active ? "● Ativa" : "● Inativa"}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
