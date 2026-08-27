"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
  Truck,
  Ship,
  Search,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import FilterAutocomplete from "./FilterAutocomplete";
import {
  useMapLocations,
  type MapSite,
  type MapLegend,
} from "@/hooks/service/dashboard-api";
import { useBbmSitesSummary } from "@/hooks/service/bbm-api";
import { useRelations, useSites } from "@/hooks/service/site-api";
import { useBbmMonthly } from "@/hooks/service/bbm-api";
import { useKertasKerjaMaster } from "@/hooks/service/kertas-kerja-api";
import { usePrivilege } from "@/hooks/usePrivilege";

interface LeafletIconPrototype {
  _getIconUrl?: () => string;
}

if (
  typeof window !== "undefined" &&
  typeof L !== "undefined" &&
  L?.Icon?.Default
) {
  delete (L.Icon.Default.prototype as LeafletIconPrototype)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

// ---------------------------------------------------------------------------
// Category Helper & Icon Definitions (matching Gas Pipa teardrop style)
// ---------------------------------------------------------------------------

function getSiteCategoryKey(
  siteType: string,
  commodity?: string | null,
): string {
  if (siteType === "TRANSPORTIR") return "TRANSPORTIR";
  if (siteType === "TERMINAL") return "TERMINAL";
  if (siteType === "HANDOVER_POINT") return "HANDOVER_POINT";

  const commNorm = (commodity || "").toUpperCase().trim();
  if (commNorm.includes("GAS") || commNorm.includes("PIPA")) {
    return `${siteType}_GAS_PIPA`;
  }
  if (commNorm.includes("LNG")) {
    return `${siteType}_LNG`;
  }
  if (commNorm.includes("BBM")) {
    return `${siteType}_BBM`;
  }
  return `${siteType}_BBM`;
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; color: string; svg: string }
> = {
  PEMBANGKIT_BBM: {
    label: "Pembangkit (BBM)",
    color: "#1581fb", // Blue for Pembangkit BBM
    svg: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h20"/><path d="M20 18v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M3 18v-8l7-5v13"/><path d="M14 10V4h3v3"/></svg>`,
  },
  PEMBANGKIT_LNG: {
    label: "Pembangkit (LNG)",
    color: "#1581fb", // Blue
    svg: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h20"/><path d="M20 18v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M3 18v-8l7-5v13"/><path d="M14 10V4h3v3"/></svg>`,
  },
  PEMBANGKIT_GAS_PIPA: {
    label: "Pembangkit (Gas Pipa)",
    color: "#13778e", // Teal
    svg: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h20"/><path d="M20 18v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M3 18v-8l7-5v13"/><path d="M14 10V4h3v3"/></svg>`,
  },
  PEMASOK_BBM: {
    label: "TBBM / Pemasok",
    color: "#EF4444", // Red for TBBM / Pemasok BBM
    svg: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"/><path d="M15 10h4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-1"/><path d="M7 11V7h4v4"/></svg>`,
  },
  PEMASOK_LNG: {
    label: "Pemasok (LNG)",
    color: "#3B82F6", // Blue
    svg: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
  },
  PEMASOK_GAS_PIPA: {
    label: "Pemasok (Gas Pipa)",
    color: "#06B6D4", // Cyan
    svg: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/></svg>`,
  },
  TRANSPORTIR: {
    label: "Transportir",
    color: "#F59E0B", // Amber
    svg: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
  },
};

const createCategoryIcon = (catKey: string, fallbackColor: string) => {
  const config = CATEGORY_CONFIG[catKey] || {
    color: fallbackColor,
    svg: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.2"><circle cx="12" cy="12" r="8"/></svg>`,
  };

  return L.divIcon({
    className: "custom-site-marker",
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${config.color};
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 3px 8px rgba(0,0,0,0.35);
        cursor: pointer;
      ">
        <div style="
          transform: rotate(45deg);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${config.svg}
        </div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -28],
  });
};

