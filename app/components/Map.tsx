"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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
import {
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Layers,
  X,
  Filter,
  Loader2,
} from "lucide-react";
import FilterAutocomplete from "./FilterAutocomplete";
import {
  useMapLocations,
  type MapSite,
  type MapLegend,
} from "@/hooks/service/dashboard-api";
import { useRelations } from "@/hooks/service/site-api";
import { usePrivilege } from "@/hooks/usePrivilege";

interface LeafletIconPrototype {
  _getIconUrl?: () => string;
}

delete (L.Icon.Default.prototype as LeafletIconPrototype)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ---------------------------------------------------------------------------
// Icon helpers
// ---------------------------------------------------------------------------

const createSoftIcon = (color: string) =>
  L.divIcon({
    className: "",
    html: `
      <div style="
        background: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 0 4px ${color}33;
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });

const buildIcons = (legend: MapLegend): Record<string, L.DivIcon> => {
  const icons: Record<string, L.DivIcon> = {};
  legend.siteTypes.forEach((st) => {
    icons[st.type] = createSoftIcon(st.color);
  });
  return icons;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Map() {
  // ---- API data -----------------------------------------------------------
  const { data, isLoading, isError, error } = useMapLocations();

  const { hasPrivilege } = usePrivilege();
  const canReadSites = hasPrivilege("site_management", "READ");
  const { data: relations } = useRelations(true, {
    enabled: canReadSites,
  }); // fetch active relations only if permitted

  // ---- UI state -----------------------------------------------------------
  const [legendExpanded, setLegendExpanded] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  // Visibility toggles per site type
  const [visibleSiteTypes, setVisibleSiteTypes] = useState<
    Record<string, boolean>
  >({
    PEMBANGKIT: true,
    PEMASOK: true,
    TRANSPORTIR: true,
    TERMINAL: true,
    HANDOVER_POINT: true,
  });
  const [showPipes, setShowPipes] = useState(true);

  // Filter states
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedPemasok, setSelectedPemasok] = useState<string | null>(null);
  const [selectedPembangkit, setSelectedPembangkit] = useState<string | null>(
    null,
  );

  // Kepemilikan (owner) filter – checked owners are included
  const OWNER_OPTIONS = ["PLN", "PLN IP", "PLN NP"] as const;
  const [selectedOwners, setSelectedOwners] = useState<Set<string>>(
    new Set(OWNER_OPTIONS),
  );

  const toggleOwner = useCallback((owner: string) => {
    setSelectedOwners((prev) => {
      const next = new Set(prev);
      if (next.has(owner)) next.delete(owner);
      else next.add(owner);
      return next;
    });
  }, []);

  // ---- Derived data -------------------------------------------------------
  const icons = useMemo(() => {
    if (!data?.legend) return {} as Record<string, L.DivIcon>;
    return buildIcons(data.legend);
  }, [data?.legend]);

  // Unique region list for filter dropdown
  const regionOptions = useMemo(() => {
    if (!data?.sites) return [];
    return Array.from(new Set(data.sites.map((s) => s.region)))
      .filter(Boolean)
      .sort();
  }, [data?.sites]);

  // Names for autocomplete filters
  const pemasokNames = useMemo(() => {
    if (!data?.sites) return [];
    return data.sites
      .filter((s) => s.siteType === "PEMASOK")
      .map((s) => s.name)
      .sort();
  }, [data?.sites]);

  const pembangkitNames = useMemo(() => {
    if (!data?.sites) return [];

    // If a pemasok is selected and we have relations, filter pembangkits
    if (selectedPemasok && relations) {
      // Find the selected pemasok site to get its ID
      const pemasokSite = data.sites.find(
        (s) => s.siteType === "PEMASOK" && s.name === selectedPemasok,
      );

      if (pemasokSite) {
        // Get all site IDs connected to this pemasok via relations
        const connectedSiteIds = new Set(
          relations
            .filter(
              (rel) =>
                rel.source_site_id === pemasokSite.id ||
                rel.target_site_id === pemasokSite.id,
            )
            .map((rel) =>
              rel.source_site_id === pemasokSite.id
                ? rel.target_site_id
                : rel.source_site_id,
            ),
        );

        return data.sites
          .filter(
            (s) => s.siteType === "PEMBANGKIT" && connectedSiteIds.has(s.id),
          )
          .map((s) => s.name)
          .sort();
      }
    }

    // No pemasok selected — show all pembangkits
    return data.sites
      .filter((s) => s.siteType === "PEMBANGKIT")
      .map((s) => s.name)
      .sort();
  }, [data?.sites, selectedPemasok, relations]);

  // Reset pembangkit when pemasok changes and current selection is no longer valid
  useEffect(() => {
    if (selectedPembangkit && !pembangkitNames.includes(selectedPembangkit)) {
      setSelectedPembangkit(null);
    }
  }, [pembangkitNames, selectedPembangkit]);

  // Filtered sites
  const filteredSites = useMemo(() => {
    if (!data?.sites) return [];
    return data.sites.filter((site) => {
      if (!visibleSiteTypes[site.siteType]) return false;
      if (selectedRegion && site.region !== selectedRegion) return false;
      if (
        selectedPemasok &&
        site.siteType === "PEMASOK" &&
        site.name !== selectedPemasok
      )
        return false;
      if (
        selectedPembangkit &&
        site.siteType === "PEMBANGKIT" &&
        site.name !== selectedPembangkit
      )
        return false;
      // When a specific pemasok is selected, hide non-matching PEMASOK sites
      if (selectedPemasok && site.siteType !== "PEMASOK") {
        // Keep pembangkits that are connected through pipes
      }
      // Kepemilikan filter – hide PEMBANGKIT sites whose owner is unchecked
      if (site.siteType === "PEMBANGKIT" && site.owner) {
        if (!selectedOwners.has(site.owner)) return false;
      }
      return true;
    });
  }, [
    data?.sites,
    visibleSiteTypes,
    selectedRegion,
    selectedPemasok,
    selectedPembangkit,
    selectedOwners,
  ]);

  // Filtered pipes – show only if both source and target are visible
  const filteredPipes = useMemo(() => {
    if (!data?.pipes || !showPipes) return [];
    const visibleIds = new Set(filteredSites.map((s) => s.id));
    return data.pipes.filter(
      (pipe) =>
        visibleIds.has(pipe.sourceSiteId) && visibleIds.has(pipe.targetSiteId),
    );
  }, [data?.pipes, filteredSites, showPipes]);

  // ---- helpers ------------------------------------------------------------
  const getSiteTypeLabel = (type: string) =>
    data?.legend.siteTypes.find((st) => st.type === type)?.label || type;

  const getSiteTypeColor = (type: string) =>
    data?.legend.siteTypes.find((st) => st.type === type)?.color || "#999999";

  const getPipeTypeColor = (relationType: string) =>
    data?.legend.pipeTypes.find((pt) => pt.type === relationType)?.color ||
    "#38BDF8";

  const getSiteById = (id: string): MapSite | undefined =>
    data?.sites.find((s) => s.id === id);

  const getConnectedSites = (siteId: string): MapSite[] => {
    if (!data?.pipes || !data?.sites) return [];
    const connectedIds = data.pipes
      .filter(
        (pipe) => pipe.sourceSiteId === siteId || pipe.targetSiteId === siteId,
      )
      .map((pipe) =>
        pipe.sourceSiteId === siteId ? pipe.targetSiteId : pipe.sourceSiteId,
      );
    return data.sites.filter((s) => connectedIds.includes(s.id));
  };

  // Toggle a specific site type visibility
  const toggleSiteType = (type: string) => {
    setVisibleSiteTypes((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  // ---- Loading state ------------------------------------------------------
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mt-4 flex items-center justify-center h-[400px]">
        <div className="text-center">
          <Loader2
            size={32}
            className="animate-spin text-[#115d72] mx-auto mb-3"
          />
          <p className="text-gray-500 text-sm">Memuat peta...</p>
        </div>
      </div>
    );
  }

  // ---- Error state --------------------------------------------------------
  if (isError || !data) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mt-4 flex items-center justify-center h-[400px]">
        <div className="text-center">
          <X size={48} className="text-red-400 mx-auto mb-3" />
          <p className="text-gray-700 text-sm font-medium mb-1">
            Gagal Memuat Data Peta
          </p>
          <p className="text-gray-500 text-xs">
            {error instanceof Error ? error.message : "Terjadi kesalahan"}
          </p>
        </div>
      </div>
    );
  }

  // ---- Render -------------------------------------------------------------
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:divide-x divide-gray-200">
      {/* Map Section */}
      <div className="lg:col-span-9 lg:pr-6">
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

            {/* PIPES */}
            {showPipes &&
              filteredPipes.map((pipe) => {
                const source = getSiteById(pipe.sourceSiteId);
                const target = getSiteById(pipe.targetSiteId);
                if (!source || !target) return null;

                return (
                  <Polyline
                    key={pipe.id}
                    positions={[
                      [source.lat, source.lng] as LatLngTuple,
                      [target.lat, target.lng] as LatLngTuple,
                    ]}
                    pathOptions={{
                      color: getPipeTypeColor(pipe.relationType),
                      weight: 3,
                      opacity: 0.8,
                      dashArray: "1 5",
                    }}
                  >
                    <Tooltip sticky>
                      <div className="text-xs">
                        <p className="font-medium">
                          {source.name} → {target.name}
                        </p>
                        <p>Komoditas: {pipe.commodity}</p>
                        <p>Status: {pipe.status}</p>
                      </div>
                    </Tooltip>
                  </Polyline>
                );
              })}

            {/* SITE MARKERS */}
            {filteredSites.map((site) => {
              const icon = icons[site.siteType];
              const connected = getConnectedSites(site.id);

              return (
                <Marker
                  key={site.id}
                  position={[site.lat, site.lng] as LatLngTuple}
                  icon={icon}
                >
                  <Popup>
                    <div className="min-w-[180px]">
                      <p
                        className="font-semibold text-sm"
                        style={{ color: getSiteTypeColor(site.siteType) }}
                      >
                        {getSiteTypeLabel(site.siteType)}
                      </p>
                      <p className="text-sm font-medium text-gray-800">
                        {site.name}
                      </p>
                      <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Region:</span>
                          <span className="font-medium text-gray-700">
                            {site.region}
                          </span>
                        </div>
                        {site.siteType === "PEMBANGKIT" && site.capacity && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Kapasitas:</span>
                            <span className="font-medium text-[#115d72]">
                              {parseFloat(site.capacity).toLocaleString()} MW
                            </span>
                          </div>
                        )}
                        {site.siteType === "PEMBANGKIT" && site.owner && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Kepemilikan:</span>
                            <span className="font-medium text-gray-700">
                              {site.owner}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Koordinat:</span>
                          <span className="font-medium text-gray-700">
                            {site.lat?.toFixed(4)}, {site.lng?.toFixed(4)}
                          </span>
                        </div>
                      </div>
                      {connected.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Relasi:</p>
                          <ul className="text-xs text-gray-700 space-y-0.5">
                            {connected.map((c) => (
                              <li
                                key={c.id}
                                className="flex items-center gap-1"
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{
                                    backgroundColor: getSiteTypeColor(
                                      c.siteType,
                                    ),
                                  }}
                                />
                                {c.name}
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
          </MapContainer>

          {/* INTERACTIVE LEGEND - Collapsible */}
          <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 z-1000">
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
              <div className="bg-white/95 backdrop-blur rounded-lg shadow-lg px-3 py-2 sm:px-4 sm:py-3 text-xs space-y-2 min-w-[140px]">
                {/* Header with collapse button */}
                <div className="flex items-center justify-between border-b border-gray-200 pb-1.5 mb-1">
                  <span className="text-gray-700 font-semibold text-xs">
                    Keterangan Map
                  </span>
                  <button
                    onClick={() => setLegendExpanded(false)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <ChevronDown size={14} className="text-gray-500" />
                  </button>
                </div>

                {/* Site type toggles — driven by legend */}
                {data.legend.siteTypes.map((st) => {
                  const isVisible = visibleSiteTypes[st.type] ?? true;
                  return (
                    <button
                      key={st.type}
                      onClick={() => toggleSiteType(st.type)}
                      className={`flex items-center gap-2 w-full py-1 px-1.5 rounded-md transition-all ${
                        isVisible ? `bg-opacity-10` : "bg-gray-100 opacity-60"
                      }`}
                      style={
                        isVisible
                          ? { backgroundColor: `${st.color}1A` }
                          : undefined
                      }
                    >
                      <span
                        className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full`}
                        style={{
                          backgroundColor: st.color,
                          boxShadow: isVisible
                            ? `0 0 0 4px ${st.color}33`
                            : "none",
                        }}
                      />
                      <span className="text-gray-700 text-xs flex-1 text-left">
                        {st.label}
                      </span>
                      {isVisible ? (
                        <Eye size={14} style={{ color: st.color }} />
                      ) : (
                        <EyeOff size={14} className="text-gray-400" />
                      )}
                    </button>
                  );
                })}

                {/* Pipe type legend items */}
                {data.legend.pipeTypes.length > 0 && (
                  <div className="pt-1 border-t border-gray-200">
                    <p className="text-[10px] text-gray-500 mb-1">Jenis Pipa</p>
                    {data.legend.pipeTypes.map((pt) => (
                      <div
                        key={pt.type}
                        className="flex items-center gap-1.5 text-xs text-gray-600 py-0.5"
                      >
                        <span
                          className="w-6 h-0.5"
                          style={{ backgroundColor: pt.color }}
                        />
                        {pt.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Button */}
      <button
        onClick={() => setFilterOpen(!filterOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 bg-gradient-to-r from-[#115d72] to-[#14a1bb] text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all"
      >
        {filterOpen ? <X size={22} /> : <Filter size={22} />}
      </button>

      {/* Filter Panel - Desktop always visible, Mobile as overlay */}
      <div
        className={`
        lg:col-span-3 lg:pl-6 pt-6 lg:pt-0 border-t lg:border-t-0 lg:border-l border-gray-200
        fixed lg:relative inset-0 lg:inset-auto z-40 lg:z-auto
        bg-white lg:bg-transparent
        transform transition-transform duration-300 ease-in-out
        ${filterOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
        lg:block overflow-y-auto
      `}
      >
        {/* Mobile Filter Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
          <p className="text-lg font-semibold text-gray-900">Filter Map</p>
          <button
            onClick={() => setFilterOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="p-4 lg:p-0">
          <p className="hidden lg:block text-lg font-semibold text-gray-900 mb-6">
            Filter Map
          </p>
          <div className="flex flex-col gap-3 pr-4">
            <FilterAutocomplete
              label="Wilayah"
              options={regionOptions}
              value={selectedRegion}
              onChange={setSelectedRegion}
              placeholder="Pilih Wilayah"
            />
            <FilterAutocomplete
              label="Pemasok"
              options={pemasokNames}
              value={selectedPemasok}
              onChange={setSelectedPemasok}
              placeholder="Pilih Pemasok"
            />
            <FilterAutocomplete
              label="Pembangkit"
              options={pembangkitNames}
              value={selectedPembangkit}
              onChange={setSelectedPembangkit}
              placeholder="Pilih Pembangkit"
            />

            {/* Kepemilikan checkbox filter */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Kepemilikan
              </p>
              <div className="flex flex-col gap-2">
                {OWNER_OPTIONS.map((owner) => (
                  <label
                    key={owner}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={selectedOwners.has(owner)}
                      onChange={() => toggleOwner(owner)}
                      className="w-4 h-4 rounded border-gray-300 text-[#115d72] focus:ring-[#14a2bb] cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                      {owner}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Overlay */}
      {filterOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setFilterOpen(false)}
        />
      )}
    </div>
  );
}
