import re

path = '/Users/sbuhmpm/development/WBS_PLN_EPI/wbs-frontend-nextjs/app/components/EditBbmDataTable.tsx'
with open(path, 'r') as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    '  ChevronDown,\n} from "lucide-react";',
    '  ChevronDown,\n  Filter,\n  X,\n} from "lucide-react";'
)

# 2. Add FilterTag
filter_tag = """
const FilterTag = ({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#115d72]/10 text-[#115d72]">
    {label}
    <button
      onClick={onRemove}
      className="p-0.5 rounded-full hover:bg-[#115d72]/20 transition-colors"
    >
      <X size={12} />
    </button>
  </span>
);

export default function EditBbmDataTable"""
content = content.replace('export default function EditBbmDataTable', filter_tag)

# 3. Add state and handlers
state_code = """
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{
    tbbm?: string;
    pembangkit?: string;
    product?: string;
    moda?: string;
    startDate?: string;
    endDate?: string;
  }>({});

  const [localTbbm, setLocalTbbm] = useState("");
  const [localPembangkit, setLocalPembangkit] = useState("");
  const [localProduct, setLocalProduct] = useState("");
  const [localModa, setLocalModa] = useState("");
  const [localStartDate, setLocalStartDate] = useState("");
  const [localEndDate, setLocalEndDate] = useState("");

  const activeFilterCount = [
    filters.tbbm,
    filters.pembangkit,
    filters.product,
    filters.moda,
    filters.startDate || filters.endDate,
  ].filter(Boolean).length;

  const handleApplyFilters = () => {
    setFilters({
      ...(localTbbm ? { tbbm: localTbbm } : {}),
      ...(localPembangkit ? { pembangkit: localPembangkit } : {}),
      ...(localProduct ? { product: localProduct } : {}),
      ...(localModa ? { moda: localModa } : {}),
      ...(localStartDate ? { startDate: localStartDate } : {}),
      ...(localEndDate ? { endDate: localEndDate } : {}),
    });
    setShowFilters(false);
    setPage(1);
  };

  const handleResetFilters = () => {
    setLocalTbbm("");
    setLocalPembangkit("");
    setLocalProduct("");
    setLocalModa("");
    setLocalStartDate("");
    setLocalEndDate("");
    setFilters({});
    setPage(1);
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // TBBM
      if (
        filters.tbbm &&
        !r.tbbm?.toLowerCase().includes(filters.tbbm.toLowerCase())
      )
        return false;
      // Pembangkit
      if (
        filters.pembangkit &&
        !r.pembangkit?.toLowerCase().includes(filters.pembangkit.toLowerCase())
      )
        return false;
      // Produk
      if (
        filters.product &&
        !r.product?.toLowerCase().includes(filters.product.toLowerCase())
      )
        return false;
      // Moda
      if (
        filters.moda &&
        !r.moda?.toLowerCase().includes(filters.moda.toLowerCase())
      )
        return false;
      
      // Date Range (reportDate is YYYY-MM)
      if (filters.startDate) {
        const startMonth = filters.startDate.substring(0, 7);
        if (r.reportDate < startMonth) return false;
      }
      if (filters.endDate) {
        const endMonth = filters.endDate.substring(0, 7);
        if (r.reportDate > endMonth) return false;
      }

      return true;
    });
  }, [records, filters]);
"""
# Need to replace the old filteredRecords
# Find `const filteredRecords = useMemo(() => { ... }, [records, searchTerm]);`
old_filtered = """  const filteredRecords = useMemo(() => {
    if (!searchTerm) return records;
    const lower = searchTerm.toLowerCase();
    return records.filter(
      (r) =>
        (r.tbbm?.toLowerCase() || "").includes(lower) ||
        (r.pembangkit?.toLowerCase() || "").includes(lower) ||
        (r.reportDate?.toLowerCase() || "").includes(lower) ||
        (r.product?.toLowerCase() || "").includes(lower),
    );
  }, [records, searchTerm]);"""

