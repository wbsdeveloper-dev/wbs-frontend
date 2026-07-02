import React, { useState } from "react";
import { Plus, Edit2, Trash2, Loader2, AlertCircle } from "lucide-react";
import { Modal } from "@/app/components/ui";
import { 
  useKertasKerjaTemplates,
  useCreateKertasKerjaTemplate,
  useUpdateKertasKerjaTemplate,
  useDeleteKertasKerjaTemplate,
  useKertasKerjaMaster
} from "@/hooks/service/kertas-kerja-api";
import { useDropdowns } from "@/hooks/service/site-api";
import { Autocomplete, TextField } from "@mui/material";

export default function TemplateTab() {
  const { data = [], isLoading: isTemplatesLoading, error } = useKertasKerjaTemplates();
  const createMutation = useCreateKertasKerjaTemplate();
  const updateMutation = useUpdateKertasKerjaTemplate();
  const deleteMutation = useDeleteKertasKerjaTemplate();

  const { data: dropdowns, isLoading: isDropdownsLoading } = useDropdowns();
  const { data: products = [] } = useKertasKerjaMaster("master_product");
  const { data: modas = [] } = useKertasKerjaMaster("master_moda");

  const sites = dropdowns?.plants || [];
  const suppliers = dropdowns?.suppliers || [];
  const isLoading = isTemplatesLoading || isDropdownsLoading;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const [formData, setFormData] = useState({ 
    site_id: "", 
    supplier_id: "",
    product_id: "",
    moda_id: "",
    hop_minimum: "",
    distance: "",
    estimated_delivery_time: "",
    average_usage: "",
    is_active: true
  });

  const handleOpenModal = (item?: any) => {
    setEditingItem(item || null);
    setFormData({
      site_id: item?.site_id || "",
      supplier_id: item?.supplier_id || "",
      product_id: item?.product_id || "",
      moda_id: item?.moda_id || "",
      hop_minimum: item?.hop_minimum || "",
      distance: item?.distance || "",
      estimated_delivery_time: item?.estimated_delivery_time || "",
      average_usage: item?.average_usage || "",
      is_active: item?.is_active ?? true
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      hop_minimum: formData.hop_minimum ? parseFloat(formData.hop_minimum) : null,
      distance: formData.distance ? parseFloat(formData.distance) : null,
      estimated_delivery_time: formData.estimated_delivery_time ? parseFloat(formData.estimated_delivery_time) : null,
      average_usage: formData.average_usage ? parseFloat(formData.average_usage) : null
    };

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
    if (!confirm("Are you sure you want to delete this template?")) return;
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
        <h2 className="text-lg font-medium text-gray-900">Template Kertas Kerja</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-[#0d4a5c] transition-all duration-200 hover:shadow-md active:scale-95"
        >
          <Plus size={18} />
          Tambah Template
        </button>
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Site</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Supplier</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Moda</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Jarak</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Est. Delivery Time</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">HOP Min</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Pemakaian Rata2</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {data.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 text-center text-gray-700">{index + 1}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{item.site_name || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{item.supplier_name || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{item.product_name || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{item.moda_name || "-"}</td>
                    <td className="px-4 py-3 text-center text-gray-600 font-medium">{item.distance ?? "-"}</td>
                    <td className="px-4 py-3 text-center text-gray-600 font-medium">{item.estimated_delivery_time ?? "-"}</td>
                    <td className="px-4 py-3 text-center text-gray-600 font-medium">{item.hop_minimum ?? "-"}</td>
                    <td className="px-4 py-3 text-center text-gray-600 font-medium">{item.average_usage ?? "-"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {item.is_active ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleOpenModal(item)} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-16 text-center text-gray-500">
                      Tidak ada data template yang ditemukan
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
        title={editingItem ? "Edit Template" : "Tambah Template"}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Site</label>
            <Autocomplete
              options={sites || []}
              getOptionLabel={(option) => option.name}
              value={sites?.find((s) => s.id === formData.site_id) || null}
              onChange={(event, newValue) => {
                setFormData({
                  ...formData,
                  site_id: newValue ? newValue.id : "",
                });
              }}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props as any;
                return (
                  <li key={option.id} {...otherProps}>
                    {option.name}
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="-- Pilih Site --"
                  variant="outlined"
                  size="small"
                  required
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "0.375rem",
                      backgroundColor: "white",
                    },
                  }}
                />
              )}
              className="mt-1 w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Supplier</label>
            <Autocomplete
              options={suppliers || []}
              getOptionLabel={(option) => option.name}
              value={suppliers?.find((s) => s.id === formData.supplier_id) || null}
              onChange={(event, newValue) => {
                setFormData({
                  ...formData,
                  supplier_id: newValue ? newValue.id : "",
                });
              }}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props as any;
                return (
                  <li key={option.id} {...otherProps}>
                    {option.name}
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="-- Pilih Supplier --"
                  variant="outlined"
                  size="small"
                  required
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "0.375rem",
                      backgroundColor: "white",
                    },
                  }}
                />
              )}
              className="mt-1 w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Product</label>
            <Autocomplete
              options={products || []}
              getOptionLabel={(option) => option.name}
              value={products?.find((s) => s.id === formData.product_id) || null}
              onChange={(event, newValue) => {
                setFormData({
                  ...formData,
                  product_id: newValue ? newValue.id : "",
                });
              }}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props as any;
                return (
                  <li key={option.id} {...otherProps}>
                    {option.name}
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="-- Pilih Product --"
                  variant="outlined"
                  size="small"
                  required
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "0.375rem",
                      backgroundColor: "white",
                    },
                  }}
                />
              )}
              className="mt-1 w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Moda</label>
            <Autocomplete
              options={modas || []}
              getOptionLabel={(option) => option.name}
              value={modas?.find((s) => s.id === formData.moda_id) || null}
              onChange={(event, newValue) => {
                setFormData({
                  ...formData,
                  moda_id: newValue ? newValue.id : "",
                });
              }}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props as any;
                return (
                  <li key={option.id} {...otherProps}>
                    {option.name}
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="-- Pilih Moda --"
                  variant="outlined"
                  size="small"
                  required
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "0.375rem",
                      backgroundColor: "white",
                    },
                  }}
                />
              )}
              className="mt-1 w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Distance</label>
            <input
              type="number"
              step="any"
              value={formData.distance}
              onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border text-gray-900"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Estimated Delivery Time</label>
            <input
              type="number"
              step="any"
              value={formData.estimated_delivery_time}
              onChange={(e) => setFormData({ ...formData, estimated_delivery_time: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border text-gray-900"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">HOP Minimum</label>
            <input
              type="number"
              step="any"
              value={formData.hop_minimum}
              onChange={(e) => setFormData({ ...formData, hop_minimum: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border text-gray-900"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Pemakaian Rata-Rata (Bln-1)</label>
            <input
              type="number"
              step="any"
              value={formData.average_usage}
              onChange={(e) => setFormData({ ...formData, average_usage: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border text-gray-900"
              placeholder="0.00"
            />
          </div>
          <div className="flex items-center mt-4">
            <input
              id="is_active"
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              Aktif
            </label>
          </div>
          <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-[#0d4a5c] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:col-start-2 sm:text-sm disabled:opacity-50"
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
