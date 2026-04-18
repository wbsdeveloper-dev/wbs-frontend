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
    if (privilegesData?.privileges) {
      const initialMap: Record<string, Set<string>> = {};
      privilegesData.privileges.forEach((p) => {
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

  const handleToggleRow = (resource: string) => {
    if (!resourcesData?.actions) return;
    setPrivilegeMap((prev) => {
      const next = { ...prev };
      const currentActions = next[resource] ? new Set(next[resource]) : new Set<string>();
      
      // If all are selected, deselect all. Else, select all.
      if (currentActions.size === resourcesData.actions.length) {
        next[resource] = new Set();
      } else {
        next[resource] = new Set(resourcesData.actions);
      }
      
      return next;
    });
  };

  const handleSave = () => {
    if (!role.id) return;
    
    // Transform Set back to Array for API
    const privilegesPayload: PrivilegeMapping[] = Object.entries(privilegeMap).map(([resource, actionsSet]) => ({
      resource,
      actions: Array.from(actionsSet)
    })).filter(p => p.actions.length > 0);

    updateMutation.mutate(
      { id: role.id, payload: { privileges: privilegesPayload } },
      {
        onSuccess: () => {
          onClose();
        }
      }
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#115d72]/10 flex items-center justify-center">
              <Shield className="text-[#115d72]" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Hak Akses Peran</h2>
              <p className="text-sm text-gray-500">Edit privileges for: <span className="font-semibold text-[#115d72]">{role.name}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-[#14a2bb] animate-spin" />
              <p className="text-gray-500 text-sm">Memuat konfigurasi hak akses...</p>
            </div>
          ) : updateMutation.isError ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">
              Gagal menyimpan perubahan. Silakan coba lagi.
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <table className="w-full text-sm">
                <thead className="bg-[#115d72] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium w-48 border-r border-[#0d4a5c]">Resource / Modul</th>
                    {resourcesData?.actions?.map(action => (
                      <th key={action} className="px-4 py-3 text-center font-semibold tracking-wider uppercase text-xs border-r border-[#0d4a5c]">
                        {action}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {resourcesData?.resources?.map((resource, i) => {
                    const isEven = i % 2 === 0;
                    const rowSet = privilegeMap[resource] || new Set();
                    const isAllSelected = !!resourcesData?.actions?.length && rowSet.size === resourcesData.actions.length;

                    return (
                      <tr key={resource} className={`hover:bg-[#14a2bb]/5 transition-colors ${isEven ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-4 py-3 border-r border-gray-200 font-medium text-gray-700 uppercase tracking-wide text-xs">
                          <label className="flex items-center gap-2 cursor-pointer w-full h-full group">
                            <input 
                              type="checkbox"
                              checked={isAllSelected}
                              onChange={() => handleToggleRow(resource)}
                              className="w-4 h-4 text-[#115d72] border-gray-300 rounded focus:ring-[#115d72] cursor-pointer"
                            />
                            <span className="group-hover:text-[#115d72] transition-colors">{resource.replace(/_/g, " ")}</span>
                          </label>
                        </td>
                        {resourcesData?.actions?.map(action => {
                          const isChecked = rowSet.has(action);
                          return (
                            <td key={action} className="px-4 py-3 border-r border-gray-200 text-center">
                              <label className="flex items-center justify-center w-full h-full cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggle(resource, action)}
                                  className="w-4 h-4 text-[#14a2bb] border-gray-300 rounded focus:ring-[#14a2bb] cursor-pointer"
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
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3 rounded-b-2xl">
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
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#115d72] rounded-lg hover:bg-[#0d4a5c] transition-all hover:shadow-md active:scale-95 disabled:opacity-50"
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
