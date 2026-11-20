"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
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
  pinColor?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
};

const DEFAULT_PIN = "#EA580C";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

/** Pin personalizado: cor por loja + código da loja dentro do pin. */
export function pinIcon(color: string | null | undefined, label: string, opts: { selected?: boolean; inactive?: boolean } = {}) {
  const c = /^#[0-9a-fA-F]{6}$/.test(color ?? "") ? color! : DEFAULT_PIN;
  const size = opts.selected ? 46 : 36;
  const text = escapeHtml(label.slice(0, 4).toUpperCase());
  const html = `
    <div style="position:relative;width:${size}px;height:${size}px;transform:translate(-50%,-100%);filter:drop-shadow(0 3px 4px rgba(0,0,0,.35));opacity:${opts.inactive ? 0.55 : 1}">
      <svg viewBox="0 0 36 36" width="${size}" height="${size}">
        <path d="M18 1C10.3 1 4 7.2 4 14.9 4 25.3 18 35 18 35s14-9.7 14-20.1C32 7.2 25.7 1 18 1z" fill="${c}" stroke="#fff" stroke-width="2"/>
        <circle cx="18" cy="14.5" r="9" fill="#fff" fill-opacity=".95"/>
      </svg>
      <span style="position:absolute;left:0;right:0;top:${size * 0.3}px;text-align:center;font:800 ${size * 0.22}px/1 Inter,system-ui,sans-serif;color:${c};letter-spacing:-.02em">${text}</span>
    </div>`;
  return L.divIcon({ html, className: "", iconSize: [0, 0], popupAnchor: [0, -size] });
}

function FitBounds({ stores, focusId }: { stores: MapStore[]; focusId?: string | null }) {
  const map = useMap();
  const key = stores.map((s) => `${s.id}:${s.lat}:${s.lng}`).join("|");

  useEffect(() => {
    const pts = stores.filter((s) => s.lat != null && s.lng != null).map((s) => [s.lat!, s.lng!] as [number, number]);
    if (pts.length === 0) return;
    if (pts.length === 1) map.setView(pts[0], 13);
    else map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 13 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    const s = stores.find((x) => x.id === focusId);
    if (s?.lat != null && s?.lng != null) map.flyTo([s.lat, s.lng], Math.max(map.getZoom(), 14), { duration: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId]);

  return null;
}

function ClickToPlace({ onPick }: { onPick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick?.(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
    },
  });
  return null;
}

export default function StoreMap({
  stores,
  selectedId,
  onSelect,
  placing,
  onPlace,
  draft,
}: {
  stores: MapStore[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** Quando true, clicar no mapa define a posição (via onPlace). */
  placing?: boolean;
  onPlace?: (lat: number, lng: number) => void;
  /** Posição provisória durante a edição de uma loja. */
  draft?: { lat: number; lng: number; color?: string | null; label: string } | null;
}) {
  const mapped = useMemo(() => stores.filter((s) => s.lat != null && s.lng != null), [stores]);
  const center: [number, number] = mapped.length
    ? [mapped.reduce((a, s) => a + s.lat!, 0) / mapped.length, mapped.reduce((a, s) => a + s.lng!, 0) / mapped.length]
    : [-15.78, -47.93]; // Brasil

  return (
    <MapContainer
      center={draft ? [draft.lat, draft.lng] : center}
      zoom={mapped.length ? 5 : 4}
      scrollWheelZoom
      style={{ height: "100%", width: "100%", cursor: placing ? "crosshair" : undefined }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds stores={mapped} focusId={selectedId} />
      {placing && <ClickToPlace onPick={onPlace} />}
      {mapped.map((s) => (
        <Marker
          key={s.id}
          position={[s.lat!, s.lng!]}
          icon={pinIcon(s.pinColor, s.code, { selected: s.id === selectedId, inactive: !s.active })}
          eventHandlers={{ click: () => onSelect?.(s.id) }}
          zIndexOffset={s.id === selectedId ? 1000 : 0}
        >
          <Popup>
            <div className="text-sm min-w-[160px]">
              <p className="font-bold">{s.name}</p>
              <p className="text-gray-500">{s.code}{s.city ? ` · ${s.city}` : ""}</p>
              {s.address && <p className="text-gray-500 text-xs mt-1">{s.address}</p>}
              <p className={`mt-1 text-xs font-medium ${s.active ? "text-green-600" : "text-gray-400"}`}>
                {s.active ? "● Ativa" : "● Inativa"}
              </p>
              <a
                className="text-xs text-blue-600"
                href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Como chegar →
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
      {draft && (
        <Marker
          position={[draft.lat, draft.lng]}
          icon={pinIcon(draft.color, draft.label || "?", { selected: true })}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const p = (e.target as L.Marker).getLatLng();
              onPlace?.(Number(p.lat.toFixed(6)), Number(p.lng.toFixed(6)));
            },
          }}
        />
      )}
    </MapContainer>
  );
}
