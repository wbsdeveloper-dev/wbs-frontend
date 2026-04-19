import { useAuth } from "@/components/providers/auth-provider";
import { useMemo } from "react";

export type Resource =
  | "dashboard"
  | "data_management"
  | "site_management"
  | "contracts"
  | "users"
  | "email_ingest"
  | "template_group"
  | "spreadsheet_source"
  | "api_keys"
  | "bot_management";

export type Action = "CREATE" | "READ" | "UPDATE" | "DELETE";

export function usePrivilege() {
  const { user, isAuthenticated } = useAuth();

  const hasPrivilege = useMemo(
    () =>
      (resource: Resource, action: Action): boolean => {
        if (!isAuthenticated || !user) return false;

        // If the user has an ADMIN role, grant all privileges automatically
        if (user.roles?.includes("ADMIN")) {
          return true;
        }

        // Standard lookup inside their mapped privileges
        if (!user.privileges || !user.privileges[resource]) {
          return false; // No access to to this resource
        }

        return user.privileges[resource].includes(action);
      },
    [user, isAuthenticated],
  );

  return { hasPrivilege };
}
