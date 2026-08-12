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
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import FilterAutocomplete from "./FilterAutocomplete";
import {
  useMapLocations,
  usePemasokBbtudSnapshot,
  useSupplierContractSummaries,
  type ContractComplianceStatus,
  type MapSite,
  type SupplierContractSummary,
} from "@/hooks/service/dashboard-api";
import { useRelations, useSites } from "@/hooks/service/site-api";
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
// Category Helper & Icon Definitions
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
  return `${siteType}_GAS_PIPA`;
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; color: string; svg: string }
> = {
  PEMBANGKIT_LNG: {
    label: "Pembangkit (LNG)",
    color: "#1581fb", // Vibrant Blue for LNG Pembangkit
    svg: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h20"/><path d="M20 18v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M3 18v-8l7-5v13"/><path d="M14 10V4h3v3"/></svg>`,
  },
  PEMBANGKIT_GAS_PIPA: {
    label: "Pembangkit (Gas Pipa)",
    color: "#13778e", // Teal/Ocean Blue for Gas Pipa Pembangkit
    svg: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h20"/><path d="M20 18v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M3 18v-8l7-5v13"/><path d="M14 10V4h3v3"/></svg>`,
  },
  PEMBANGKIT_BBM: {
    label: "Pembangkit (BBM)",
    color: "#1581fb", // Blue for Pembangkit BBM
    svg: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h20"/><path d="M20 18v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M3 18v-8l7-5v13"/><path d="M14 10V4h3v3"/></svg>`,
  },
  PEMASOK_LNG: {
    label: "Pemasok (LNG)",
    color: "#3B82F6", // Original Blue kept for LNG
    svg: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
  },
  PEMASOK_GAS_PIPA: {
    label: "Pemasok (Gas Pipa)",
    color: "#06B6D4", // New Distinct Cyan for Gas Pipa
    svg: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/></svg>`,
  },
  PEMASOK_BBM: {
    label: "Pemasok (BBM)",
    color: "#0284C7", // Sky Blue
    svg: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`,
  },
  TRANSPORTIR: {
    label: "Transportir",
    color: "#F59E0B", // Original Amber
    svg: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
  },
};

const createCategoryIcon = (
  catKey: string,
  fallbackColor: string,
  complianceStatus?: ContractComplianceStatus,
) => {
  const config = CATEGORY_CONFIG[catKey] || {
    color: fallbackColor,
    svg: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.2"><circle cx="12" cy="12" r="8"/></svg>`,
  };
  const alertColor =
    complianceStatus === "BELOW_TOP"
      ? "#DC2626"
      : complianceStatus === "MISSING_DATA"
        ? "#F59E0B"
        : null;

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
        border: 2px solid ${alertColor || "white"};
        box-shadow: ${alertColor
        ? `0 0 0 4px ${alertColor}40, 0 3px 8px rgba(0,0,0,0.35)`
        : "0 3px 8px rgba(0,0,0,0.35)"
      };
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
        ${alertColor
        ? `<div style="
                position: absolute;
                top: -8px;
                right: -8px;
                width: 15px;
                height: 15px;
                border-radius: 9999px;
                transform: rotate(45deg);
                display: flex;
                align-items: center;
                justify-content: center;
                background: ${alertColor};
                color: white;
                border: 2px solid white;
                font-size: 9px;
                line-height: 1;
                font-weight: 800;
                box-shadow: 0 1px 4px rgba(0,0,0,0.3);
              ">!</div>`
        : ""
      }
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -28],
  });
};

interface ExportRelationship {
  sourceName: string;
  targetName: string;
  commodity: string | null;
  status: string;
}

type JsPdfWithAutoTable = jsPDF & {
  lastAutoTable: { finalY: number };
};

const COMMODITY_OPTIONS = ["Gas Pipa", "LNG"];

const bbtudFormatter = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

