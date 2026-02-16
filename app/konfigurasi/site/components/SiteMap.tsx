"use client";

import { useState, useMemo } from "react";
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
  MapPin,
  Filter,
  ChevronDown,
  ChevronUp,
  Layers,
  X,
  Power,
  PowerOff,
} from "lucide-react";
import { getAccessToken } from "@/lib/auth";

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

// Types based on API response
interface MapSite {
  id: string;
  name: string;
  siteType: "PEMBANGKIT" | "PEMASOK" | "TRANSPORTIR" | "TERMINAL" | "HANDOVER_POINT";
  lat: number;
  lng: number;
  region: string;
  isEnabled: boolean;
}

interface MapPipe {
  id: string;
  sourceSiteId: string;
  targetSiteId: string;
  relationType: string;
  status: string;
  commodity: string;
}

interface SiteTypeLegend {
  type: string;
  label: string;
  color: string;
}

interface PipeTypeLegend {
  type: string;
  label: string;
  color: string;
}

interface MapLegend {
  siteTypes: SiteTypeLegend[];
  pipeTypes: PipeTypeLegend[];
}

interface MapLocationsResponse {
  sites: MapSite[];
  pipes: MapPipe[];
  legend: MapLegend;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  meta?: { requestId: string; timestamp: string };
}

const SITE_API_HOST = "http://localhost:3005/api";

async function mapFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${SITE_API_HOST}${path}`;
  const accessToken = getAccessToken();

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = (await res.json()) as ApiResponse;
      if (body.error) msg = body.error;
      else if (body.message) msg = body.message;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(msg);
  }

  const body = (await res.json()) as ApiResponse<T>;

  if (!body.success) {
    throw new Error(body.error || body.message || "Unknown API error");
  }

  return body.data;
}

async function updateSiteStatus(siteId: string, isEnabled: boolean): Promise<void> {
  return mapFetch(`/sites/${siteId}`, {
    method: "PATCH",
    body: JSON.stringify({ is_enabled: isEnabled }),
  });
}

const createCustomIcon = (color: string) =>
  L.divIcon({
    className: "",
    html: `
      <div style="
        background:${color};
        width:20px;
        height:20px;
        border-radius:50%;
        border:3px solid white;
        box-shadow:0 0 0 4px ${color}33;
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });

// Create icons for each site type
const createIcons = (legend: MapLegend): Record<string, L.DivIcon> => {
  const icons: Record<string, L.DivIcon> = {};
  legend.siteTypes.forEach((siteType) => {
    icons[siteType.type] = createCustomIcon(siteType.color);
  });
  return icons;
};

