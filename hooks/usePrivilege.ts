import { useAuth } from "@/components/providers/auth-provider";
import { useMemo } from "react";
import { usePathname } from "next/navigation";

export type Resource =
  | "dashboard" | "dashboard_gas" | "dashboard_bbm"
  | "data_management" | "data_input_gas" | "data_transportir_gas" | "file_berita_acara_gas" | "data_input_bbm" | "kertas_kerja_bbm"
  | "site_management" | "site_management_gas" | "site_management_bbm"
  | "contracts" | "contracts_gas" | "contracts_bbm"
  | "users" | "users_gas" | "users_bbm"
  | "email_ingest" | "email_ingest_gas" | "email_ingest_bbm"
  | "template_group" | "template_group_gas" | "template_group_bbm"
  | "spreadsheet_source" | "spreadsheet_source_gas" | "spreadsheet_source_bbm"
  | "api_keys" | "api_keys_gas" | "api_keys_bbm"
  | "system_config" | "system_config_gas" | "system_config_bbm"
  | "bot_management" | "bot_management_gas" | "bot_management_bbm"
  | string;

export type Action = "CREATE" | "READ" | "UPDATE" | "DELETE";

export function usePrivilege() {
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname() || "";

  const hasPrivilege = useMemo(
    () =>
      (resource: Resource, action: Action): boolean => {
        if (!isAuthenticated || !user) return false;

        
        const isBbmRoute = pathname.includes("/bbm") || pathname.includes("-bbm");
        let effectiveResource = resource;
        
        // Dynamically resolve legacy resources to their gas/bbm counterparts based on the route
        const legacyResources = [
          "dashboard", "data_management", "site_management", "contracts", "users",
          "email_ingest", "template_group", "spreadsheet_source", "api_keys",
          "system_config", "bot_management"
        ];
        
        if (legacyResources.includes(resource as string)) {
           if (isBbmRoute) {
              if (resource === "data_management") {
                 // Kertas Kerja input page uses data_management natively but we split it
                 if (pathname.includes("kertas-kerja")) {
                    effectiveResource = "kertas_kerja_bbm";
                 } else {
                    effectiveResource = "data_input_bbm";
                 }
              } else {
                 effectiveResource = `${resource}_bbm`;
              }
           } else {
              if (resource === "data_management") {
                 if (pathname.includes("transportir")) {
                    effectiveResource = "data_transportir_gas";
                 } else if (pathname.includes("ba-files")) {
                    effectiveResource = "file_berita_acara_gas";
                 } else {
                    effectiveResource = "data_input_gas";
                 }
              } else {
                 effectiveResource = `${resource}_gas`;
              }
           }
        }

        // Check explicit match or effective match
        if (user.privileges && user.privileges[effectiveResource]?.includes(action)) return true;
        if (user.privileges && user.privileges[resource]?.includes(action)) return true;

        return false;
      },
    [user, isAuthenticated, pathname],
  );

  return { hasPrivilege };
}
