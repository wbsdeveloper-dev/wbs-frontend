import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Upload,
  Plus,
  Play,
  Save,
  RotateCcw,
  BarChart2,
} from "lucide-react";
import { useSites } from "@/hooks/service/site-api";
import {
  useUploadTransportirExcel,
  TransportirExcelConfig,
} from "@/hooks/service/transportir-api";
import FilterAutocomplete from "@/app/components/FilterAutocomplete";

type Props = {
  setOpenModal: (value: boolean) => void;
};

const DEFAULT_CONFIG: TransportirExcelConfig = {
  sheets: ["01", "02", "03", "04", "05"],
  report_date_prefix: "2026-06-",
  hulu: {
    search_column: "B",
    start_row: 10,
    col_mmscf: "C",
    col_mmbtu: "D",
    keywords: [
      { label: "PT. PLN EPI HCML 2M", upstream_id: "" },
      { label: "PT PLN EPI HCML MAC", upstream_id: "" },
      { label: "PT PLN EPI TSB", upstream_id: "" },
    ],
  },
  hilir: {
    search_column: "E",
    start_row: 10,
    col_mmscf: "G",
    col_mmbtu: "H",
    keywords: [
      {
        label: "PT PLN EPI (NP GRESIK - HCML 2M)",
        upstream_id: "",
        downstream_id: "",
      },
      {
        label: "PT PLN EPI (NP GRESIK - TSB)",
        upstream_id: "",
        downstream_id: "",
      },
      {
        label: "PT PLN EPI (NP GRESIK - HCML MAC)",
        upstream_id: "",
        downstream_id: "",
      },
      {
        label: "PT PLN EPI (IP GRATI - TSB)",
        upstream_id: "",
        downstream_id: "",
      },
      {
        label: "PT PLN EPI (IP GRATI - HCML MAC)",
        upstream_id: "",
        downstream_id: "",
      },
      {
        label: "PT PLN EPI (IP GRATI - HCML 2M)",
        upstream_id: "",
        downstream_id: "",
      },
    ],
  },
  stock: {
    search_column: "B",
    keyword: "PLN EPI",
    col_start: "C",
    col_end: "I",
    key_mapping: [
      "opening_stock",
      "supply_stock",
      "delivered_stock",
      "own_use",
      "stock_transfer",
      "discrepancy",
      "clossing_stock",
    ],
  },
};