export default function SiteMap() {
  const [showPembangkit, setShowPembangkit] = useState(true);
  const [showPemasok, setShowPemasok] = useState(true);
  const [showTransportir, setShowTransportir] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showHandoverPoint, setShowHandoverPoint] = useState(true);
  const [showActive, setShowActive] = useState(true);
  const [showInactive, setShowInactive] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [legendExpanded, setLegendExpanded] = useState(false);
  const [showPipes, setShowPipes] = useState(true);
  const [updatingSiteId, setUpdatingSiteId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const [data, setData] = useState<MapLocationsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch map locations data
  useState(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await mapFetch<MapLocationsResponse>(
          "/dashboard/map-locations"
        );
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load map data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  });

  // Get unique regions
  const regions = useMemo(() => {
    if (!data?.sites) return [];
    const uniqueRegions = Array.from(
      new Set(data.sites.map((site) => site.region))
    ).filter(Boolean);
    return uniqueRegions.sort();
  }, [data]);

  // Get icons based on legend
  const icons = useMemo(() => {
    if (!data?.legend) return {} as Record<string, L.DivIcon>;
    return createIcons(data.legend);
  }, [data]);

  // Filter sites based on filters
  const filteredSites = useMemo(() => {
    if (!data?.sites) return [];
    
    return data.sites.map((site) => ({
      ...site,
      isEnabled: updatingSiteId === site.id ? !site.isEnabled : site.isEnabled, // Show opposite status during update
    })).filter((site) => {
      // Filter by site type
      if (site.siteType === "PEMBANGKIT" && !showPembangkit)
        return false;
      if (site.siteType === "PEMASOK" && !showPemasok) return false;
      if (site.siteType === "TRANSPORTIR" && !showTransportir)
        return false;
      if (site.siteType === "TERMINAL" && !showTerminal) return false;
      if (site.siteType === "HANDOVER_POINT" && !showHandoverPoint)
        return false;

      // Filter by status
      if (site.isEnabled && !showActive) return false;
      if (!site.isEnabled && !showInactive) return false;

      // Filter by region
      if (selectedRegion && site.region !== selectedRegion) return false;

      return true;
    });
  }, [
    data,
    showPembangkit,
    showPemasok,
    showTransportir,
    showTerminal,
    showHandoverPoint,
    showActive,
    showInactive,
    selectedRegion,
    updatingSiteId,
  ]);

  // Handle toggle site status
  const handleToggleSiteStatus = async (siteId: string, currentStatus: boolean) => {
    try {
      setUpdatingSiteId(siteId);
      setUpdateError(null);
      await updateSiteStatus(siteId, !currentStatus);
      // Refresh data after update
      const response = await mapFetch<MapLocationsResponse>("/dashboard/map-locations");
      setData(response);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Gagal mengubah status site");
    } finally {
      setUpdatingSiteId(null);
    }
  };

  // Filter pipes based on visible sites
  const filteredPipes = useMemo(() => {
    if (!data?.pipes || !showPipes) return [];
    
    const visibleSiteIds = new Set(filteredSites.map((s) => s.id));
    
    return data.pipes.filter((pipe) =>
      visibleSiteIds.has(pipe.sourceSiteId) &&
      visibleSiteIds.has(pipe.targetSiteId)
    );
  }, [data, filteredSites, showPipes]);

  // Get site type label
  const getSiteTypeLabel = (type: string) => {
    const siteType = data?.legend.siteTypes.find((st) => st.type === type);
    return siteType?.label || type;
  };

  // Get site type color
  const getSiteTypeColor = (type: string) => {
    const siteType = data?.legend.siteTypes.find((st) => st.type === type);
    return siteType?.color || "#999999";
  };

  // Get pipe type label
  const getPipeTypeLabel = (type: string) => {
    const pipeType = data?.legend.pipeTypes.find((pt) => pt.type === type);
    return pipeType?.label || type;
  };

  // Get pipe type color
  const getPipeTypeColor = (type: string) => {
    const pipeType = data?.legend.pipeTypes.find((pt) => pt.type === type);
    return pipeType?.color || "#999999";
  };

  // Get status label
  const getStatusLabel = (isEnabled: boolean) => {
    return isEnabled ? "Aktif" : "Nonaktif";
  };

  // Get status color
  const getStatusColor = (isEnabled: boolean) => {
    return isEnabled ? "text-green-600" : "text-red-600";
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-center h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#115d72] mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Memuat peta...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-center h-[400px]">
        <div className="text-center">
          <X size={48} className="text-red-400 mx-auto mb-3" />
          <p className="text-gray-700 text-sm font-medium mb-1">Gagal Memuat Data</p>
          <p className="text-gray-500 text-xs">{error}</p>
        </div>
      </div>
    );
  }

  if (updateError) {
    return (
      <div className="fixed top-4 right-4 z-[2000] max-w-sm">
        <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <X size={20} className="text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 mb-1">
                Gagal Mengubah Status
              </p>
              <p className="text-xs text-red-600">{updateError}</p>
            </div>
          </div>
          <button
            onClick={() => setUpdateError(null)}
            className="absolute top-2 right-2 text-red-600 hover:bg-red-100 p-1 rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-1.5">
          <MapPin size={20} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Peta Lokasi Site
          </span>
        </div>
        <button
          onClick={() => setLegendExpanded(!legendExpanded)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Filter size={16} />
          <span>Filter</span>
          {legendExpanded ? (
            <ChevronUp size={16} />
          ) : (
            <ChevronDown size={16} />
          )}
        </button>
      </div>

      {/* Legend/Filters */}
      {legendExpanded && data?.legend && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Site Type Filters */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Layers size={16} className="text-gray-500" />
                <span className="text-xs font-medium text-gray-700">
                  Jenis Site
                </span>
              </div>
              <div className="space-y-1.5">
                {data.legend.siteTypes.map((siteType) => {
                  const isChecked = (() => {
                    switch (siteType.type) {
                      case "PEMBANGKIT":
                        return showPembangkit;
                      case "PEMASOK":
                        return showPemasok;
                      case "TRANSPORTIR":
                        return showTransportir;
                      case "TERMINAL":
                        return showTerminal;
                      case "HANDOVER_POINT":
                        return showHandoverPoint;
                      default:
                        return true;
                    }
                  })();

                  const handleCheck = (checked: boolean) => {
                    switch (siteType.type) {
                      case "PEMBANGKIT":
                        setShowPembangkit(checked);
                        break;
                      case "PEMASOK":
                        setShowPemasok(checked);
                        break;
                      case "TRANSPORTIR":
                        setShowTransportir(checked);
                        break;
                      case "TERMINAL":
                        setShowTerminal(checked);
                        break;
                      case "HANDOVER_POINT":
                        setShowHandoverPoint(checked);
                        break;
                    }
                  };

                  return (
                    <label
                      key={siteType.type}
                      className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleCheck(e.target.checked)}
                        className="w-4 h-4 text-[#115d72] rounded border-gray-300 focus:ring-[#14a2bb]"
                      />
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: siteType.color }}
                        />
                        {siteType.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Status Filters */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Filter size={16} className="text-gray-500" />
                <span className="text-xs font-medium text-gray-700">
                  Status
                </span>
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showActive}
                    onChange={(e) => setShowActive(e.target.checked)}
                    className="w-4 h-4 text-[#115d72] rounded border-gray-300 focus:ring-[#14a2bb]"
                  />
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                    Aktif
                  </span>
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="w-4 h-4 text-[#115d72] rounded border-gray-300 focus:ring-[#14a2bb]"
                  />
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    Nonaktif
                  </span>
                </label>
              </div>
            </div>

            {/* Region Filter */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={16} className="text-gray-500" />
                <span className="text-xs font-medium text-gray-700">
                  Region
                </span>
              </div>
              <select
                value={selectedRegion || ""}
                onChange={(e) =>
                  setSelectedRegion(e.target.value || null)
                }
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] focus:border-transparent bg-white"
              >
                <option value="">Semua Region</option>
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            {/* Pipe Toggle */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Layers size={16} className="text-gray-500" />
                <span className="text-xs font-medium text-gray-700">
                  Pipa
                </span>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPipes}
                  onChange={(e) => setShowPipes(e.target.checked)}
                  className="w-4 h-4 text-[#115d72] rounded border-gray-300 focus:ring-[#14a2bb]"
                />
                <span>Tampilkan Pipa</span>
              </label>
            </div>

            {/* Stats */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Layers size={16} className="text-gray-500" />
                <span className="text-xs font-medium text-gray-700">
                  Statistik
                </span>
              </div>
              <div className="space-y-1.5 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Total Site:</span>
                  <span className="font-medium">{filteredSites.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Pipa:</span>
                  <span className="font-medium">{filteredPipes.length}</span>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Layers size={16} className="text-gray-500" />
                <span className="text-xs font-medium text-gray-700">
                  Legenda
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1.5">
                    Jenis Site
                  </p>
                  <div className="space-y-1">
                    {data.legend.siteTypes.map((siteType) => (
                      <div
                        key={siteType.type}
                        className="flex items-center gap-1.5 text-xs text-gray-600"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: siteType.color }}
                        />
                        {siteType.label}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1.5">
                    Jenis Pipa
                  </p>
                  <div className="space-y-1">
                    {data.legend.pipeTypes.map((pipeType) => (
                      <div
                        key={pipeType.type}
                        className="flex items-center gap-1.5 text-xs text-gray-600"
                      >
                        <span
                          className="w-8 h-0.5"
                          style={{ backgroundColor: pipeType.color }}
                        />
                        {pipeType.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="relative h-[400px] w-full">
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

          {/* Pipes */}
          {showPipes &&
            filteredPipes.map((pipe) => {
              const sourceSite = filteredSites.find(
                (s) => s.id === pipe.sourceSiteId
              );
              const targetSite = filteredSites.find(
                (s) => s.id === pipe.targetSiteId
              );

              if (!sourceSite || !targetSite) return null;

              const pipeColor = getPipeTypeColor(pipe.relationType);

              return (
                <Polyline
                  key={pipe.id}
                  positions={[
                    [sourceSite.lat, sourceSite.lng] as LatLngTuple,
                    [targetSite.lat, targetSite.lng] as LatLngTuple,
                  ]}
                  color={pipeColor}
                  weight={3}
                  opacity={0.7}
                >
                  <Tooltip>
                    <div className="text-xs">
                      <p className="font-medium mb-1">
                        {getPipeTypeLabel(pipe.relationType)}
                      </p>
                      <p>Komoditas: {pipe.commodity}</p>
                      <p>Status: {pipe.status}</p>
                    </div>
                  </Tooltip>
                </Polyline>
              );
            })}

          {/* Site Markers */}
          {filteredSites.map((site) => {
            const icon = icons[site.siteType];
            const isUpdating = updatingSiteId === site.id;
            const displayStatus = isUpdating ? !site.isEnabled : site.isEnabled;
            
            return (
              <Marker
                key={site.id}
                position={[site.lat, site.lng] as LatLngTuple}
                icon={icon}
                opacity={displayStatus ? 1 : 0.5}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: getSiteTypeColor(site.siteType),
                          opacity: displayStatus ? 1 : 0.5,
                        }}
                      />
                      <p
                        className={`font-semibold text-sm`}
                        style={{
                          color: getSiteTypeColor(site.siteType),
                          opacity: displayStatus ? 1 : 0.6,
                        }}
                      >
                        {getSiteTypeLabel(site.siteType)}
                      </p>
                    </div>
                    <p className="text-base font-medium text-gray-900 mb-2">
                      {site.name}
                    </p>
                    <div className="space-y-1 text-sm text-gray-700">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Region:</span>
                        <span>{site.region}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span className={getStatusColor(displayStatus)}>
                          {getStatusLabel(displayStatus)}
                          {isUpdating && (
                            <span className="ml-2 text-xs text-gray-400">
                              (memperbarui...)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Koordinat:</span>
                        <span>
                          {site.lat?.toFixed(4)}, {site.lng?.toFixed(4)}
                        </span>
                      </div>
                    </div>
                    {/* Toggle Status Button */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => handleToggleSiteStatus(site.id, site.isEnabled)}
                        disabled={isUpdating}
                        className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          isUpdating
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : displayStatus
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-green-50 text-green-600 hover:bg-green-100"
                        }`}
                      >
                        {isUpdating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300 mx-auto"></div>
                            <span>Memperbarui...</span>
                          </>
                        ) : displayStatus ? (
                          <>
                            <PowerOff size={16} />
                            <span>Nonaktifkan Site</span>
                          </>
                        ) : (
                          <>
                            <Power size={16} />
                            <span>Aktifkan Site</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* No data message */}
        {filteredSites.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-[1000]">
            <div className="text-center">
              <MapPin size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                Tidak ada site yang ditampilkan
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Coba ubah filter atau tambah site baru
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
