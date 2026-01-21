"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

type LeafletIconPrototype = {
  _getIconUrl?: () => string;
};

delete (L.Icon.Default.prototype as LeafletIconPrototype)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function Map() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mt-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Lokasi Gas Pipa
      </h3>

      <div className="h-[400px] w-full">
        <MapContainer
          center={[-2.5, 118]}
          zoom={5}
          scrollWheelZoom={false}
          className="h-full w-full rounded-lg z-0"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker position={[-6.2, 106.8]}>
            <Popup>Jakarta</Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}
