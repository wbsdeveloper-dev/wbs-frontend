import React, { useState } from "react";
import { Plus, Edit2, Trash2, Loader2, AlertCircle, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Modal } from "@/app/components/ui";
import { 
  useKertasKerjaMaster, 
  useCreateKertasKerjaMaster, 
  useUpdateKertasKerjaMaster, 
  useDeleteKertasKerjaMaster 
} from "@/hooks/service/kertas-kerja-api";
import { usePrivilege } from "@/hooks/usePrivilege";

interface MasterGenericTabProps {
  table: string;
  title: string;
  comodityFilter?: string;
}

export default function MasterGenericTab({ table, title, comodityFilter }: MasterGenericTabProps) {
  const { hasPrivilege } = usePrivilege();
  const canCreate = hasPrivilege("system_config", "CREATE");
  const canUpdate = hasPrivilege("system_config", "UPDATE");
  const canDelete = hasPrivilege("system_config", "DELETE");

  const { data = [], isLoading, error } = useKertasKerjaMaster(table, comodityFilter);
  const createMutation = useCreateKertasKerjaMaster(table);
  const updateMutation = useUpdateKertasKerjaMaster(table);
  const deleteMutation = useDeleteKertasKerjaMaster(table);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const defaultComodity = comodityFilter ? comodityFilter.split(',')[0].trim() : "BBM";
  const [formData, setFormData] = useState({ name: "", comodity: defaultComodity });

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const filteredData = React.useMemo(() => {
    if (!searchQuery) return data;
    return data.filter((item: any) => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const hasComodity = table !== "master_moda" && table !== "master_pola_operasi";

  const handleOpenModal = (item?: any) => {
    setEditingItem(item || null);
    setFormData({
      name: item?.name || "",
      comodity: item?.comodity || defaultComodity,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { name: formData.name };
    if (hasComodity) payload.comodity = formData.comodity;

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to save data");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err: any) {
      alert(err.message || "Failed to delete data");
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-lg font-medium text-gray-900 w-full sm:w-auto">{title}</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
          {canCreate && (
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:brightness-90 transition-all duration-200 hover:shadow-md active:scale-95 whitespace-nowrap"
            >
              <Plus size={18} />
              Tambah Data
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-md flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error instanceof Error ? error.message : "Terjadi kesalahan"}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama</th>
                  {hasComodity && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Komoditas</th>}
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Dibuat Pada</th>
                  {(canUpdate || canDelete) && (
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {paginatedData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 text-center text-gray-700">{((currentPage - 1) * itemsPerPage) + index + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                    {hasComodity && <td className="px-4 py-3 text-gray-600">{item.comodity || "-"}</td>}
                    <td className="px-4 py-3 text-center text-gray-500 text-xs">
                      {new Date(item.created_at).toLocaleDateString("id-ID")}
                    </td>
                    {(canUpdate || canDelete) && (
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {canUpdate && (
                            <button onClick={() => handleOpenModal(item)} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Edit">
                              <Edit2 size={16} />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={hasComodity ? 5 : 4} className="px-4 py-16 text-center text-gray-500">
                      Tidak ada data yang ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {data.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between bg-white gap-4">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>
                  Menampilkan {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} data
                </span>
                <div className="flex items-center gap-2">
                  <span>Baris:</span>
                  <select 
                    value={itemsPerPage} 
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded-md py-1 px-2 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((p, i, arr) => (
                      <React.Fragment key={p}>
                        {i > 0 && arr[i - 1] !== p - 1 && <span className="px-2 text-gray-400">...</span>}
                        <button
                          onClick={() => setCurrentPage(p)}
                          className={`min-w-[28px] h-7 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                            currentPage === p ? "bg-primary text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    ))
                  }

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? `Edit ${title}` : `Tambah ${title}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nama</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border text-gray-900"
            />
          </div>
          {hasComodity && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Komoditas</label>
              {comodityFilter && comodityFilter.includes(',') ? (
                <select
                  value={formData.comodity}
                  onChange={(e) => setFormData({ ...formData, comodity: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border text-gray-900 bg-white"
                >
                  {comodityFilter.split(',').map(c => c.trim()).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.comodity}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border bg-gray-100 text-gray-700 cursor-not-allowed font-medium"
                />
              )}
            </div>
          )}
          <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:brightness-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:col-start-2 sm:text-sm disabled:opacity-50"
            >
              {isSaving ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
            >
              Batal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