const d1DateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatReportDate(reportDate: string): string {
  const [year, month, day] = reportDate.split("-").map(Number);
  return d1DateFormatter.format(new Date(year, month - 1, day));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Map({ commodity }: { commodity?: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();
  const [selectedCommodity, setSelectedCommodity] = useState<string | null>(
    null,
  );
  const activeCommodity =
    selectedCommodity === "Gas Pipa"
      ? "GAS PIPA"
      : selectedCommodity === "LNG"
        ? "LNG"
        : commodity || "LNG,GAS PIPA";

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
        filter: filterExportButtons,
      });
      const link = document.createElement("a");
      link.download = `peta-gas-${new Date().toISOString().split("T")[0]}.png`;
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
        filter: filterExportButtons,
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("l", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 10, pdfWidth, pdfHeight);

      pdf.addPage();
      pdf.setFontSize(14);
      pdf.text(
        "Breakdown Relasi Pembangkit dan Pemasok Berdasarkan Region",
        14,
        15,
      );

      const relationships = filteredPipes.reduce(
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
        {} as Record<string, ExportRelationship[]>,
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
            head: [["No", "Pembangkit", "Pemasok", "Komoditas"]],
            body: regionData,
            theme: "grid",
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            styles: { fontSize: 10 },
            margin: { left: 14, right: 14 },
          });

          startY = (pdf as JsPdfWithAutoTable).lastAutoTable.finalY + 15;

          if (startY > pdf.internal.pageSize.getHeight() - 20) {
            pdf.addPage();
            startY = 20;
          }
        });

      pdf.save(`peta-gas-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error("Failed to export PDF", err);
    }
  };

  // ---- API data -----------------------------------------------------------
  const { data, isLoading, isError, error } = useMapLocations(
    undefined,
    activeCommodity,
  );
  const {
    data: pemasokBbtudSnapshots,
    isLoading: isPemasokBbtudLoading,
    isError: isPemasokBbtudError,
  } = usePemasokBbtudSnapshot();
  const {
    data: supplierContractSummaries,
    isLoading: isSupplierContractsLoading,
    isError: isSupplierContractsError,
  } = useSupplierContractSummaries(currentYear, activeCommodity);
  const { data: gasSites } = useSites({ commodity: activeCommodity });

  const { hasPrivilege } = usePrivilege();
  const canReadSites = hasPrivilege("site_management", "READ");
  const { data: relations } = useRelations(true, {
    enabled: canReadSites,
  });

  // Enriched sites (patches missing commodity from map-locations API)
  const enrichedSites = useMemo(() => {
    if (!data?.sites) return [];
    return data.sites.map(site => {
      const masterSite = gasSites?.find(s => s.id === site.id);
      return {
        ...site,
        commodity: masterSite?.commodity || site.commodity,
      };
    });
  }, [data?.sites, gasSites]);

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
    PEMBANGKIT_LNG: true,
    PEMBANGKIT_GAS_PIPA: true,
    PEMASOK_LNG: true,
    PEMASOK_GAS_PIPA: true,
  });
  const showPipes = true;

  // Filter states
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedPemasok, setSelectedPemasok] = useState<string | null>(null);
  const [selectedPembangkit, setSelectedPembangkit] = useState<string | null>(
    null,
  );

  // Kepemilikan (owner) filter
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

  // ---- Relational Filtering Helpers ---------------------------------------
  const getConnectedSet = useCallback(
    (siteName: string, siteType: string) => {
      if (!enrichedSites || !relations) return null;
      const site = enrichedSites.find(
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
    if (!selectedRegion || !enrichedSites) return null;
    const regionSites = enrichedSites.filter((s) => s.region === selectedRegion);
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
  }, [selectedRegion, enrichedSites, relations]);

  const gasSiteIds = useMemo(
    () => new Set(gasSites?.map((s) => s.id) || []),
    [gasSites],
  );

  const supplierContractsBySiteId = useMemo(() => {
    const lookup = new globalThis.Map<string, SupplierContractSummary[]>();

    supplierContractSummaries?.items.forEach((contract) => {
      const contracts = lookup.get(contract.supplierSiteId) || [];
      contracts.push(contract);
      lookup.set(contract.supplierSiteId, contracts);
    });

    return lookup;
  }, [supplierContractSummaries]);

  const pemasokBbtudByPair = useMemo(() => {
    const lookup = new globalThis.Map<
      string,
      { bbtud: number | null; reportDate: string }
    >();

    pemasokBbtudSnapshots?.forEach((supplier) => {
      supplier.pembangkits.forEach((pembangkit) => {
        lookup.set(`${supplier.supplierId}:${pembangkit.siteId}`, {
          bbtud: pembangkit.bbtud,
          reportDate: supplier.reportDate,
        });
      });
    });

    return lookup;
  }, [pemasokBbtudSnapshots]);

  const regionOptions = useMemo(() => {
    if (!enrichedSites.length) return [];
    const validIds = intersect([pemasokSet, pembangkitSet]);

    let validSites = [...enrichedSites];
    if (commodity && gasSiteIds) {
      validSites = validSites.filter(s => gasSiteIds.has(s.id));
    }
    if (validIds) {
      validSites = validSites.filter(s => validIds.has(s.id));
    }
    return Array.from(new Set(validSites.map(s => s.region))).filter(Boolean).sort();
  }, [enrichedSites, pemasokSet, pembangkitSet, intersect, commodity, gasSiteIds]);

  const pemasokNames = useMemo(() => {
    if (!enrichedSites) return [];
    const validIds = intersect([regionSet, pembangkitSet]);

    let validSites = enrichedSites.filter((s) => s.siteType === "PEMASOK");
    if (gasSiteIds) {
      validSites = validSites.filter((s) => gasSiteIds.has(s.id));
    }
    if (validIds) {
      validSites = validSites.filter((s) => validIds.has(s.id));
    }
    return validSites.map((s) => s.name).sort();
  }, [enrichedSites, regionSet, pembangkitSet, intersect, gasSiteIds]);

  const pembangkitNames = useMemo(() => {
    if (!enrichedSites) return [];
    const validIds = intersect([regionSet, pemasokSet]);

    let validSites = enrichedSites.filter((s) => s.siteType === "PEMBANGKIT");
    if (gasSiteIds) {
      validSites = validSites.filter((s) => gasSiteIds.has(s.id));
    }
    if (validIds) {
      validSites = validSites.filter((s) => validIds.has(s.id));
    }
    return validSites.map((s) => s.name).sort();
  }, [enrichedSites, regionSet, pemasokSet, intersect, gasSiteIds]);

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
    if (!enrichedSites.length || !gasSites) return [];
    const validIds = intersect([regionSet, pemasokSet, pembangkitSet]);

    return enrichedSites.filter((site) => {
      if (!gasSiteIds.has(site.id)) return false;

      // Check base type and detailed type visibility
      const catKey = getSiteCategoryKey(site.siteType, site.commodity);
      const isBaseVisible = visibleSiteTypes[site.siteType] ?? true;
      const isCatVisible = visibleSiteTypes[catKey] ?? true;

      if (!isBaseVisible || !isCatVisible) return false;

      if (validIds && !validIds.has(site.id)) return false;

      if (site.siteType === "PEMBANGKIT" && site.owner) {
        if (!selectedOwners.has(site.owner)) return false;
      }
      return true;
    });
  }, [
    data?.sites,
    gasSites,
    gasSiteIds,
    visibleSiteTypes,
    selectedOwners,
    regionSet,
    pemasokSet,
    pembangkitSet,
    intersect,
  ]);

  const filteredPipes = useMemo(() => {
    if (!data?.pipes || !showPipes) return [];
    const visibleIds = new Set(filteredSites.map((s) => s.id));
    return data.pipes.filter(
      (pipe) =>
        visibleIds.has(pipe.sourceSiteId) && visibleIds.has(pipe.targetSiteId),
    );
  }, [data?.pipes, filteredSites, showPipes]);

  // ---- helpers ------------------------------------------------------------
  const getSiteCategoryInfo = (siteType: string, commodity?: string | null) => {
    const catKey = getSiteCategoryKey(siteType, commodity);
    return (
      CATEGORY_CONFIG[catKey] || {
        label: siteType,
        color: "#999999",
        svg: "",
      }
    );
  };

  const getPipeTypeColor = (relationType: string) =>
    data?.legend.pipeTypes.find((pt) => pt.type === relationType)?.color ||
    "#38BDF8";

  const getSiteById = (id: string): MapSite | undefined =>
    enrichedSites.find((s) => s.id === id);

  const getConnectedSites = (siteId: string): MapSite[] => {
    if (!data?.pipes || !enrichedSites.length) return [];
    const connectedIds = data.pipes
      .filter(
        (pipe) => pipe.sourceSiteId === siteId || pipe.targetSiteId === siteId,
      )
      .map((pipe) =>
        pipe.sourceSiteId === siteId ? pipe.targetSiteId : pipe.sourceSiteId,
      );
    return enrichedSites.filter((s) => connectedIds.includes(s.id));
  };

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
            <h3 className="text-base md:text-lg font-semibold text-gray-900">
              Lokasi Gas Pipa
            </h3>
            <div className="export-buttons-container flex items-center gap-2 bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={handleExportImage}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-emerald-500 hover:bg-emerald-50 flex items-center gap-1.5 transition-all duration-200 cursor-pointer"
                title="Export as Image (PNG)"
              >
                <ImageIcon size={14} />
                PNG
              </button>
              <button
                onClick={handleExportPDF}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-rose-400 hover:bg-rose-50 flex items-center gap-1.5 transition-all duration-200 cursor-pointer"
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
                const info = getSiteCategoryInfo(site.siteType, site.commodity);
                const supplierContracts =
                  site.siteType === "PEMASOK"
                    ? supplierContractsBySiteId.get(site.id) || []
                    : [];
                const supplierComplianceStatus:
                  | ContractComplianceStatus
                  | undefined = supplierContracts.some(
                    (contract) => contract.complianceStatus === "BELOW_TOP",
                  )
                    ? "BELOW_TOP"
                    : supplierContracts.some(
                      (contract) =>
                        contract.complianceStatus === "MISSING_DATA",
                    )
                      ? "MISSING_DATA"
                      : undefined;
                const icon = createCategoryIcon(
                  catKey,
                  info.color,
                  site.siteType === "PEMASOK"
                    ? supplierComplianceStatus
                    : undefined,
                );
                const connected = getConnectedSites(site.id);

                return (
                  <Marker
                    key={site.id}
                    position={
                      [Number(site.lat), Number(site.lng)] as LatLngTuple
                    }
                    icon={icon}
                  >
                    <Popup
                      keepInView
                      autoPan
                      autoPanPadding={[20, 20]}
                      maxWidth={320}
                    >
                      <div className="min-w-[220px] max-w-[280px] sm:min-w-[260px] sm:max-w-[320px] max-h-[170px] sm:max-h-[220px] md:max-h-[270px] lg:max-h-[320px] overflow-y-auto overscroll-contain px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <div className="flex items-center gap-1.5 mb-0.5">
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
                            className="!m-0 font-semibold text-xs uppercase tracking-wider"
                            style={{ color: info.color }}
                          >
                            {info.label}
                          </p>
                        </div>
                        <p className="!m-0 text-sm font-bold text-gray-900">
                          {site.name}
                        </p>
                        {site.region && (
                          <p className="!mt-0.5 !mb-0 text-[11px] text-gray-500">
                            Region {site.region}
                          </p>
                        )}
                        {site.siteType === "PEMBANGKIT" &&
                          (site.capacity || site.owner) && (
                            <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                              {site.capacity && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-500">
                                    Kapasitas:
                                  </span>
                                  <span className="font-medium text-primary">
                                    {parseFloat(
                                      String(site.capacity),
                                    ).toLocaleString("id-ID", { maximumFractionDigits: 2 })}{" "}
                                    MW
                                  </span>
                                </div>
                              )}
                              {site.owner && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-500">
                                    Kepemilikan:
                                  </span>
                                  <span className="font-medium text-gray-700">
                                    {site.owner}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        {site.siteType === "PEMASOK" && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-700 mb-1.5">
                              Kontrak Aktif {currentYear}
                            </p>
                            {isSupplierContractsLoading ? (
                              <div className="flex items-center gap-1.5 text-xs text-gray-500 py-1">
                                <Loader2 size={12} className="animate-spin" />
                                Memuat data kontrak...
                              </div>
                            ) : isSupplierContractsError ? (
                              <p className="text-xs text-red-500 py-1">
                                Data kontrak gagal dimuat
                              </p>
                            ) : supplierContracts.length === 0 ? (
                              <p className="text-xs text-gray-500 py-1">
                                Tidak ada kontrak aktif
                              </p>
                            ) : (
                              <div className="space-y-1.5">
                                {supplierContracts.map((contract) => (
                                  <div
                                    key={`${contract.supplierSiteId}:${contract.effectiveContractNumber.toLowerCase()}`}
                                    className={`rounded-md border px-2 pt-1.5 pb-2 ${contract.complianceStatus === "BELOW_TOP"
                                      ? "border-red-300 bg-red-50"
                                      : contract.complianceStatus ===
                                        "MISSING_DATA"
                                        ? "border-amber-300 bg-amber-50"
                                        : "border-gray-200 bg-gray-50"
                                      }`}
                                  >
                                    <p className="!mt-0 !mb-1 text-[11px] font-semibold text-gray-800 break-words">
                                      {contract.effectiveContractNumber}
                                    </p>
                                    <div className="grid grid-cols-[52px_1fr] gap-x-2 gap-y-0.5 text-[11px]">
                                      <span className="text-gray-500">JPH</span>
                                      <span className="font-medium text-gray-800 text-right whitespace-nowrap">
                                        {contract.jphBbtud != null
                                          ? `${bbtudFormatter.format(contract.jphBbtud)} BBTUD`
                                          : "-"}
                                      </span>
                                      <span className="text-gray-500">TOP</span>
                                      <span className="font-medium text-gray-800 text-right whitespace-nowrap">
                                        {contract.topBbtud != null
                                          ? `${bbtudFormatter.format(contract.topBbtud)} BBTUD`
                                          : "-"}
                                      </span>
                                      <span className="text-gray-500">TJK</span>
                                      <span className="font-medium text-gray-800 text-right whitespace-nowrap">
                                        {contract.tjkBbtud != null
                                          ? `${bbtudFormatter.format(contract.tjkBbtud)} BBTUD`
                                          : "-"}
                                      </span>
                                      <span className="text-gray-500">
                                        Berakhir
                                      </span>
                                      <span className="font-medium text-gray-800 text-right whitespace-nowrap">
                                        {contract.agreementEndDate
                                          ? formatReportDate(
                                            contract.agreementEndDate,
                                          )
                                          : "-"}
                                      </span>
                                    </div>
                                    {contract.complianceStatus ===
                                      "BELOW_TOP" && (
                                        <p className="!mt-1.5 !mb-0 border-t border-red-200 pt-1 text-[10px] font-medium text-red-700">
                                          Realisasi H-1{" "}
                                          {bbtudFormatter.format(
                                            contract.d1RealizationBbtud || 0,
                                          )}{" "}
                                          BBTUD di bawah TOP
                                        </p>
                                      )}
                                    {contract.complianceStatus ===
                                      "MISSING_DATA" && (
                                        <p className="!mt-1.5 !mb-0 border-t border-amber-200 pt-1 text-[10px] font-medium text-amber-700">
                                          Data H-1 tersedia untuk{" "}
                                          {contract.d1DataPlantCount} dari{" "}
                                          {contract.contractPlantCount} pembangkit
                                        </p>
                                      )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {connected.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">
                              {site.siteType === "PEMBANGKIT"
                                ? "Pemasok:"
                                : site.siteType === "PEMASOK"
                                  ? "Pembangkit:"
                                  : "Relasi:"}
                            </p>
                            <ul className="text-xs text-gray-700 space-y-1">
                              {connected.map((c) => {
                                const cInfo = getSiteCategoryInfo(
                                  c.siteType,
                                  c.commodity,
                                );
                                const bbtudData =
                                  site.siteType === "PEMASOK" &&
                                    c.siteType === "PEMBANGKIT"
                                    ? pemasokBbtudByPair.get(
                                      `${site.id}:${c.id}`,
                                    )
                                    : undefined;
                                const hasBbtud = bbtudData?.bbtud != null;

                                return (
                                  <li key={c.id} className="text-xs">
                                    <div className="flex items-start gap-2">
                                      <span
                                        className="w-2 h-2 rounded-full flex-shrink-0 mt-[3px]"
                                        style={{ backgroundColor: cInfo.color }}
                                      />
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline justify-between gap-3 text-gray-700 leading-tight">
                                          <span className="font-medium min-w-0">
                                            {c.name}
                                          </span>
                                          {site.siteType === "PEMASOK" &&
                                            c.siteType === "PEMBANGKIT" && (
                                              <>
                                                {isPemasokBbtudLoading ? (
                                                  <span className="text-gray-500 whitespace-nowrap">
                                                    Memuat data H-1...
                                                  </span>
                                                ) : hasBbtud ? (
                                                  <span className="font-semibold text-primary whitespace-nowrap">
                                                    {bbtudFormatter.format(
                                                      bbtudData.bbtud!,
                                                    )}{" "}
                                                    BBTUD
                                                  </span>
                                                ) : (
                                                  <span className="text-gray-500 text-right">
                                                    Data H-1 belum tersedia
                                                  </span>
                                                )}
                                              </>
                                            )}
                                        </div>
                                        {site.siteType === "PEMASOK" &&
                                          c.siteType === "PEMBANGKIT" &&
                                          !isPemasokBbtudLoading &&
                                          !isPemasokBbtudError &&
                                          hasBbtud &&
                                          bbtudData?.reportDate && (
                                            <div className="text-[10px] text-gray-500 mt-1">
                                              Data:{" "}
                                              {formatReportDate(
                                                bbtudData.reportDate,
                                              )}
                                            </div>
                                          )}
                                      </div>
                                    </div>
                                  </li>
                                );
                              })}
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
                  className="flex items-center gap-2 bg-white/95 backdrop-blur rounded-lg shadow-lg px-3 py-2 text-xs hover:bg-white transition-all cursor-pointer"
                >
                  <Layers size={16} className="text-primary" />
                  <span className="text-gray-700 font-medium">Legend</span>
                  <ChevronUp size={14} className="text-gray-400" />
                </button>
              ) : (
                <div className="bg-white/95 backdrop-blur rounded-lg shadow-lg px-3 py-2 sm:px-4 sm:py-3 text-xs space-y-2 min-w-[170px] max-h-[300px] overflow-y-auto">
                  {/* Header with collapse button */}
                  <div className="flex items-center justify-between border-b border-gray-200 pb-1.5 mb-1 sticky top-0 bg-white/95 backdrop-blur">
                    <span className="text-gray-700 font-semibold text-xs">
                      Keterangan Map
                    </span>
                    <button
                      onClick={() => setLegendExpanded(false)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                    >
                      <ChevronDown size={14} className="text-gray-500" />
                    </button>
                  </div>

                  {/* Site type & commodity category toggles */}
                  {data.legend.siteTypes.map((st) => {
                    const isVisible = visibleSiteTypes[st.type] ?? true;
                    const config = CATEGORY_CONFIG[st.type] || {
                      label: st.label,
                      color: st.color,
                      svg: "",
                    };

                    return (
                      <button
                        key={st.type}
                        onClick={() => toggleSiteType(st.type)}
                        className={`flex items-center gap-2 w-full py-1 px-1.5 rounded-md transition-all cursor-pointer ${isVisible ? `bg-opacity-10` : "bg-gray-100 opacity-60"
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
                          {config.label}
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
                  {data.legend.pipeTypes.length > 0 && (
                    <div className="pt-1 border-t border-gray-200">
                      <p className="text-[10px] text-gray-500 mb-1 font-semibold">
                        Jenis Pipa
                      </p>
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
      </div>

      {/* Mobile Filter Button */}
      <button
        onClick={() => setFilterOpen(!filterOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 bg-gradient-to-r from-primary to-secondary text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer"
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
            className="p-2 hover:bg-gray-100 rounded-full cursor-pointer"
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
              label="Komoditas"
              options={COMMODITY_OPTIONS}
              value={selectedCommodity}
              onChange={setSelectedCommodity}
              placeholder="Pilih Komoditas"
            />
            <FilterAutocomplete
              label="Region"
              options={regionOptions}
              value={selectedRegion}
              onChange={setSelectedRegion}
              placeholder="Pilih Region"
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
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                      style={{ accentColor: "var(--theme-primary)" }}
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
