"use client";

import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { LatLngTuple } from "leaflet";

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

type LocationPoint = {
  id: number;
  name: string;
  position: LatLngTuple;
};

type PipaJalur = {
  id: number;
  pemasokId: number;
  pembangkitId: number;
  name: string;
  path: LatLngTuple[];
};

const createSoftIcon = (color: string) =>
  L.divIcon({
    className: "",
    html: `
      <div style="
        background:${color};
        width:16px;
        height:16px;
        border-radius:50%;
        border:2px solid white;
        box-shadow:0 0 0 4px ${color}33;
      "></div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });

export const pemasokIcon = createSoftIcon("#6FCF97");
export const pembangkitIcon = createSoftIcon("#F2A65A");

const pemasok: LocationPoint[] = [
  { id: 1, name: "Pemasok Jakarta", position: [-6.2, 106.8] },
  { id: 2, name: "Pemasok Bandung", position: [-6.9175, 107.6191] },
  { id: 3, name: "Pemasok Semarang", position: [-6.9667, 110.4167] },
  { id: 4, name: "Pemasok Surabaya", position: [-7.2575, 112.7521] },
  { id: 5, name: "Pemasok Yogyakarta", position: [-7.7956, 110.3695] },
  { id: 6, name: "Pemasok Denpasar", position: [-8.65, 115.2167] },
  { id: 7, name: "Pemasok Medan", position: [3.5952, 98.6722] },
  { id: 8, name: "Pemasok Palembang", position: [-2.9761, 104.7754] },
  { id: 9, name: "Pemasok Balikpapan", position: [-1.2675, 116.8289] },
  { id: 10, name: "Pemasok Makassar", position: [-5.1477, 119.4327] },
];

const pembangkit: LocationPoint[] = [
  { id: 1, name: "PLTU Suralaya", position: [-5.934, 106.025] },
  { id: 2, name: "PLTA Cirata", position: [-6.729, 107.357] },
  { id: 3, name: "PLTU Paiton", position: [-7.716, 113.56] },
  { id: 4, name: "PLTG Muara Karang", position: [-6.109, 106.787] },
  { id: 5, name: "PLTA Saguling", position: [-6.901, 107.328] },
  { id: 6, name: "PLTU Tanjung Jati", position: [-6.432, 110.65] },
  { id: 7, name: "PLTU Asam Asam", position: [-3.9, 114.7] },
  { id: 8, name: "PLTU Ombilin", position: [-0.65, 100.75] },
  { id: 9, name: "PLTU Barru", position: [-4.42, 119.62] },
  { id: 10, name: "PLTG Belawan", position: [3.784, 98.65] },
];

const jalurPipa: PipaJalur[] = [
  {
    id: 1,
    pemasokId: 1,
    pembangkitId: 1,
    name: "Jakarta → PLTU Suralaya",
    path: [
      [-6.2, 106.8],
      [-6.15, 106.55],
      [-6.05, 106.3],
      [-5.934, 106.025],
    ],
  },
  {
    id: 2,
    pemasokId: 2,
    pembangkitId: 2,
    name: "Bandung → PLTA Cirata",
    path: [
      [-6.9175, 107.6191],
      [-6.85, 107.52],
      [-6.78, 107.45],
      [-6.729, 107.357],
    ],
  },
  {
    id: 3,
    pemasokId: 3,
    pembangkitId: 6,
    name: "Semarang → PLTU Tanjung Jati",
    path: [
      [-6.9667, 110.4167],
      [-6.85, 110.5],
      [-6.65, 110.6],
      [-6.432, 110.65],
    ],
  },
  {
    id: 4,
    pemasokId: 4,
    pembangkitId: 3,
    name: "Surabaya → PLTU Paiton",
    path: [
      [-7.2575, 112.7521],
      [-7.45, 113.1],
      [-7.6, 113.35],
      [-7.716, 113.56],
    ],
  },
  {
    id: 5,
    pemasokId: 5,
    pembangkitId: 5,
    name: "Yogyakarta → PLTA Saguling",
    path: [
      [-7.7956, 110.3695],
      [-7.4, 109.9],
      [-7.1, 108.7],
      [-6.901, 107.328],
    ],
  },
  {
    id: 6,
    pemasokId: 6,
    pembangkitId: 7,
    name: "Denpasar → PLTU Asam Asam",
    path: [
      [-8.65, 115.2167],
      [-7.8, 114.9],
      [-6.2, 114.6],
      [-3.9, 114.7],
    ],
  },
  {
    id: 7,
    pemasokId: 7,
    pembangkitId: 10,
    name: "Medan → PLTG Belawan",
    path: [
      [3.5952, 98.6722],
      [3.65, 98.66],
      [3.72, 98.65],
      [3.784, 98.65],
    ],
  },
  {
    id: 8,
    pemasokId: 8,
    pembangkitId: 8,
    name: "Palembang → PLTU Ombilin",
    path: [
      [-2.9761, 104.7754],
      [-2.2, 103.9],
      [-1.4, 102.6],
      [-0.65, 100.75],
    ],
  },
  {
    id: 9,
    pemasokId: 9,
    pembangkitId: 9,
    name: "Balikpapan → PLTU Barru",
    path: [
      [-1.2675, 116.8289],
      [-2.8, 117.8],
      [-3.8, 118.7],
      [-4.42, 119.62],
    ],
  },
  {
    id: 10,
    pemasokId: 10,
    pembangkitId: 9,
    name: "Makassar → PLTU Barru",
    path: [
      [-5.1477, 119.4327],
      [-4.9, 119.5],
      [-4.6, 119.55],
      [-4.42, 119.62],
    ],
  },
];

export default function Map() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mt-4">
      <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
        Lokasi Gas Pipa
      </h3>

      <div className="relative h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px] w-full">
        <MapContainer
          center={[-2.5, 118]}
          zoom={5}
          scrollWheelZoom={true}
          className="h-full w-full rounded-lg z-0"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* PEMASOK */}
          {pemasok.map((item) => (
            <Marker
              key={`pemasok-${item.id}`}
              position={item.position}
              icon={pemasokIcon}
            >
              <Popup>
                <p className="font-semibold text-[#6FCF97]">Pemasok</p>
                <p className="text-sm">{item.name}</p>
              </Popup>
            </Marker>
          ))}

          {/* PEMBANGKIT */}
          {pembangkit.map((item) => (
            <Marker
              key={`pembangkit-${item.id}`}
              position={item.position}
              icon={pembangkitIcon}
            >
              <Popup>
                <p className="font-semibold text-[#F2A65A]">Pembangkit</p>
                <p className="text-sm">{item.name}</p>
              </Popup>
            </Marker>
          ))}

          {jalurPipa.map((jalur) => (
            <Polyline
              key={jalur.id}
              positions={jalur.path}
              pathOptions={{
                color: "#38BDF8",
                weight: 3,
                opacity: 0.8,
                dashArray: "1 5",
              }}
            >
              <Tooltip sticky>{jalur.name}</Tooltip>
            </Polyline>
          ))}
        </MapContainer>

        {/* LEGEND */}
        <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 z-1000 bg-white/90 backdrop-blur rounded-lg shadow-md px-2 py-1.5 sm:px-3 sm:py-2 text-xs space-y-1 sm:space-y-2">
          <div className="text-gray-700 text-xs">Keterangan Map</div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#6FCF97] ring-2 sm:ring-4 ring-[#6FCF9733]" />
            <span className="text-gray-700 text-xs">Pemasok</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#F2A65A] ring-2 sm:ring-4 ring-[#F2A65A33]" />
            <span className="text-gray-700 text-xs">Pembangkit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