export default function UploadKonfigurasiModal({ setOpenModal }: Props) {
  const { data: sitesData } = useSites();
  const sites = sitesData || [];
  
  // Filter sites for dropdowns: only show GAS PIPA or LNG
  const filteredSites = sites.filter(s => s.commodity === 'GAS PIPA' || s.commodity === 'LNG');
  
  // For Hilir dropdown: only show if site_type is PEMBANGKIT
  const filteredHilirSites = filteredSites.filter(s => s.site_type === 'PEMBANGKIT');

  const [config, setConfig] = useState<TransportirExcelConfig>(DEFAULT_CONFIG);
  const [newSheet, setNewSheet] = useState("");
  const [newHuluKw, setNewHuluKw] = useState("");
  const [newHilirKw, setNewHilirKw] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadTransportirExcel();
  const [successMsg, setSuccessMsg] = useState("");
  const [isDebugMode, setIsDebugMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("excel_upload_config_default");
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved config", e);
      }
    }
  }, []);

  const handleSaveDefault = () => {
    localStorage.setItem("excel_upload_config_default", JSON.stringify(config));
    alert("Konfigurasi berhasil disimpan sebagai default!");
  };

  const handleResetDefault = () => {
    const saved = localStorage.getItem("excel_upload_config_default");
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {}
    } else {
      setConfig(DEFAULT_CONFIG);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      alert("Pilih file Excel terlebih dahulu");
      return;
    }

    // Quick validation
    // Skip global upstream_id validation, since it's now per keyword.
    // However, we could validate that every hulu keyword has an upstream_id.
    // For simplicity, we just submit.

    if (isDebugMode) {
      console.log("=== DEBUG MODE: PAYLOAD ===");
      console.log("File:", file.name, "size:", file.size);
      console.log("Config JSON:", JSON.stringify(config, null, 2));
      alert(
        `Mode Debug aktif.\nPayload JSON dicetak ke console (F12).\n\nConfig:\n${JSON.stringify(config, null, 2).slice(0, 500)}...`,
      );
      return;
    }

    try {
      setSuccessMsg("");
      const res = await uploadMutation.mutateAsync({ file, config });
      setSuccessMsg(
        `Berhasil! ${res.summary?.sheets_processed} sheet diproses. ${res.summary?.reconciliation_inserted} data direkonsiliasi.`,
      );
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan saat memproses data");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpenModal(false)}
      />
      <div className="relative bg-white w-full max-w-4xl rounded-xl shadow-2xl flex flex-col z-10 max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-start p-5 sm:p-6 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart2 className="text-primary" size={24} />
              Upload & Konfigurasi Excel
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Tentukan sumber data dan keyword pencarian untuk setiap kelompok
              data
            </p>
          </div>
          <button
            onClick={() => setOpenModal(false)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {successMsg && (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200 font-medium">
              {successMsg}
            </div>
          )}

          {/* Upload Area */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              className="text-gray-900 hidden"
              accept=".xlsx, .xls"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <Upload
              className="text-gray-400 group-hover:text-primary transition-colors mb-3"
              size={32}
            />
            <p className="text-sm text-gray-700 font-medium">
              {file ? (
                file.name
              ) : (
                <>
                  Klik untuk pilih file{" "}
                  <span className="font-normal text-gray-500">
                    atau drag & drop di sini
                  </span>
                </>
              )}
            </p>
            {!file && (
              <p className="text-xs text-gray-400 mt-1">
                Format yang didukung: .xlsx, .xls
              </p>
            )}
          </div>

          {/* Sheet yang diproses */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Pengaturan Sheet & Tanggal Laporan
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Prefix Tanggal Laporan (contoh: 2026-06-)
                </label>
                <input
                  type="text"
                  value={config.report_date_prefix || ""}
                  onChange={(e) =>
                    setConfig({ ...config, report_date_prefix: e.target.value })
                  }
                  placeholder="2026-06-"
                  className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
            <p className="block text-xs text-gray-500 mb-1">Daftar Sheet</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {config.sheets.map((sheet, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium"
                >
                  {sheet}
                  <button
                    onClick={() =>
                      setConfig({
                        ...config,
                        sheets: config.sheets.filter((s) => s !== sheet),
                      })
                    }
                    className="text-blue-400 hover:text-blue-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nama sheet, mis: 06 Jun"
                value={newSheet}
                onChange={(e) => setNewSheet(e.target.value)}
                className="text-gray-900 flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <button
                onClick={() => {
                  if (newSheet) {
                    setConfig({
                      ...config,
                      sheets: [...config.sheets, newSheet],
                    });
                    setNewSheet("");
                  }
                }}
                className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-50 transition-colors"
              >
                <Plus size={16} /> Tambah sheet
              </button>
            </div>
          </div>

          {/* Kelompok data 1 */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Kelompok data 1 — Data Hulu (Shipper)
            </h4>
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Cari keyword di kolom
                  </label>
                  <input
                    type="text"
                    value={config.hulu.search_column}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        hulu: { ...config.hulu, search_column: e.target.value },
                      })
                    }
                    className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Mulai dari baris
                  </label>
                  <input
                    type="number"
                    value={config.hulu.start_row}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        hulu: {
                          ...config.hulu,
                          start_row: parseInt(e.target.value) || 1,
                        },
                      })
                    }
                    className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex items-center gap-4 mb-3">
                  <p className="text-sm font-medium text-gray-700">
                    Keyword baris yang diambil
                  </p>
                </div>
                <div className="space-y-3 mb-3">
                  {config.hulu.keywords.map((kw, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-2 p-3 bg-white border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={kw.label}
                          onChange={(e) => {
                            const newKws = [...config.hulu.keywords];
                            newKws[i].label = e.target.value;
                            setConfig({
                              ...config,
                              hulu: { ...config.hulu, keywords: newKws },
                            });
                          }}
                          className="text-gray-900 flex-1 px-3 py-1.5 bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary rounded text-sm outline-none transition-all"
                        />
                        <button
                          onClick={() =>
                            setConfig({
                              ...config,
                              hulu: {
                                ...config.hulu,
                                keywords: config.hulu.keywords.filter(
                                  (_, idx) => idx !== i,
                                ),
                              },
                            })
                          }
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <div className="mt-1">
                        <FilterAutocomplete
                          label="Hulu"
                          options={filteredSites.map(s => s.name)}
                          value={filteredSites.find(s => s.id === kw.upstream_id)?.name || ""}
                          onChange={(val) => {
                            const site = filteredSites.find(s => s.name === val);
                            const newKws = [...config.hulu.keywords];
                            newKws[i].upstream_id = site ? site.id : "";
                            setConfig({
                              ...config,
                              hulu: { ...config.hulu, keywords: newKws },
                            });
                          }}
                          placeholder="-- Pilih Hulu --"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newHuluKw}
                    onChange={(e) => setNewHuluKw(e.target.value)}
                    placeholder="Tambah keyword baru..."
                    className="text-gray-900 flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={() => {
                      if (newHuluKw) {
                        setConfig({
                          ...config,
                          hulu: {
                            ...config.hulu,
                            keywords: [
                              ...config.hulu.keywords,
                              { label: newHuluKw, upstream_id: "" },
                            ],
                          },
                        });
                        setNewHuluKw("");
                      }
                    }}
                    className="px-3 py-2 bg-white border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 flex items-center gap-1"
                  >
                    <Plus size={16} /> Tambah
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Kolom nilai yang diambil
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      FLOWRATE&rarr;
                    </span>
                    <input
                      type="text"
                      value={config.hulu.col_mmscf}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          hulu: { ...config.hulu, col_mmscf: e.target.value },
                        })
                      }
                      className="text-gray-900 w-16 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center bg-white"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 ml-1 bg-white border border-gray-200 px-2 py-1.5 rounded-lg shadow-sm">
                      <input
                        type="checkbox"
                        checked={config.hulu.convert_mmscf || false}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            hulu: {
                              ...config.hulu,
                              convert_mmscf: e.target.checked,
                            },
                          })
                        }
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      Konversi ke MMSCF
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">ENERGY &rarr;</span>
                    <input
                      type="text"
                      value={config.hulu.col_mmbtu}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          hulu: { ...config.hulu, col_mmbtu: e.target.value },
                        })
                      }
                      className="text-gray-900 w-16 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center bg-white"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 ml-1 bg-white border border-gray-200 px-2 py-1.5 rounded-lg shadow-sm">
                      <input
                        type="checkbox"
                        checked={config.hulu.convert_mmbtu || false}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            hulu: {
                              ...config.hulu,
                              convert_mmbtu: e.target.checked,
                            },
                          })
                        }
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      Konversi ke BBTU
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Kelompok data 2 */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Kelompok data 2 — Data Hilir (Pelanggan Shipper)
            </h4>
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Cari keyword di kolom
                  </label>
                  <input
                    type="text"
                    value={config.hilir.search_column}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        hilir: {
                          ...config.hilir,
                          search_column: e.target.value,
                        },
                      })
                    }
                    className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Mulai dari baris
                  </label>
                  <input
                    type="number"
                    value={config.hilir.start_row}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        hilir: {
                          ...config.hilir,
                          start_row: parseInt(e.target.value) || 1,
                        },
                      })
                    }
                    className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700">
                    Keyword baris yang diambil
                  </p>
                </div>
                <div className="space-y-3 mb-3">
                  {config.hilir.keywords.map((kw, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-2 p-3 bg-white border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={kw.label}
                          onChange={(e) => {
                            const newKws = [...config.hilir.keywords];
                            newKws[i].label = e.target.value;
                            setConfig({
                              ...config,
                              hilir: { ...config.hilir, keywords: newKws },
                            });
                          }}
                          className="text-gray-900 flex-1 px-3 py-1.5 bg-white border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary rounded text-sm outline-none transition-all"
                        />
                        <button
                          onClick={() =>
                            setConfig({
                              ...config,
                              hilir: {
                                ...config.hilir,
                                keywords: config.hilir.keywords.filter(
                                  (_, idx) => idx !== i,
                                ),
                              },
                            })
                          }
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div>
                          <FilterAutocomplete
                            label="Hulu"
                            options={filteredSites.map(s => s.name)}
                            value={filteredSites.find(s => s.id === kw.upstream_id)?.name || ""}
                            onChange={(val) => {
                              const site = filteredSites.find(s => s.name === val);
                              const newKws = [...config.hilir.keywords];
                              newKws[i].upstream_id = site ? site.id : "";
                              setConfig({
                                ...config,
                                hilir: { ...config.hilir, keywords: newKws },
                              });
                            }}
                            placeholder="-- Pilih Hulu --"
                          />
                        </div>
                        <div>
                          <FilterAutocomplete
                            label="Hilir"
                            options={filteredHilirSites.map(s => s.name)}
                            value={filteredHilirSites.find(s => s.id === kw.downstream_id)?.name || ""}
                            onChange={(val) => {
                              const site = filteredHilirSites.find(s => s.name === val);
                              const newKws = [...config.hilir.keywords];
                              newKws[i].downstream_id = site ? site.id : "";
                              setConfig({
                                ...config,
                                hilir: { ...config.hilir, keywords: newKws },
                              });
                            }}
                            placeholder="-- Pilih Hilir --"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newHilirKw}
                    onChange={(e) => setNewHilirKw(e.target.value)}
                    placeholder="Tambah keyword baru..."
                    className="text-gray-900 flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={() => {
                      if (newHilirKw) {
                        setConfig({
                          ...config,
                          hilir: {
                            ...config.hilir,
                            keywords: [
                              ...config.hilir.keywords,
                              {
                                label: newHilirKw,
                                upstream_id: "",
                                downstream_id: "",
                              },
                            ],
                          },
                        });
                        setNewHilirKw("");
                      }
                    }}
                    className="px-3 py-2 bg-white border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 flex items-center gap-1"
                  >
                    <Plus size={16} /> Tambah
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Kolom nilai yang diambil
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      FLOWRATE &rarr;
                    </span>
                    <input
                      type="text"
                      value={config.hilir.col_mmscf}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          hilir: { ...config.hilir, col_mmscf: e.target.value },
                        })
                      }
                      className="text-gray-900 w-16 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center bg-white"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 ml-1 bg-white border border-gray-200 px-2 py-1.5 rounded-lg shadow-sm">
                      <input
                        type="checkbox"
                        checked={config.hilir.convert_mmscf || false}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            hilir: {
                              ...config.hilir,
                              convert_mmscf: e.target.checked,
                            },
                          })
                        }
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      Konversi ke MMSCF
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">ENERGY &rarr;</span>
                    <input
                      type="text"
                      value={config.hilir.col_mmbtu}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          hilir: { ...config.hilir, col_mmbtu: e.target.value },
                        })
                      }
                      className="text-gray-900 w-16 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center bg-white"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 ml-1 bg-white border border-gray-200 px-2 py-1.5 rounded-lg shadow-sm">
                      <input
                        type="checkbox"
                        checked={config.hilir.convert_mmbtu || false}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            hilir: {
                              ...config.hilir,
                              convert_mmbtu: e.target.checked,
                            },
                          })
                        }
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      Konversi ke BBTU
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Kelompok data 3 */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              Kelompok data 3 — Stock (Tabel Terpisah)
            </h4>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-4">
                <p className="text-sm font-medium text-gray-700">
                  Pencarian &amp; rentang kolom nilai
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Cari keyword di kolom
                    </label>
                    <input
                      type="text"
                      value={config.stock.search_column}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          stock: {
                            ...config.stock,
                            search_column: e.target.value,
                          },
                        })
                      }
                      className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Keyword
                    </label>
                    <input
                      type="text"
                      value={config.stock.keyword}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          stock: { ...config.stock, keyword: e.target.value },
                        })
                      }
                      className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Kolom nilai mulai
                    </label>
                    <input
                      type="text"
                      value={config.stock.col_start}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          stock: { ...config.stock, col_start: e.target.value },
                        })
                      }
                      className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Kolom nilai akhir
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={config.stock.col_end}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            stock: { ...config.stock, col_end: e.target.value },
                          })
                        }
                        className="text-gray-900 flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                      />
                      <label className="flex items-center gap-1.5 text-xs text-gray-600 bg-white border border-gray-200 px-2 py-1.5 rounded-lg shadow-sm whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={config.stock.convert_bbtu || false}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              stock: {
                                ...config.stock,
                                convert_bbtu: e.target.checked,
                              },
                            })
                          }
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        Konversi ke BBTU
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Mapping nama key (pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    value={config.stock.key_mapping.join(", ")}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        stock: {
                          ...config.stock,
                          key_mapping: e.target.value
                            .split(",")
                            .map((k) => k.trim()),
                        },
                      })
                    }
                    className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white font-mono text-xs"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Kolom C &rarr; I otomatis dipetakan ke nama key di atas
                    secara berurutan
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-xl flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <button
            onClick={handleSaveDefault}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-4 py-2.5 rounded-lg shadow-sm hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center"
          >
            <Save size={16} /> Simpan sebagai default
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer mr-2">
              <input
                type="checkbox"
                checked={isDebugMode}
                onChange={(e) => setIsDebugMode(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              Debug Mode
            </label>
            <button
              onClick={handleResetDefault}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-4 py-2.5 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
            >
              <RotateCcw size={16} /> Reset ke default
            </button>
            <button
              onClick={handleSubmit}
              disabled={uploadMutation.isPending}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm font-bold text-white bg-primary px-6 py-2.5 rounded-lg shadow-md hover:bg-[#0d4a5c] hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={16} className="fill-current" />
              {uploadMutation.isPending ? "Memproses..." : "Proses"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