const buildIcons = (legend: MapLegend): Record<string, L.DivIcon> => {
  const icons: Record<string, L.DivIcon> = {};
  legend.siteTypes.forEach((st) => {
    const catKey = getSiteCategoryKey(st.type, null);
    icons[st.type] = createCategoryIcon(catKey, st.color);
  });
  return icons;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Map() {
  const mapRef = useRef<HTMLDivElement>(null);

  const filterExportButtons = (node: HTMLElement) => {
    if (node?.classList?.contains("export-buttons-container")) return false;
    return true;
  };

  const handleExportImage = async () => {
    if (!mapRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(mapRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        filter: filterExportButtons as any,
      });
      const link = document.createElement("a");
      link.download = `peta-bbm-${new Date().toISOString().split("T")[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export image", err);
    }
  };

  const handleExportPDF = async () => {
    if (!mapRef.current) return;
    try {
      const canvas = await htmlToImage.toCanvas(mapRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        filter: filterExportButtons as any,
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("l", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 10, pdfWidth, pdfHeight);

      pdf.addPage();
      pdf.setFontSize(14);
      pdf.text(
        "Breakdown Relasi Pembangkit dan TBBM Berdasarkan Region",
        14,
        15,
      );

      const exportPipes = data?.pipes
        ? data.pipes.filter((pipe) => {
          const visibleIds = new Set(filteredSites.map((s) => s.id));
          if (
            !visibleIds.has(pipe.sourceSiteId) ||
            !visibleIds.has(pipe.targetSiteId)
          )
            return false;

          if (selectedModes.length > 0) {
            const modeMatch = selectedModes.some((mode) => {
              return (
                pipe.relationType?.toLowerCase() === mode.toLowerCase() ||
                pipe.relationType?.toLowerCase()?.includes(mode.toLowerCase())
              );
            });
            if (!modeMatch) return false;
          }

          return true;
        })
        : [];

      const relationships = exportPipes.reduce(
        (acc, pipe) => {
          const source = getSiteById(pipe.sourceSiteId);
          const target = getSiteById(pipe.targetSiteId);
          if (!source || !target) return acc;

          const region = target.region || source.region || "Unknown Region";

          if (!acc[region]) {
            acc[region] = [];
          }

          acc[region].push({
            sourceName: source.name,
            targetName: target.name,
            commodity: pipe.commodity,
            status: pipe.status,
          });

          return acc;
        },
        {} as Record<string, any[]>,
      );

      let startY = 25;

      Object.keys(relationships)
        .sort()
        .forEach((region) => {
          pdf.setFontSize(12);
          pdf.text(`Region: ${region}`, 14, startY);
          startY += 5;

          const regionData = relationships[region].map((rel, index) => [
            index + 1,
            rel.targetName,
            rel.sourceName,
            rel.commodity || "-",
          ]);

          autoTable(pdf, {
            startY: startY,
            head: [["No", "Pembangkit", "TBBM", "Komoditas"]],
            body: regionData,
            theme: "grid",
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            styles: { fontSize: 10 },
            margin: { left: 14, right: 14 },
          });

          startY = (pdf as any).lastAutoTable.finalY + 15;

          if (startY > pdf.internal.pageSize.getHeight() - 20) {
            pdf.addPage();
            startY = 20;
          }
        });

      pdf.save(`peta-bbm-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error("Failed to export PDF", err);
    }
  };

  // ---- API data -----------------------------------------------------------
  const { data, isLoading: isMapLoading, isError, error } = useMapLocations();
  const { data: bbmSites } = useSites({ commodity: "BBM" });

  const { hasPrivilege } = usePrivilege();
  const canReadSites = hasPrivilege("site_management", "READ");
  const { data: relations } = useRelations(true, {
    enabled: canReadSites,
  }); // fetch active relations only if permitted

  // ---- UI state -----------------------------------------------------------
  const [legendExpanded, setLegendExpanded] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [modalSiteList, setModalSiteList] = useState<{
    title: string;
    siteName?: string;
    siteType?: string;
    list: {
      id: string;
      name: string;
      siteType?: string;
      totalNominasi?: number;
      totalRealisasi?: number;
      totalPemakaian?: number;
      [key: string]: any;
    }[];
  } | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState("");

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
  const [showPipes, setShowPipes] = useState(false);

  // Filter states
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedPemasok, setSelectedPemasok] = useState<string | null>(null);
  const [selectedPembangkit, setSelectedPembangkit] = useState<string | null>(
    null,
  );

  const [selectedModes, setSelectedModes] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const { startDateStr, endDateStr } = useMemo(() => {
    const [year, month] = selectedPeriod.split("-").map(Number);
    const lastDay = new Date(year, month, 0).getDate();

    return {
      startDateStr: `${selectedPeriod}-01`,
      endDateStr: `${selectedPeriod}-${String(lastDay).padStart(2, "0")}`,
    };
  }, [selectedPeriod]);

  const { data: bbmSitesSummary, isLoading: isSummaryLoading } =
    useBbmSitesSummary({
      moda: selectedModes.length > 0 ? selectedModes.join(",") : undefined,
      product:
        selectedProducts.length > 0 ? selectedProducts.join(",") : undefined,
      startDate: startDateStr,
      endDate: endDateStr,
    });

  const { data: masterProductData } = useKertasKerjaMaster(
    "master_product",
    "BBM",
  );
  const { data: bbmMonthlyData } = useBbmMonthly();

  const selectedMonthYearLabel = useMemo(() => {
    const [year, month] = selectedPeriod.split("-").map(Number);
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${months[month - 1]} ${year}`;
  }, [selectedPeriod]);

  const filterProductOptions = useMemo(() => {
    if (!masterProductData) return [];
    return masterProductData.map((p) => p.name).sort();
  }, [masterProductData]);

  const filterModaOptions = useMemo(() => {
    if (!bbmMonthlyData) return [];
    return Array.from(
      new Set(bbmMonthlyData.map((r) => r.moda).filter(Boolean) as string[]),
    ).sort();
  }, [bbmMonthlyData]);

  const isLoading = isMapLoading || isSummaryLoading;

  const bbmSiteIds = useMemo(
    () => new Set(bbmSites?.map((s) => s.id) || []),
    [bbmSites],
  );

  // ---- Derived data -------------------------------------------------------
  const customLegend = useMemo(() => {
    if (!data?.legend) return undefined;
    return {
      ...data.legend,
      siteTypes: data.legend.siteTypes.map((st) => {
        if (st.type === "PEMASOK") return { ...st, color: "#ef4444" };
        if (st.type === "PEMBANGKIT") return { ...st, color: "#3b82f6" };
        return st;
      }),
    };
  }, [data?.legend]);

  const icons = useMemo(() => {
    if (!customLegend) return {} as Record<string, L.DivIcon>;
    return buildIcons(customLegend);
  }, [customLegend]);

  // ---- Relational Filtering Helpers ---------------------------------------
  const getConnectedSet = useCallback(
    (siteName: string, siteType: string) => {
      if (!data?.sites || !relations) return null;
      const site = data.sites.find(
        (s) => s.siteType === siteType && s.name === siteName,
      );
      if (!site) return null;

      const connected = new Set<string>();
      connected.add(site.id);
      relations.forEach((rel) => {
        if (rel.source_site_id === site.id) connected.add(rel.target_site_id);
        if (rel.target_site_id === site.id) connected.add(rel.source_site_id);
      });
      return connected;
    },
    [data?.sites, relations],
  );

  const intersect = useCallback((sets: (Set<string> | null)[]) => {
    const activeSets = sets.filter((s): s is Set<string> => s !== null);
    if (activeSets.length === 0) return null;
    let result = new Set(activeSets[0]);
    for (let i = 1; i < activeSets.length; i++) {
      result = new Set([...result].filter((x) => activeSets[i].has(x)));
    }
    return result;
  }, []);

  const pemasokSet = useMemo(
    () =>
      selectedPemasok ? getConnectedSet(selectedPemasok, "PEMASOK") : null,
    [selectedPemasok, getConnectedSet],
  );
  const pembangkitSet = useMemo(
    () =>
      selectedPembangkit
        ? getConnectedSet(selectedPembangkit, "PEMBANGKIT")
        : null,
    [selectedPembangkit, getConnectedSet],
  );

  const regionSet = useMemo(() => {
    if (!selectedRegion || !data?.sites) return null;
    const regionSites = data.sites.filter((s) => s.region === selectedRegion);
    const rSet = new Set<string>();
    regionSites.forEach((s) => {
      rSet.add(s.id);
      if (relations) {
        relations.forEach((rel) => {
          if (rel.source_site_id === s.id) rSet.add(rel.target_site_id);
          if (rel.target_site_id === s.id) rSet.add(rel.source_site_id);
        });
      }
    });
    return rSet;
  }, [selectedRegion, data?.sites, relations]);

  // Unique region list for filter dropdown
  const regionOptions = useMemo(() => {
    if (!data?.sites) return [];
    const validIds = intersect([pemasokSet, pembangkitSet]);

    let validSites = data.sites;
    if (validIds) {
      validSites = validSites.filter((s) => validIds.has(s.id));
    }
    return Array.from(new Set(validSites.map((s) => s.region)))
      .filter(Boolean)
      .sort();
  }, [data?.sites, pemasokSet, pembangkitSet, intersect]);

  // Names for autocomplete filters
  const pemasokNames = useMemo(() => {
    if (!data?.sites) return [];
    const validIds = intersect([regionSet, pembangkitSet]);

    let validSites = data.sites.filter((s) => s.siteType === "PEMASOK");
    if (validIds) {
      validSites = validSites.filter((s) => validIds.has(s.id));
    }
    return validSites.map((s) => s.name).sort();
  }, [data?.sites, regionSet, pembangkitSet, intersect]);

  const pembangkitNames = useMemo(() => {
    if (!data?.sites) return [];
    const validIds = intersect([regionSet, pemasokSet]);

    let validSites = data.sites.filter((s) => s.siteType === "PEMBANGKIT");
    if (validIds) {
      validSites = validSites.filter((s) => validIds.has(s.id));
    }
    return validSites.map((s) => s.name).sort();
  }, [data?.sites, regionSet, pemasokSet, intersect]);

  // Reset pembangkit when current selection is no longer valid
  useEffect(() => {
    if (selectedRegion && !regionOptions.includes(selectedRegion)) {
      setSelectedRegion(null);
    }
  }, [regionOptions, selectedRegion]);

  useEffect(() => {
    if (selectedPemasok && !pemasokNames.includes(selectedPemasok)) {
      setSelectedPemasok(null);
    }
  }, [pemasokNames, selectedPemasok]);

  useEffect(() => {
    if (selectedPembangkit && !pembangkitNames.includes(selectedPembangkit)) {
      setSelectedPembangkit(null);
    }
  }, [pembangkitNames, selectedPembangkit]);

  // Filtered sites
  const filteredSites = useMemo(() => {
    if (!data?.sites || !bbmSites) return [];
    const validIds = intersect([regionSet, pemasokSet, pembangkitSet]);

    return data.sites.filter((site) => {
      // Only show sites that belong to BBM commodity
      if (!bbmSiteIds.has(site.id)) return false;

      if (!visibleSiteTypes[site.siteType]) return false;

      if (validIds && !validIds.has(site.id)) return false;

      if (Number(site.lat) === 0 || Number(site.lng) === 0) return false;

      if (bbmSitesSummary) {
        const summary = bbmSitesSummary.find((s) => s.id === site.id);
        if (summary) {
          const totalNom = summary.totalNominasi || 0;
          const totalReal = summary.totalRealisasi || 0;
          const totalPem = summary.totalPemakaian || 0;
          if (totalNom === 0 && totalReal === 0 && totalPem === 0) {
            return false;
          }
        } else {
          return false;
        }
      }

      return true;
    });
  }, [
    data?.sites,
    bbmSites,
    bbmSiteIds,
    visibleSiteTypes,
    regionSet,
    pemasokSet,
    pembangkitSet,
    intersect,
    bbmSitesSummary,
  ]);

  // Filtered pipes – show only if both source and target are visible
  const filteredPipes = useMemo(() => {
    if (!data?.pipes || !showPipes) return [];
    const visibleIds = new Set(filteredSites.map((s) => s.id));
    return data.pipes.filter((pipe) => {
      if (
        !visibleIds.has(pipe.sourceSiteId) ||
        !visibleIds.has(pipe.targetSiteId)
      )
        return false;

      // Client-side Mode Type filter: Pipeline, Truck, Vessel
      if (selectedModes.length > 0) {
        const modeMatch = selectedModes.some((mode) => {
          return (
            pipe.relationType?.toLowerCase() === mode.toLowerCase() ||
            pipe.relationType?.toLowerCase()?.includes(mode.toLowerCase())
          );
        });
        if (!modeMatch) return false;
      }

      return true;
    });
  }, [data?.pipes, filteredSites, showPipes, selectedModes]);

  // ---- helpers ------------------------------------------------------------
  const getSiteTypeLabel = (type: string) => {
    if (type === "PEMASOK") return "TBBM";
    return (
      customLegend?.siteTypes.find((st) => st.type === type)?.label || type
    );
  };

  const getSiteTypeColor = (type: string) =>
    customLegend?.siteTypes.find((st) => st.type === type)?.color || "#999999";

  const getPipeTypeColor = (relationType: string) =>
    customLegend?.pipeTypes.find((pt) => pt.type === relationType)?.color ||
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
            className="animate-spin text-primary mx-auto mb-3"
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
        <div ref={mapRef} className="bg-white pb-2">
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">
                Titik Lokasi TBBM dan Pembangkit
              </h3>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                {selectedMonthYearLabel}
              </span>
            </div>
            <div className="export-buttons-container flex items-center gap-2 bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={handleExportImage}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-emerald-500 hover:bg-emerald-50 flex items-center gap-1.5 transition-all duration-200"
                title="Export as Image (PNG)"
              >
                <ImageIcon size={14} />
                PNG
              </button>
              <button
                onClick={handleExportPDF}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-rose-400 hover:bg-rose-50 flex items-center gap-1.5 transition-all duration-200"
                title="Export as PDF"
              >
                <FileText size={14} />
                PDF
              </button>
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
                        [Number(source.lat), Number(source.lng)] as LatLngTuple,
                        [Number(target.lat), Number(target.lng)] as LatLngTuple,
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
                const catKey = getSiteCategoryKey(
                  site.siteType,
                  site.commodity,
                );
                const info = CATEGORY_CONFIG[catKey] || {
                  label: getSiteTypeLabel(site.siteType),
                  color: getSiteTypeColor(site.siteType),
                  svg: "",
                };
                const icon = createCategoryIcon(catKey, info.color);
                const summary = bbmSitesSummary?.find((s) => s.id === site.id);
                const connected = getConnectedSites(site.id);

                return (
                  <Marker
                    key={site.id}
                    position={
                      [Number(site.lat), Number(site.lng)] as LatLngTuple
                    }
                    icon={icon}
                  >
                    <Popup>
                      <div className="min-w-[190px]">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: info.color }}
                          >
                            <span
                              className="scale-75"
                              dangerouslySetInnerHTML={{ __html: info.svg }}
                            />
                          </span>
                          <p
                            className="font-semibold text-xs uppercase tracking-wider"
                            style={{ color: info.color }}
                          >
                            {info.label}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-gray-800">
                          {site.name}
                        </p>
                        <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                          {(site.siteType === "PEMASOK" ||
                            site.siteType === "PEMBANGKIT") && (
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">
                                  {site.siteType === "PEMASOK"
                                    ? "Jumlah Pembangkit:"
                                    : "Jumlah TBBM:"}
                                </span>
                                <span className="font-medium text-gray-700">
                                  {site.siteType === "PEMASOK"
                                    ? summary?.pembangkitList?.length || 0
                                    : summary?.pemasokList?.length || 0}
                                </span>
                              </div>
                            )}
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Region:</span>
                            <span className="font-medium text-gray-700">
                              {site.region}
                            </span>
                          </div>
                          {site.siteType === "PEMBANGKIT" && site.capacity && (
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Kapasitas:</span>
                              <span className="font-medium text-primary">
                                {parseFloat(site.capacity).toLocaleString("id-ID", { maximumFractionDigits: 2 })} MW
                              </span>
                            </div>
                          )}
                          {site.siteType === "PEMBANGKIT" && site.owner && (
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">
                                Kepemilikan:
                              </span>
                              <span className="font-medium text-gray-700">
                                {site.owner}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Koordinat:</span>
                            <span className="font-medium text-gray-700">
                              {site.lat != null
                                ? Number(site.lat).toFixed(4)
                                : ""}
                              ,{" "}
                              {site.lng != null
                                ? Number(site.lng).toFixed(4)
                                : ""}
                            </span>
                          </div>
                        </div>

                        {(() => {
                          if (!summary) return null;

                          return (
                            <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">
                                  Total Nominasi:
                                </span>
                                <span className="font-medium text-primary">
                                  {summary.totalNominasi?.toLocaleString("id-ID", { maximumFractionDigits: 2 })} kL
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">
                                  Total Penyaluran:
                                </span>
                                <span className="font-medium text-emerald-600">
                                  {summary.totalRealisasi?.toLocaleString("id-ID", { maximumFractionDigits: 2 })} kL
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-500">
                                  Total Pemakaian:
                                </span>
                                <span className="font-medium text-amber-600">
                                  {summary.totalPemakaian?.toLocaleString("id-ID", { maximumFractionDigits: 2 })} kL
                                </span>
                              </div>

                              {summary.pembangkitList &&
                                summary.pembangkitList.length > 0 && (
                                  <button
                                    onClick={() => {
                                      setModalSiteList({
                                        title: "Daftar Pembangkit",
                                        siteName: site.name,
                                        siteType: site.siteType,
                                        list: summary.pembangkitList!,
                                      });
                                      setModalSearchQuery("");
                                    }}
                                    className="w-full mt-2 py-1.5 px-2 bg-primary/10 hover:bg-primary/20 text-primary rounded text-xs font-semibold transition-colors"
                                  >
                                    Lihat Daftar Pembangkit
                                  </button>
                                )}
                              {summary.pemasokList &&
                                summary.pemasokList.length > 0 && (
                                  <button
                                    onClick={() => {
                                      setModalSiteList({
                                        title: "Daftar Pemasok",
                                        siteName: site.name,
                                        siteType: site.siteType,
                                        list: summary.pemasokList!,
                                      });
                                      setModalSearchQuery("");
                                    }}
                                    className="w-full mt-2 py-1.5 px-2 bg-primary/10 hover:bg-primary/20 text-primary rounded text-xs font-semibold transition-colors"
                                  >
                                    Lihat Daftar Pemasok
                                  </button>
                                )}
                            </div>
                          );
                        })()}
                        {connected.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">
                              Relasi:
                            </p>
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
                  <Layers size={16} className="text-primary" />
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

                  {/* Site type toggles — BBM specific */}
                  {["PEMBANGKIT_BBM", "PEMASOK_BBM"].map((catKey) => {
                    const stType = catKey === "PEMBANGKIT_BBM" ? "PEMBANGKIT" : "PEMASOK";
                    const isVisible = visibleSiteTypes[stType] ?? true;
                    const config = CATEGORY_CONFIG[catKey];
                    
                    return (
                      <button
                        key={stType}
                        onClick={() => toggleSiteType(stType)}
                        className={`flex items-center gap-2 w-full py-1 px-1.5 rounded-md transition-all cursor-pointer ${isVisible
                            ? `bg-opacity-10`
                            : "bg-gray-100 opacity-60"
                          }`}
                        style={
                          isVisible
                            ? { backgroundColor: `${config.color}1A` }
                            : undefined
                        }
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: config.color }}
                        >
                          <span
                            className="scale-75"
                            dangerouslySetInnerHTML={{ __html: config.svg }}
                          />
                        </span>
                        <span className="text-gray-700 text-xs flex-1 text-left font-medium truncate">
                          {stType === "PEMBANGKIT" ? "Pembangkit" : "TBBM"}
                        </span>
                        {isVisible ? (
                          <Eye size={14} style={{ color: config.color }} />
                        ) : (
                          <EyeOff size={14} className="text-gray-400" />
                        )}
                      </button>
                    );
                  })}

                  {/* Pipe type legend items */}
                  {customLegend?.pipeTypes &&
                    customLegend.pipeTypes.length > 0 && (
                      <div className="pt-1 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] text-gray-500">Relasi</p>
                          <button
                            onClick={() => setShowPipes(!showPipes)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            {showPipes ? (
                              <Eye size={12} className="text-gray-500" />
                            ) : (
                              <EyeOff size={12} className="text-gray-400" />
                            )}
                          </button>
                        </div>
                        {showPipes &&
                          customLegend.pipeTypes.map((pt) => (
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
      </div>

      {/* Mobile Filter Button */}
      <button
        onClick={() => setFilterOpen(!filterOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 bg-gradient-to-r from-primary to-secondary text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all"
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
            <div>
              <label
                htmlFor="map-bbm-period"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Periode (Bulan & Tahun)
              </label>
              <input
                id="map-bbm-period"
                type="month"
                value={selectedPeriod}
                onChange={(event) => {
                  if (!event.target.value) return;
                  setSelectedPeriod(event.target.value);
                  setModalSiteList(null);
                  setModalSearchQuery("");
                }}
                className="w-full px-3 py-2 rounded-lg text-sm border border-[var(--border)] bg-[var(--surface)] text-gray-700 hover:border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <FilterAutocomplete
              label="Region"
              options={regionOptions}
              value={selectedRegion}
              onChange={setSelectedRegion}
              placeholder="Pilih Region"
            />
            <FilterAutocomplete
              label="TBBM"
              options={pemasokNames}
              value={selectedPemasok}
              onChange={setSelectedPemasok}
              placeholder="Pilih TBBM"
            />
            <FilterAutocomplete
              label="Pembangkit"
              options={pembangkitNames}
              value={selectedPembangkit}
              onChange={setSelectedPembangkit}
              placeholder="Pilih Pembangkit"
            />

            {/* Produk (Mode Type & Product Type buttons) */}
            <div className="border-t border-gray-100 pt-2">
              <p className="text-sm font-semibold text-gray-800 mb-2">
                Moda Transportasi
              </p>
              {/* Mode Type Button Group */}
              <div className="mb-3">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedModes([])}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 cursor-pointer ${selectedModes.length === 0
                        ? "bg-primary text-white"
                        : "text-gray-600 hover:text-secondary hover:bg-gray-50"
                      }`}
                  >
                    All
                  </button>
                  {(filterModaOptions.length > 0
                    ? filterModaOptions
                    : ["Truck", "Vessel", "Pipeline"]
                  ).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setSelectedModes((prev) =>
                          prev.includes(mode)
                            ? prev.filter((m) => m !== mode)
                            : [...prev, mode],
                        );
                      }}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 cursor-pointer ${selectedModes.includes(mode)
                          ? "bg-primary text-white"
                          : "text-gray-600 hover:text-secondary hover:bg-gray-50"
                        }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-800 mb-2">Produk</p>
              {/* Product Type Button Group */}
              <div className="mb-3">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedProducts([])}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 cursor-pointer ${selectedProducts.length === 0
                        ? "bg-primary text-white"
                        : "text-gray-600 hover:text-secondary hover:bg-gray-50"
                      }`}
                  >
                    All
                  </button>
                  {(filterProductOptions.length > 0
                    ? filterProductOptions
                    : ["B30", "B35", "B40", "HSFO", "HSD", "LSFO", "IDO"]
                  ).map((prod) => (
                    <button
                      key={prod}
                      onClick={() => {
                        setSelectedProducts((prev) =>
                          prev.includes(prod)
                            ? prev.filter((p) => p !== prod)
                            : [...prev, prod],
                        );
                      }}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 cursor-pointer ${selectedProducts.includes(prod)
                          ? "bg-primary text-white"
                          : "text-gray-600 hover:text-secondary hover:bg-gray-50"
                        }`}
                    >
                      {prod}
                    </button>
                  ))}
                </div>
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

      {/* Pembangkit / Pemasok List Modal */}
      {modalSiteList && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[85vh] flex flex-col animate-fade-in overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50/50 shrink-0">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full inline-block"></span>
                {modalSiteList.siteName ? (
                  <>
                    <span className="font-medium text-gray-500">
                      {modalSiteList.siteType === "PEMASOK" ? "TBBM" : "Pembangkit"}
                    </span>
                    {modalSiteList.siteName}
                  </>
                ) : (
                  modalSiteList.title
                )}
              </h2>
              <button
                onClick={() => {
                  setModalSiteList(null);
                  setModalSearchQuery("");
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            {(() => {
              const PRODUCTS = filterProductOptions.length > 0 ? filterProductOptions : [
                "HSD",
                "B35",
                "LSFO",
                "B30",
                "B40",
                "HSFO",
                "IDO",
              ];
              const MODES = filterModaOptions.length > 0 ? filterModaOptions : ["Kapal", "Truck", "Pipa", "Lainnya"];

              const handleSiteRedirect = (targetId: string) => {
                const targetSummary = bbmSitesSummary?.find((s) => s.id === targetId);
                if (!targetSummary) return;

                if (targetSummary.siteType === "PEMBANGKIT") {
                  setModalSiteList({
                    title: "Daftar Pemasok",
                    siteName: targetSummary.name,
                    siteType: targetSummary.siteType,
                    list: targetSummary.pemasokList || [],
                  });
                } else if (targetSummary.siteType === "PEMASOK") {
                  setModalSiteList({
                    title: "Daftar Pembangkit",
                    siteName: targetSummary.name,
                    siteType: targetSummary.siteType,
                    list: targetSummary.pembangkitList || [],
                  });
                }
                setModalSearchQuery("");
              };

              const filteredModalList = modalSearchQuery
                ? modalSiteList.list.filter((site) =>
                  site.name
                    .toLowerCase()
                    .includes(modalSearchQuery.toLowerCase()),
                )
                : modalSiteList.list;

              let grandNom = 0;
              let grandReal = 0;
              let grandTerima = 0;
              let grandRenom = 0;
              let grandPem = 0;
              const prodSummary: Record<
                string,
                { nom: number; real: number; terima: number; renom: number; pem: number }
              > = {};
              const modaSummary: Record<string, number> = {};
              const prodModaSummary: Record<
                string,
                Record<string, number>
              > = {};

              PRODUCTS.forEach((p) => {
                prodSummary[p] = { nom: 0, real: 0, terima: 0, renom: 0, pem: 0 };
                prodModaSummary[p] = {};
                MODES.forEach((m) => {
                  prodModaSummary[p][m] = 0;
                });
              });
              MODES.forEach((m) => (modaSummary[m] = 0));

              filteredModalList.forEach((site) => {
                grandNom += site.totalNominasi || 0;
                grandReal += site.totalRealisasi || 0;
                grandTerima += site.totalPenerimaan || 0;
                grandRenom += site.totalRenominasi || 0;
                grandPem += site.totalPemakaian || 0;

                PRODUCTS.forEach((prod) => {
                  prodSummary[prod].nom += site[`totalNominasi${prod}`] || 0;
                  prodSummary[prod].real += site[`totalRealisasi${prod}`] || 0;
                  prodSummary[prod].terima += site[`totalPenerimaan${prod}`] || 0;
                  prodSummary[prod].renom += site[`totalRenominasi${prod}`] || 0;
                  prodSummary[prod].pem += site[`totalPemakaian${prod}`] || 0;

                  MODES.forEach((moda) => {
                    prodModaSummary[prod][moda] +=
                      site[`totalRealisasi${prod}_${moda}`] || 0;
                  });
                });

                MODES.forEach((moda) => {
                  modaSummary[moda] += site[`totalRealisasi${moda}`] || 0;
                });
              });

              const activeProds = PRODUCTS.filter(
                (p) =>
                  prodSummary[p].nom > 0 ||
                  prodSummary[p].real > 0 ||
                  prodSummary[p].terima > 0 ||
                  prodSummary[p].renom > 0 ||
                  prodSummary[p].pem > 0,
              );
              const activeModas = MODES.filter((m) => modaSummary[m] > 0);

              return (
                <div className="flex flex-col md:flex-row-reverse flex-1 overflow-hidden">
                  {/* LEFT SECTION (List) */}
                  <div className="w-full md:w-1/2 flex flex-col bg-white overflow-hidden md:border-l border-gray-200">
                    <div className="flex items-center gap-3 p-4 border-b border-gray-200 shrink-0">
                      <h3 className="text-lg font-bold text-gray-900">
                        {modalSiteList.title}
                      </h3>
                      <div className="bg-orange-50 text-orange-600 font-bold text-xs px-2 py-1 rounded-full border border-orange-200">
                        {filteredModalList.length} unit
                      </div>
                    </div>

                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50 shrink-0">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Cari..."
                          value={modalSearchQuery}
                          onChange={(e) => setModalSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-500 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white"
                        />
                        <Search
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={16}
                        />
                      </div>
                    </div>

                    <div className="p-4 overflow-y-auto flex-1">
                      {filteredModalList.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          Tidak ada data
                        </p>
                      ) : (
                        <ul className="space-y-4">
                          {filteredModalList.map((p, idx) => {
                            const siteActiveProds = PRODUCTS.filter(
                              (prod) =>
                                (p[`totalNominasi${prod}`] || 0) > 0 ||
                                (p[`totalRealisasi${prod}`] || 0) > 0 ||
                                (p[`totalPenerimaan${prod}`] || 0) > 0 ||
                                (p[`totalRenominasi${prod}`] || 0) > 0 ||
                                (p[`totalPemakaian${prod}`] || 0) > 0,
                            );
                            const siteActiveModas = MODES.filter(
                              (moda) => (p[`totalRealisasi${moda}`] || 0) > 0,
                            );

                            return (
                              <li
                                key={p.id || idx}
                                onClick={() => p.id && handleSiteRedirect(p.id)}
                                className="flex flex-col bg-gray-50/50 rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
                              >
                                <div className="flex items-center gap-3 p-3 border-b border-gray-200 bg-gray-50/80">
                                  <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs shrink-0 border border-orange-200">
                                    {idx + 1}
                                  </div>
                                  <span className="font-bold text-gray-800 text-sm">
                                    {p.name}
                                  </span>
                                </div>

                                <div className="grid grid-cols-5 divide-x divide-gray-200 border-b border-gray-200">
                                  <div className="flex flex-col p-3">
                                    <span className="text-[10px] font-bold text-gray-400 mb-1 uppercase">
                                      Nominasi
                                    </span>
                                    <div className="flex items-baseline gap-1">
                                      <span className="font-bold text-gray-800 text-base">
                                        {p.totalNominasi?.toLocaleString("id-ID", { maximumFractionDigits: 2 }) ?? 0}
                                      </span>
                                      <span className="text-xs text-gray-400 font-medium">
                                        kL
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col p-3 bg-white">
                                    <span className="text-[10px] font-bold text-gray-400 mb-1 uppercase">
                                      Penyaluran
                                    </span>
                                    <div className="flex items-baseline gap-1">
                                      <span className="font-bold text-emerald-600 text-base">
                                        {p.totalRealisasi?.toLocaleString("id-ID", { maximumFractionDigits: 2 }) ?? 0}
                                      </span>
                                      <span className="text-xs text-emerald-600/70 font-medium">
                                        kL
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col p-3">
                                    <span className="text-[10px] font-bold text-gray-400 mb-1 uppercase">
                                      Penerimaan
                                    </span>
                                    <div className="flex items-baseline gap-1">
                                      <span className="font-bold text-gray-800 text-base">
                                        {p.totalPenerimaan?.toLocaleString("id-ID", { maximumFractionDigits: 2 }) ?? 0}
                                      </span>
                                      <span className="text-xs text-gray-400 font-medium">
                                        kL
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col p-3 bg-white">
                                    <span className="text-[10px] font-bold text-gray-400 mb-1 uppercase">
                                      Renominasi
                                    </span>
                                    <div className="flex items-baseline gap-1">
                                      <span className="font-bold text-gray-800 text-base">
                                        {p.totalRenominasi?.toLocaleString("id-ID", { maximumFractionDigits: 2 }) ?? 0}
                                      </span>
                                      <span className="text-xs text-gray-400 font-medium">
                                        kL
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col p-3">
                                    <span className="text-[10px] font-bold text-gray-400 mb-1 uppercase">
                                      Pemakaian
                                    </span>
                                    <div className="flex items-baseline gap-1">
                                      <span className="font-bold text-gray-800 text-base">
                                        {p.totalPemakaian?.toLocaleString("id-ID", { maximumFractionDigits: 2 }) ?? 0}
                                      </span>
                                      <span className="text-xs text-gray-400 font-medium">
                                        kL
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Product Breakdown */}
                                {(siteActiveProds.length > 0 ||
                                  siteActiveModas.length > 0) && (
                                    <div className="p-3">
                                      <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase">
                                        Produk & Moda Realisasi
                                      </p>
                                      <div className="flex flex-col gap-3">
                                        {siteActiveProds.map((prod) => (
                                          <div
                                            key={prod}
                                            className="flex flex-col gap-2"
                                          >
                                            <div className="flex items-center gap-4">
                                              <span className="font-bold text-gray-800 text-sm w-8">
                                                {prod}
                                              </span>
                                              <div className="flex items-center gap-4 text-xs">
                                                <div className="flex flex-col items-center">
                                                  <span className="text-[9px] font-bold text-gray-400 uppercase">
                                                    Nominasi
                                                  </span>
                                                  <span className="font-medium text-gray-600">
                                                    {(
                                                      p[`totalNominasi${prod}`] ||
                                                      0
                                                    ).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                                                  </span>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                  <span className="text-[9px] font-bold text-gray-400 uppercase">
                                                    Penyaluran
                                                  </span>
                                                  <span className="font-bold text-emerald-600">
                                                    {(
                                                      p[
                                                      `totalRealisasi${prod}`
                                                      ] || 0
                                                    ).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                                                  </span>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                  <span className="text-[9px] font-bold text-gray-400 uppercase">
                                                    Penerimaan
                                                  </span>
                                                  <span className="font-medium text-gray-600">
                                                    {(
                                                      p[
                                                      `totalPenerimaan${prod}`
                                                      ] || 0
                                                    ).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                                                  </span>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                  <span className="text-[9px] font-bold text-gray-400 uppercase">
                                                    Renominasi
                                                  </span>
                                                  <span className="font-medium text-gray-600">
                                                    {(
                                                      p[
                                                      `totalRenominasi${prod}`
                                                      ] || 0
                                                    ).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                                                  </span>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                  <span className="text-[9px] font-bold text-gray-400 uppercase">
                                                    Pemakaian
                                                  </span>
                                                  <span className="font-medium text-gray-600">
                                                    {(
                                                      p[
                                                      `totalPemakaian${prod}`
                                                      ] || 0
                                                    ).toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                            {/* Moda specifically for this product */}
                                            {(() => {
                                              const productActiveModas =
                                                MODES.filter(
                                                  (moda) =>
                                                    (p[
                                                      `totalRealisasi${prod}_${moda}`
                                                    ] || 0) > 0,
                                                );

                                              if (productActiveModas.length === 0)
                                                return null;

                                              return (
                                                <div className="flex gap-2 flex-wrap ml-12">
                                                  {productActiveModas.map(
                                                    (moda) => (
                                                      <div
                                                        key={moda}
                                                        className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200 text-[10px]"
                                                      >
                                                        {moda
                                                          .toLowerCase()
                                                          .includes("kapal") ||
                                                          moda
                                                            .toLowerCase()
                                                            .includes("vessel") ? (
                                                          <Ship
                                                            size={10}
                                                            className="text-emerald-600"
                                                          />
                                                        ) : (
                                                          <Truck
                                                            size={10}
                                                            className="text-emerald-600"
                                                          />
                                                        )}
                                                        <span className="text-emerald-700 font-medium">
                                                          {moda}
                                                        </span>
                                                        <span className="font-bold text-emerald-700">
                                                          {(
                                                            p[
                                                            `totalRealisasi${prod}_${moda}`
                                                            ] || 0
                                                          ).toLocaleString("id-ID", { maximumFractionDigits: 2 })}{" "}
                                                          kL
                                                        </span>
                                                      </div>
                                                    ),
                                                  )}
                                                </div>
                                              );
                                            })()}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* RIGHT SECTION (Summary) */}
                  <div className="w-full md:w-1/2 bg-gray-50 flex flex-col shrink-0 border-t md:border-t-0 border-gray-200">
                    <div className="flex justify-between items-center p-4 border-b border-gray-200 shrink-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          Resume
                        </h3>
                        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                          {selectedMonthYearLabel}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 overflow-y-auto flex-1 space-y-6">
                      {/* Grand Totals */}
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wide">
                          Total Keseluruhan
                        </p>
                        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 text-sm">
                          <div className="flex justify-between items-center p-3">
                            <span className="text-gray-600 font-medium">
                              Nominasi
                            </span>
                            <span className="font-bold text-orange-600">
                              {grandNom.toLocaleString("id-ID", { maximumFractionDigits: 2 })} kL
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3">
                            <span className="text-gray-600 font-medium">
                              Penyaluran
                            </span>
                            <span className="font-bold text-emerald-600">
                              {grandReal.toLocaleString("id-ID", { maximumFractionDigits: 2 })} kL
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3">
                            <span className="text-gray-600 font-medium">
                              Penerimaan
                            </span>
                            <span className="font-bold text-gray-800">
                              {grandTerima.toLocaleString("id-ID", { maximumFractionDigits: 2 })} kL
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3">
                            <span className="text-gray-600 font-medium">
                              Renominasi
                            </span>
                            <span className="font-bold text-gray-800">
                              {grandRenom.toLocaleString("id-ID", { maximumFractionDigits: 2 })} kL
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3">
                            <span className="text-gray-600 font-medium">
                              Pemakaian
                            </span>
                            <span className="font-bold text-orange-600">
                              {grandPem.toLocaleString("id-ID", { maximumFractionDigits: 2 })} kL
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Resume per Product */}
                      {activeProds.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wide">
                            Resume per Produk
                          </p>
                          <div className="flex flex-col gap-3">
                            {activeProds.map((prod) => (
                              <div
                                key={prod}
                                className="bg-white rounded-xl border border-gray-200 overflow-hidden text-sm"
                              >
                                <div className="p-3 bg-gray-50/50 border-b border-gray-100">
                                  <p className="font-bold text-gray-900">
                                    {prod}
                                  </p>
                                </div>
                                <div className="divide-y divide-gray-100">
                                  <div className="flex justify-between items-center p-3">
                                    <span className="text-gray-600 font-medium">
                                      Nominasi
                                    </span>
                                    <span className="font-bold text-orange-600">
                                      {prodSummary[prod].nom.toLocaleString("id-ID", { maximumFractionDigits: 2 })}{" "}
                                      kL
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center p-3">
                                    <span className="text-gray-600 font-medium">
                                      Penyaluran
                                    </span>
                                    <span className="font-bold text-emerald-600">
                                      {prodSummary[prod].real.toLocaleString("id-ID", { maximumFractionDigits: 2 })}{" "}
                                      kL
                                    </span>
                                  </div>
                                  {MODES.filter(
                                    (m) => prodModaSummary[prod][m] > 0,
                                  ).length > 0 && (
                                      <div className="p-3 bg-emerald-50/50">
                                        <div className="flex flex-col gap-2">
                                          {MODES.filter(
                                            (m) => prodModaSummary[prod][m] > 0,
                                          ).map((moda) => (
                                            <div
                                              key={moda}
                                              className="flex justify-between items-center"
                                            >
                                              <div className="flex items-center gap-1.5 text-xs">
                                                {moda
                                                  .toLowerCase()
                                                  .includes("kapal") || moda.toLowerCase().includes("vessel") ? (
                                                  <Ship
                                                    size={12}
                                                    className="text-emerald-500"
                                                  />
                                                ) : (
                                                  <Truck
                                                    size={12}
                                                    className="text-emerald-500"
                                                  />
                                                )}
                                                <span className="text-emerald-700 font-medium">
                                                  {moda}
                                                </span>
                                              </div>
                                              <span className="font-bold text-emerald-700 text-xs">
                                                {prodModaSummary[prod][
                                                  moda
                                                ].toLocaleString("id-ID", { maximumFractionDigits: 2 })}{" "}
                                                kL
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  <div className="flex justify-between items-center p-3 border-t border-gray-100">
                                    <span className="text-gray-600 font-medium">
                                      Penerimaan
                                    </span>
                                    <span className="font-bold text-gray-800">
                                      {prodSummary[prod].terima.toLocaleString("id-ID", { maximumFractionDigits: 2 })}{" "}
                                      kL
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center p-3 border-t border-gray-100">
                                    <span className="text-gray-600 font-medium">
                                      Renominasi
                                    </span>
                                    <span className="font-bold text-gray-800">
                                      {prodSummary[prod].renom.toLocaleString("id-ID", { maximumFractionDigits: 2 })}{" "}
                                      kL
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center p-3 border-t border-gray-100">
                                    <span className="text-gray-600 font-medium">
                                      Pemakaian
                                    </span>
                                    <span className="font-bold text-orange-600">
                                      {prodSummary[prod].pem.toLocaleString("id-ID", { maximumFractionDigits: 2 })}{" "}
                                      kL
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Resume per Moda */}
                      {activeModas.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wide">
                            Penyaluran per Moda
                          </p>
                          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 text-sm">
                            {activeModas.map((moda) => (
                              <div
                                key={moda}
                                className="flex justify-between items-center p-3"
                              >
                                <div className="flex items-center gap-2">
                                  {moda.toLowerCase().includes("kapal") ||
                                    moda.toLowerCase().includes("vessel") ? (
                                    <Ship size={14} className="text-gray-500" />
                                  ) : (
                                    <Truck
                                      size={14}
                                      className="text-gray-500"
                                    />
                                  )}
                                  <span className="text-gray-600 font-medium">
                                    {moda}
                                  </span>
                                </div>
                                <span className="font-bold text-emerald-600">
                                  {modaSummary[moda].toLocaleString("id-ID", { maximumFractionDigits: 2 })} kL
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