content = content.replace('  const [searchTerm, setSearchTerm] = useState("");\n', '')
content = content.replace(old_filtered, state_code)
content = content.replace('useMemo(() => {\n    setPage(1);\n  }, [searchTerm]);', '')
content = content.replace('{searchTerm\n                    ? "Tidak ada data yang cocok dengan pencarian"\n                    : "Tidak ada data BBM"}', '"Tidak ada data BBM yang sesuai dengan filter"')

# 4. Replace Header and search bar with Filter UI
old_header = """      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-b border-gray-200 gap-3">
        <div className="flex items-center gap-1.5">
          <Menu size={20} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Tabel BBM Monthly
          </span>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Cari data BBM..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14a2bb]/40 focus:border-[#14a2bb] transition-all w-full sm:w-64"
          />
        </div>
      </div>"""

new_header = """      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-b border-gray-200 gap-3">
        <div className="flex items-center gap-1.5">
          <Menu size={20} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Tabel BBM Monthly
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
              showFilters || activeFilterCount > 0
                ? "bg-[#115d72] text-white border-[#115d72]"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <Filter size={16} />
            Filter
            {activeFilterCount > 0 && (
              <span className="ml-1 flex items-center justify-center w-5 h-5 bg-white/20 rounded-full text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="px-4 py-4 border-b border-gray-200 bg-gray-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                TBBM / Pemasok
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={localTbbm}
                  onChange={(e) => setLocalTbbm(e.target.value)}
                  placeholder="Cari TBBM..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Pembangkit
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={localPembangkit}
                  onChange={(e) => setLocalPembangkit(e.target.value)}
                  placeholder="Cari Pembangkit..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Produk
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={localProduct}
                  onChange={(e) => setLocalProduct(e.target.value)}
                  placeholder="Cari Produk..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Moda
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={localModa}
                  onChange={(e) => setLocalModa(e.target.value)}
                  placeholder="Cari Moda..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={localStartDate}
                onChange={(e) => setLocalStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={localEndDate}
                onChange={(e) => setLocalEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#14a2bb] transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-4">
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              <X size={14} />
              Reset
            </button>
            <button
              onClick={handleApplyFilters}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-all duration-200"
            >
              <Search size={14} />
              Terapkan Filter
            </button>
          </div>
        </div>
      )}

      {/* Active filter tags */}
      {activeFilterCount > 0 && !showFilters && (
        <div className="px-4 py-2.5 border-b border-gray-200 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 font-medium">
            Filter aktif:
          </span>
          {filters.tbbm && (
            <FilterTag
              label={`TBBM: ${filters.tbbm}`}
              onRemove={() => {
                setLocalTbbm("");
                setFilters((f) => ({ ...f, tbbm: undefined }));
              }}
            />
          )}
          {filters.pembangkit && (
            <FilterTag
              label={`Pembangkit: ${filters.pembangkit}`}
              onRemove={() => {
                setLocalPembangkit("");
                setFilters((f) => ({ ...f, pembangkit: undefined }));
              }}
            />
          )}
          {filters.product && (
            <FilterTag
              label={`Produk: ${filters.product}`}
              onRemove={() => {
                setLocalProduct("");
                setFilters((f) => ({ ...f, product: undefined }));
              }}
            />
          )}
          {filters.moda && (
            <FilterTag
              label={`Moda: ${filters.moda}`}
              onRemove={() => {
                setLocalModa("");
                setFilters((f) => ({ ...f, moda: undefined }));
              }}
            />
          )}
          {(filters.startDate || filters.endDate) && (
            <FilterTag
              label={`Tanggal: ${filters.startDate || "..."} - ${filters.endDate || "..."}`}
              onRemove={() => {
                setLocalStartDate("");
                setLocalEndDate("");
                setFilters((f) => ({ ...f, startDate: undefined, endDate: undefined }));
              }}
            />
          )}
          <button
            onClick={handleResetFilters}
            className="text-xs text-red-500 hover:text-red-700 font-medium ml-1 transition-colors"
          >
            Hapus Semua
          </button>
        </div>
      )}"""

content = content.replace(old_header, new_header)

with open(path, 'w') as f:
    f.write(content)
