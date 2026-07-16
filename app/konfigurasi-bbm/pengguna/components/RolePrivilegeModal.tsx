"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Loader2, Shield, X, Save } from "lucide-react";
import {
  type Role,
  type PrivilegeMapping,
  useRoleResources,
  useRolePrivileges,
  useUpdateRolePrivileges,
} from "@/hooks/service/user-api";

interface RolePrivilegeModalProps {
  open: boolean;
  onClose: () => void;
  role: Role | null;
}

export function RolePrivilegeModal({ open, onClose, role }: RolePrivilegeModalProps) {
  const [mounted, setMounted] = useState(false);

  const { data: resourcesData, isLoading: isLoadingResources } = useRoleResources({
    enabled: open
  });
  const { data: privilegesData, isLoading: isLoadingPrivileges } = useRolePrivileges(role?.id || "", {
    enabled: !!role?.id && open
  });
  const updateMutation = useUpdateRolePrivileges();

  // Local state for the checkbox matrix
  // Record<resource, Set<action>>
  const [privilegeMap, setPrivilegeMap] = useState<Record<string, Set<string>>>({});

  // Sync incoming API data into local state
  useEffect(() => {
    if (privilegesData) {
      const initialMap: Record<string, Set<string>> = {};
      privilegesData.forEach((p) => {
        initialMap[p.resource] = new Set(p.actions);
      });
      setPrivilegeMap(initialMap);
    } else {
      setPrivilegeMap({});
    }
  }, [privilegesData, open]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open || !role) return null;

  const isLoading = isLoadingResources || isLoadingPrivileges;

  const handleToggle = (resource: string, action: string) => {
    setPrivilegeMap((prev) => {
      const next = { ...prev };
      const currentActions = next[resource] ? new Set(next[resource]) : new Set<string>();

      if (currentActions.has(action)) {
        currentActions.delete(action);
      } else {
        currentActions.add(action);
      }

      next[resource] = currentActions;
      return next;
    });
  };

  const handleToggleRow = (resourceKey: string) => {
    const resourceDef = resourcesData?.find(r => r.key === resourceKey);
    // If not found in API, assume all actions [CREATE, READ, UPDATE, DELETE]
    let availableActions = resourceDef?.actions || ["CREATE", "READ", "UPDATE", "DELETE"];

    if (resourceKey === 'external_gas') {
      availableActions = ["READ"];
    }

    setPrivilegeMap((prev) => {
      const next = { ...prev };
      const currentActions = next[resourceKey] ? new Set(next[resourceKey]) : new Set<string>();

      if (currentActions.size === availableActions.length) {
        next[resourceKey] = new Set();
      } else {
        next[resourceKey] = new Set(availableActions);
      }

      return next;
    });
  };

  const allPossibleActions = ["CREATE", "READ", "UPDATE", "DELETE"];

  const handleSave = () => {
    if (!role.id) return;

    // Transform Set back to Array for API
    // Filter out any legacy resources that are no longer valid (not in resourcesData)
    const validResourceKeys = new Set(resourcesData?.map(r => r.key) || []);
    const privilegesPayload: PrivilegeMapping[] = Object.entries(privilegeMap)
      .filter(([resource]) => validResourceKeys.size === 0 || validResourceKeys.has(resource))
      .map(([resource, actionsSet]) => ({
        resource,
        actions: Array.from(actionsSet)
      }))
      .filter(p => p.actions.length > 0);

    updateMutation.mutate(
      { id: role.id, payload: { privileges: privilegesPayload } },
      {
        onSuccess: () => {
          onClose();
        }
      }
    );
  };

  const BBM_RESOURCES = [
    { key: 'dashboard_bbm', label: 'Beranda' },
    { key: 'data_input_bbm', label: 'Data Input' },
    { key: 'kertas_kerja_bbm', label: 'Kertas Kerja' },
    { key: 'site_management_bbm', label: 'TBBM & Pembangkit' },
    { key: 'users_bbm', label: 'Pengguna' },
    { key: 'template_group_bbm', label: 'Template Grup' },
    { key: 'spreadsheet_source_bbm', label: 'Spreadsheet' },
    { key: 'system_config_bbm', label: 'Data Master' },
  ];

  const activeResources = BBM_RESOURCES;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="text-primary" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Hak Akses Peran</h2>
              <p className="text-sm text-gray-500">Edit privileges for: <span className="font-semibold text-primary">{role.name}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-gray-200 shrink-0 bg-gray-50/50">
          <div className="flex space-x-6">
            <div className="pb-3 text-sm font-medium border-b-2 border-primary text-primary">
              BBM
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-secondary animate-spin" />
              <p className="text-gray-500 text-sm">Memuat konfigurasi hak akses...</p>
            </div>
          ) : updateMutation.isError ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">
              Gagal menyimpan perubahan. Silakan coba lagi.
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <table className="w-full text-sm">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium w-48 border-r border-[#0d4a5c]">Resource / Modul</th>
                    {allPossibleActions.map(action => (
                      <th key={action} className="px-4 py-3 text-center font-semibold tracking-wider uppercase text-xs border-r border-[#0d4a5c]">
                        {action}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activeResources.map((resDef, i) => {
                    const resourceKey = resDef.key;
                    // Usually we get available actions from API, but we know it's CRUD
                    const resourceFromApi = resourcesData?.find(r => r.key === resourceKey);
                    let availableActions = resourceFromApi?.actions || allPossibleActions;

                    // Khusus untuk Eksternal (Non EPI), hanya ada satu aksi (READ)
                    if (resourceKey === 'external_gas') {
                      availableActions = ["READ"];
                    }

                    const isEven = i % 2 === 0;
                    const rowSet = privilegeMap[resourceKey] || new Set();
                    const isAllSelected = !!availableActions.length && rowSet.size === availableActions.length;

                    return (
                      <tr key={resourceKey} className={`hover:bg-secondary/5 transition-colors ${isEven ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-4 py-3 border-r border-gray-200 font-medium text-gray-700 uppercase tracking-wide text-xs">
                          <label className="flex items-center gap-2 cursor-pointer w-full h-full group">
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              onChange={() => handleToggleRow(resourceKey)}
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
                            />
                            <span className="group-hover:text-primary transition-colors">{resDef.label}</span>
                          </label>
                        </td>
                        {allPossibleActions.map(action => {
                          if (resourceKey === 'external_gas') {
                            return <td key={action} className="px-4 py-3 border-r border-gray-200 text-center bg-gray-50/50" />;
                          }

                          const isAvailable = availableActions.includes(action);
                          const isChecked = rowSet.has(action);

                          if (!isAvailable) {
                            return (
                              <td key={action} className="px-4 py-3 border-r border-gray-200 text-center bg-gray-50/50">
                                <div className="w-4 h-4 mx-auto border border-gray-200 rounded block bg-gray-100" />
                              </td>
                            );
                          }

                          return (
                            <td key={action} className="px-4 py-3 border-r border-gray-200 text-center">
                              <label className="flex items-center justify-center w-full h-full cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggle(resourceKey, action)}
                                  className="w-4 h-4 text-secondary border-gray-300 rounded focus:ring-secondary cursor-pointer"
                                />
                              </label>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3 shrink-0 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={updateMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending || isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:brightness-90 transition-all hover:shadow-md active:scale-95 disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
