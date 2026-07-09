import React, { useState } from "react";
import { Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import { Modal } from "@/app/components/ui";
import { Autocomplete, TextField } from "@mui/material";
import { 
  useCtmsMappings, 
  useCreateCtmsMapping, 
  useUpdateCtmsMapping, 
  useDeleteCtmsMapping 
} from "@/hooks/service/ctms-mapping-api";
import { useDropdowns } from "@/hooks/service/site-api";
import { usePrivilege } from "@/hooks/usePrivilege";

export default function CtmsMappingTab() {
  const { hasPrivilege } = usePrivilege();
  const canCreate = hasPrivilege("system_config", "CREATE");
  const canUpdate = hasPrivilege("system_config", "UPDATE");
  const canDelete = hasPrivilege("system_config", "DELETE");
  const { data = [], isLoading, error } = useCtmsMappings();
  const { data: dropdowns, isLoading: isLoadingDropdowns } = useDropdowns();
  
  const createMutation = useCreateCtmsMapping();
  const updateMutation = useUpdateCtmsMapping();
  const deleteMutation = useDeleteCtmsMapping();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const [formData, setFormData] = useState({ ctms_name: "", site_name: "", site_type: "" });

  const allSites = [
    ...(dropdowns?.suppliers || []).map(s => ({ ...s, site_type: 'PEMASOK' })),
    ...(dropdowns?.plants || []).map(p => ({ ...p, site_type: 'PEMBANGKIT' }))
  ];

  const handleOpenModal = (item?: any) => {
    setEditingItem(item || null);
    setFormData({
      ctms_name: item?.ctms_name || "",
      site_name: item?.site_name || "",
      site_type: item?.site_type || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.site_name) return alert("Pilih Site!");

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, payload: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to save data");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this mapping?")) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err: any) {
      alert(err.message || "Failed to delete data");
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Mapping CTMS</h2>
        {canCreate && (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-95"
          >
            <Plus size={18} />
            Tambah Mapping
          </button>
        )}
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama CTMS</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">WBS Site</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tipe</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{item.ctms_name}</td>
                    <td className="px-4 py-3 text-gray-600">{item.site_name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.site_type && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.site_type === 'PEMASOK' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          {item.site_type}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-16 text-center text-gray-500">
                      Tidak ada data yang ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Edit Mapping" : "Tambah Mapping"}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama CTMS</label>
            <input
              type="text"
              required
              value={formData.ctms_name}
              onChange={(e) => setFormData({ ...formData, ctms_name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border text-gray-900"
              placeholder="Misal: TBBM Manggis"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Site di WBS</label>
            <Autocomplete
              options={allSites}
              getOptionLabel={(option) => option.name}
              value={allSites.find((s) => s.name === formData.site_name) || null}
              onChange={(event, newValue) => {
                setFormData({ 
                  ...formData, 
                  site_name: newValue ? newValue.name : "",
                  site_type: newValue ? newValue.site_type : ""
                });
              }}
              isOptionEqualToValue={(option, value) => option.name === value?.name}
              loading={isLoadingDropdowns}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Cari Site..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      padding: '4px 14px',
                      borderRadius: '0.5rem',
                    }
                  }}
                />
              )}
            />
          </div>
          <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex w-full justify-center rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0d4a5c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed sm:col-start-2"
            >
              {isSaving ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
            >
              Batal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
