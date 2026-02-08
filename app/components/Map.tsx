"use client";

import { useState } from "react";
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
import { Eye, EyeOff, ChevronDown, ChevronUp, Layers } from "lucide-react";
import FilterAutocomplete from "./FilterAutocomplete";

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

// Enhanced types
type Pembangkit = {
  id: number;
  name: string;
  jenis: string;
  kapasitas: string;
  position: LatLngTuple;
};

type Pemasok = {
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

// Enhanced Pemasok Data (15 locations)
const pemasokData: Pemasok[] = [
  { id: 1, name: "PHE ONWJ", position: [-6.2, 106.8] },
  { id: 2, name: "Pertamina EP Subang", position: [-6.9175, 107.6191] },
  { id: 3, name: "ConocoPhillips Corridor", position: [-6.9667, 110.4167] },
  { id: 4, name: "PGN Surabaya", position: [-7.2575, 112.7521] },
  { id: 5, name: "Medco E&P Lematang", position: [-2.9761, 104.7754] },
  { id: 6, name: "ExxonMobil Cepu", position: [-7.1, 111.8] },
  { id: 7, name: "Chevron Riau", position: [1.4, 102.1] },
  { id: 8, name: "Santos Madura", position: [-7.0, 113.5] },
  { id: 9, name: "VICO Kalimantan", position: [-0.5, 117.1] },
  { id: 10, name: "Star Energy Salak", position: [-6.7, 106.7] },
  { id: 11, name: "BP Tangguh", position: [-2.8, 132.3] },
  { id: 12, name: "Petrochina Jabung", position: [-1.5, 103.5] },
  { id: 13, name: "PetroChina Jambi", position: [-1.6, 103.6] },
  { id: 14, name: "Premier Oil Sumatra", position: [1.2, 97.8] },
  { id: 15, name: "Husky CNOOC Madura", position: [-7.1, 113.9] },
];

// Enhanced Pembangkit Data with Kapasitas (20 locations)
const pembangkitData: Pembangkit[] = [
  { id: 1, name: "PLTU Suralaya", jenis: "PLTU", kapasitas: "3,400 MW", position: [-5.934, 106.025] },
  { id: 2, name: "PLTA Cirata", jenis: "PLTA", kapasitas: "1,008 MW", position: [-6.729, 107.357] },
  { id: 3, name: "PLTU Paiton", jenis: "PLTU", kapasitas: "4,710 MW", position: [-7.716, 113.56] },
  { id: 4, name: "PLTG Muara Karang", jenis: "PLTG", kapasitas: "900 MW", position: [-6.109, 106.787] },
  { id: 5, name: "PLTA Saguling", jenis: "PLTA", kapasitas: "700 MW", position: [-6.901, 107.328] },
  { id: 6, name: "PLTU Tanjung Jati", jenis: "PLTU", kapasitas: "2,640 MW", position: [-6.432, 110.65] },
  { id: 7, name: "PLTU Asam Asam", jenis: "PLTU", kapasitas: "230 MW", position: [-3.9, 114.7] },
  { id: 8, name: "PLTU Ombilin", jenis: "PLTU", kapasitas: "400 MW", position: [-0.65, 100.75] },
  { id: 9, name: "PLTU Barru", jenis: "PLTU", kapasitas: "100 MW", position: [-4.42, 119.62] },
  { id: 10, name: "PLTG Belawan", jenis: "PLTG", kapasitas: "1,100 MW", position: [3.784, 98.65] },
  { id: 11, name: "PLTGU Gresik", jenis: "PLTGU", kapasitas: "2,300 MW", position: [-7.16, 112.65] },
  { id: 12, name: "PLTGU Muara Tawar", jenis: "PLTGU", kapasitas: "3,450 MW", position: [-6.2, 107.1] },
  { id: 13, name: "PLTGU Tanjung Priok", jenis: "PLTGU", kapasitas: "1,750 MW", position: [-6.1, 106.87] },
  { id: 14, name: "PLTU Cirebon", jenis: "PLTU", kapasitas: "660 MW", position: [-6.75, 108.55] },
  { id: 15, name: "PLTU Indramayu", jenis: "PLTU", kapasitas: "990 MW", position: [-6.35, 108.35] },
  { id: 16, name: "PLTGU Tambak Lorok", jenis: "PLTGU", kapasitas: "1,400 MW", position: [-6.95, 110.45] },
  { id: 17, name: "PLTU Banten", jenis: "PLTU", kapasitas: "670 MW", position: [-6.0, 106.15] },
  { id: 18, name: "PLTG Grati", jenis: "PLTG", kapasitas: "485 MW", position: [-7.68, 113.25] },
  { id: 19, name: "PLTU Pacitan", jenis: "PLTU", kapasitas: "630 MW", position: [-8.15, 111.1] },
  { id: 20, name: "PLTU Lontar", jenis: "PLTU", kapasitas: "945 MW", position: [-6.08, 106.35] },
];

// Enhanced Routes with multiple connections (20 routes)
const jalurPipa: PipaJalur[] = [
  { id: 1, pemasokId: 1, pembangkitId: 4, name: "PHE ONWJ → PLTG Muara Karang", path: [[-6.2, 106.8], [-6.15, 106.79], [-6.109, 106.787]] },
  { id: 2, pemasokId: 1, pembangkitId: 13, name: "PHE ONWJ → PLTGU Tanjung Priok", path: [[-6.2, 106.8], [-6.15, 106.85], [-6.1, 106.87]] },
  { id: 3, pemasokId: 2, pembangkitId: 2, name: "Pertamina EP Subang → PLTA Cirata", path: [[-6.9175, 107.6191], [-6.85, 107.52], [-6.729, 107.357]] },
  { id: 4, pemasokId: 2, pembangkitId: 14, name: "Pertamina EP Subang → PLTU Cirebon", path: [[-6.9175, 107.6191], [-6.85, 108.1], [-6.75, 108.55]] },
  { id: 5, pemasokId: 3, pembangkitId: 6, name: "ConocoPhillips → PLTU Tanjung Jati", path: [[-6.9667, 110.4167], [-6.7, 110.5], [-6.432, 110.65]] },
  { id: 6, pemasokId: 3, pembangkitId: 16, name: "ConocoPhillips → PLTGU Tambak Lorok", path: [[-6.9667, 110.4167], [-6.96, 110.44], [-6.95, 110.45]] },
  { id: 7, pemasokId: 4, pembangkitId: 11, name: "PGN Surabaya → PLTGU Gresik", path: [[-7.2575, 112.7521], [-7.2, 112.7], [-7.16, 112.65]] },
  { id: 8, pemasokId: 4, pembangkitId: 3, name: "PGN Surabaya → PLTU Paiton", path: [[-7.2575, 112.7521], [-7.5, 113.1], [-7.716, 113.56]] },
  { id: 9, pemasokId: 5, pembangkitId: 8, name: "Medco Lematang → PLTU Ombilin", path: [[-2.9761, 104.7754], [-1.8, 102.8], [-0.65, 100.75]] },
  { id: 10, pemasokId: 6, pembangkitId: 3, name: "ExxonMobil Cepu → PLTU Paiton", path: [[-7.1, 111.8], [-7.4, 112.5], [-7.716, 113.56]] },
  { id: 11, pemasokId: 6, pembangkitId: 11, name: "ExxonMobil Cepu → PLTGU Gresik", path: [[-7.1, 111.8], [-7.12, 112.2], [-7.16, 112.65]] },
  { id: 12, pemasokId: 7, pembangkitId: 8, name: "Chevron Riau → PLTU Ombilin", path: [[1.4, 102.1], [0.5, 101.4], [-0.65, 100.75]] },
  { id: 13, pemasokId: 8, pembangkitId: 18, name: "Santos Madura → PLTG Grati", path: [[-7.0, 113.5], [-7.3, 113.35], [-7.68, 113.25]] },
  { id: 14, pemasokId: 9, pembangkitId: 7, name: "VICO Kalimantan → PLTU Asam Asam", path: [[-0.5, 117.1], [-2.2, 116.0], [-3.9, 114.7]] },
  { id: 15, pemasokId: 10, pembangkitId: 1, name: "Star Energy Salak → PLTU Suralaya", path: [[-6.7, 106.7], [-6.3, 106.4], [-5.934, 106.025]] },
  { id: 16, pemasokId: 10, pembangkitId: 20, name: "Star Energy Salak → PLTU Lontar", path: [[-6.7, 106.7], [-6.4, 106.5], [-6.08, 106.35]] },
  { id: 17, pemasokId: 14, pembangkitId: 10, name: "Premier Oil → PLTG Belawan", path: [[1.2, 97.8], [2.5, 98.2], [3.784, 98.65]] },
  { id: 18, pemasokId: 15, pembangkitId: 3, name: "Husky CNOOC → PLTU Paiton", path: [[-7.1, 113.9], [-7.4, 113.7], [-7.716, 113.56]] },
  { id: 19, pemasokId: 15, pembangkitId: 18, name: "Husky CNOOC → PLTG Grati", path: [[-7.1, 113.9], [-7.4, 113.6], [-7.68, 113.25]] },
  { id: 20, pemasokId: 1, pembangkitId: 12, name: "PHE ONWJ → PLTGU Muara Tawar", path: [[-6.2, 106.8], [-6.2, 107.0], [-6.2, 107.1]] },
];

// Transportir data
const transportirData = [
  "PGN (Perusahaan Gas Negara)",
  "Pertamina Gas",
  "Medco Energi",
  "Pertagas Niaga",
  "Transportir X",
  "Transportir Y",
];

// Region/Wilayah options
const wilayahOptions = [
  "Jawa Bagian Barat",
  "Jawa Timur",
  "Jawa Tengah",
  "Sumatera Tengah",
  "Jambi",
  "Sumatera Selatan",
  "Kalimantan",
  "Sulawesi",
  "Papua",
];

// Helper function to get connected pembangkit for a pemasok
const getConnectedPembangkit = (pemasokId: number): Pembangkit[] => {
  const connectedIds = jalurPipa
    .filter((jalur) => jalur.pemasokId === pemasokId)
    .map((jalur) => jalur.pembangkitId);
  return pembangkitData.filter((p) => connectedIds.includes(p.id));
};

export default function Map() {
  const [showPemasok, setShowPemasok] = useState(true);
  const [showPembangkit, setShowPembangkit] = useState(true);
  const [showRute, setShowRute] = useState(true);
  const [legendExpanded, setLegendExpanded] = useState(false);

  // Filter states
  const [selectedWilayah, setSelectedWilayah] = useState<string | null>(null);
  const [selectedPemasok, setSelectedPemasok] = useState<string | null>(null);
  const [selectedPembangkit, setSelectedPembangkit] = useState<string | null>(null);
  const [selectedTransportir, setSelectedTransportir] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mt-4">
      {/* Header with title and filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <h3 className="text-base md:text-lg font-semibold text-gray-900">
          Lokasi Gas Pipa
        </h3>
        
        {/* Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-3">
          <div className="min-w-[140px]">
            <FilterAutocomplete
              label=""
              options={wilayahOptions}
              value={selectedWilayah}
              onChange={setSelectedWilayah}
              placeholder="Wilayah"
            />
          </div>
          <div className="min-w-[140px]">
            <FilterAutocomplete
              label=""
              options={pemasokData.map((p) => p.name)}
              value={selectedPemasok}
              onChange={setSelectedPemasok}
              placeholder="Pemasok"
            />
          </div>
          <div className="min-w-[140px]">
            <FilterAutocomplete
              label=""
              options={pembangkitData.map((p) => p.name)}
              value={selectedPembangkit}
              onChange={setSelectedPembangkit}
              placeholder="Pembangkit"
            />
          </div>
          <div className="min-w-[140px]">
            <FilterAutocomplete
              label=""
              options={transportirData}
              value={selectedTransportir}
              onChange={setSelectedTransportir}
              placeholder="Transportir"
            />
          </div>
        </div>
      </div>


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

          {/* PEMASOK MARKERS */}
          {showPemasok &&
            pemasokData.map((item) => {
              const connected = getConnectedPembangkit(item.id);
              return (
                <Marker
                  key={`pemasok-${item.id}`}
                  position={item.position}
                  icon={pemasokIcon}
                >
                  <Popup>
                    <div className="min-w-[180px]">
                      <p className="font-semibold text-[#6FCF97] text-sm">Pemasok</p>
                      <p className="text-sm font-medium text-gray-800">{item.name}</p>
                      {connected.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Koneksi ke Pembangkit:</p>
                          <ul className="text-xs text-gray-700 space-y-0.5">
                            {connected.map((p) => (
                              <li key={p.id} className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#F2A65A]" />
                                {p.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {/* PEMBANGKIT MARKERS */}
          {showPembangkit &&
            pembangkitData.map((item) => (
              <Marker
                key={`pembangkit-${item.id}`}
                position={item.position}
                icon={pembangkitIcon}
              >
                <Popup>
                  <div className="min-w-[150px]">
                    <p className="font-semibold text-[#F2A65A] text-sm">Pembangkit</p>
                    <p className="text-sm font-medium text-gray-800">{item.name}</p>
                    <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Jenis:</span>
                        <span className="font-medium text-gray-700">{item.jenis}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Kapasitas:</span>
                        <span className="font-medium text-[#115d72]">{item.kapasitas}</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* ROUTES */}
          {showRute &&
            jalurPipa.map((jalur) => (
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

        {/* INTERACTIVE LEGEND - Collapsible */}
        <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 z-1000">
          {/* Collapsed view (mobile-friendly) */}
          {!legendExpanded ? (
            <button
              onClick={() => setLegendExpanded(true)}
              className="flex items-center gap-2 bg-white/95 backdrop-blur rounded-lg shadow-lg px-3 py-2 text-xs hover:bg-white transition-all"
            >
              <Layers size={16} className="text-[#115d72]" />
              <span className="text-gray-700 font-medium">Legend</span>
              <ChevronUp size={14} className="text-gray-400" />
            </button>
          ) : (
            /* Expanded view */
            <div className="bg-white/95 backdrop-blur rounded-lg shadow-lg px-3 py-2 sm:px-4 sm:py-3 text-xs space-y-2 min-w-[140px]">
              {/* Header with collapse button */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-1.5 mb-1">
                <span className="text-gray-700 font-semibold text-xs">Keterangan Map</span>
                <button
                  onClick={() => setLegendExpanded(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <ChevronDown size={14} className="text-gray-500" />
                </button>
              </div>

              {/* Pemasok Toggle */}
              <button
                onClick={() => setShowPemasok(!showPemasok)}
                className={`flex items-center gap-2 w-full py-1 px-1.5 rounded-md transition-all ${
                  showPemasok ? "bg-[#6FCF97]/10" : "bg-gray-100 opacity-60"
                }`}
              >
                <span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#6FCF97] ${showPemasok ? "ring-2 sm:ring-4 ring-[#6FCF9733]" : ""}`} />
                <span className="text-gray-700 text-xs flex-1 text-left">Pemasok</span>
                {showPemasok ? (
                  <Eye size={14} className="text-[#6FCF97]" />
                ) : (
                  <EyeOff size={14} className="text-gray-400" />
                )}
              </button>

              {/* Pembangkit Toggle */}
              <button
                onClick={() => setShowPembangkit(!showPembangkit)}
                className={`flex items-center gap-2 w-full py-1 px-1.5 rounded-md transition-all ${
                  showPembangkit ? "bg-[#F2A65A]/10" : "bg-gray-100 opacity-60"
                }`}
              >
                <span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#F2A65A] ${showPembangkit ? "ring-2 sm:ring-4 ring-[#F2A65A33]" : ""}`} />
                <span className="text-gray-700 text-xs flex-1 text-left">Pembangkit</span>
                {showPembangkit ? (
                  <Eye size={14} className="text-[#F2A65A]" />
                ) : (
                  <EyeOff size={14} className="text-gray-400" />
                )}
              </button>

              {/* Rute Toggle */}
              <button
                onClick={() => setShowRute(!showRute)}
                className={`flex items-center gap-2 w-full py-1 px-1.5 rounded-md transition-all ${
                  showRute ? "bg-[#38BDF8]/10" : "bg-gray-100 opacity-60"
                }`}
              >
                <span className={`w-6 sm:w-8 h-0.5 ${showRute ? "bg-[#38BDF8]" : "bg-gray-400"}`} style={{ borderStyle: "dashed", borderWidth: "0 0 2px 0", borderColor: showRute ? "#38BDF8" : "#9ca3af" }} />
                <span className="text-gray-700 text-xs flex-1 text-left">Rute Pipa</span>
                {showRute ? (
                  <Eye size={14} className="text-[#38BDF8]" />
                ) : (
                  <EyeOff size={14} className="text-gray-400" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
