"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapStore = {
  id: string;
  name: string;
  code: string;
  city: string | null;
  active: boolean;
  lat: number | null;
  lng: number | null;
  contactName?: string | null;
  contactPhone?: string | null;
};

// Pin personalizado (gota) — verde = loja ativa, cinza = inativa
function pinIcon(active: boolean, selected: boolean) {
  const color = active ? "#16a34a" : "#6b7280";
  const size = selected ? 44 : 34;
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 6],
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))">
      <path fill="${color}" stroke="#fff" stroke-width="1.5" d="M12 2C8 2 5 5 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-4-3-7-7-7z"/>
      <circle cx="12" cy="9" r="2.8" fill="#fff"/>
    </svg>`,
  });
}

function whatsappLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.length <= 11 ? "55" + digits : digits}`;
}

// Enquadra todos os pins; ao selecionar uma loja, voa até ela
function Viewport({ stores, selectedId }: { stores: MapStore[]; selectedId?: string | null }) {
  const map = useMap();
  useEffect(() => {
    const selected = stores.find((s) => s.id === selectedId);
    if (selected) {
      map.flyTo([selected.lat!, selected.lng!], 14, { duration: 0.8 });
    } else if (stores.length === 1) {
      map.setView([stores[0].lat!, stores[0].lng!], 12);
    } else if (stores.length > 1) {
      map.fitBounds(L.latLngBounds(stores.map((s) => [s.lat!, s.lng!] as [number, number])), { padding: [40, 40] });
    }
  }, [map, stores, selectedId]);
  return null;
}

export default function StoreMap({
  stores,
  selectedId,
  onSelect,
}: {
  stores: MapStore[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const mapped = stores.filter((s) => s.lat !== null && s.lng !== null);
  if (mapped.length === 0) return null;

  return (
    <MapContainer center={[mapped[0].lat!, mapped[0].lng!]} zoom={5} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Viewport stores={mapped} selectedId={selectedId} />
      {mapped.map((s) => (
        <Marker
          key={s.id}
          position={[s.lat!, s.lng!]}
          icon={pinIcon(s.active, s.id === selectedId)}
          eventHandlers={{ click: () => onSelect?.(s.id) }}
        >
          <Popup>
            <div className="text-sm min-w-[160px]">
              <p className="font-bold text-gray-900">{s.name}</p>
              <p className="text-gray-500">{s.code}{s.city ? ` · ${s.city}` : ""}</p>
              <p className={`mt-1 text-xs font-medium ${s.active ? "text-green-600" : "text-gray-400"}`}>
                {s.active ? "● Ativa" : "● Inativa"}
              </p>
              {s.contactPhone && (
                <p className="mt-2 text-xs text-gray-700">
                  {s.contactName ? `${s.contactName} · ` : ""}{s.contactPhone}{" "}
                  <a href={whatsappLink(s.contactPhone)} target="_blank" rel="noopener noreferrer" className="text-green-600 font-medium">
                    WhatsApp
                  </a>
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
