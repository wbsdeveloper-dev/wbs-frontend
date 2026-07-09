"use client";

import {
  LayoutDashboard,
  Database,
  FileText,
  Settings,
  LogOut,
  Bot,
  Reply,
  LucideIcon,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  User,
  MapPin,
  Briefcase,
  Flame,
  Fuel,
  Wind,
  Bell,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { usePrivilege, type Resource } from "@/hooks/usePrivilege";
import { useNotifications } from "@/hooks/service/notification-api";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { hasPrivilege } = usePrivilege();
  
  const canReadNotification = hasPrivilege("notification", "READ");

  const { data: notificationsData } = useNotifications(
    { isRead: false, limit: 1 },
    { refetchInterval: 30_000 },
  );
  const unreadCount = notificationsData?.pagination?.total || 0;

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile sidebar when route changes
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsMobileOpen(false);
  }

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  type MenuType = {
    title: string;
    path?: string;
    icon?: LucideIcon;
    resource?: Resource;
    badgeCount?: number;
    children?: {
      title: string;
      path: string;
      resource?: Resource;
    }[];
  };

  const gasMenus: MenuType[] = [
    {
      title: "Beranda",
      path: "/dashboard/gas",
      icon: LayoutDashboard,
      resource: "dashboard_gas",
    },
    {
      title: "Manajemen Data",
      path: "/edit",
      icon: FileText,
      resource: "data_input_gas",
      children: [
        { title: "Data Input", path: "/edit", resource: "data_input_gas" },
        {
          title: "Data Transportir",
          path: "/edit/transportir",
          resource: "data_transportir_gas",
        },
        {
          title: "File Berita Acara",
          path: "/edit/ba-files",
          resource: "file_berita_acara_gas",
        },
      ],
    },
    {
      title: "Pemasok & Pembangkit",
      path: "/site",
      icon: MapPin,
      resource: "site_management_gas",
    },
    {
      title: "Kontrak & Dokumen",
      path: "/kontrak",
      icon: Briefcase,
      resource: "contracts_gas",
    },
    {
      title: "Konfigurasi Sistem",
      path: "/konfigurasi",
      icon: Database,
      children: [
        {
          title: "Pengguna",
          path: "/konfigurasi/pengguna",
          resource: "users_gas",
        },
        {
          title: "Email Ingest",
          path: "/konfigurasi/email-ingest",
          resource: "email_ingest_gas",
        },
        {
          title: "Template Grup",
          path: "/konfigurasi/template-grup",
          resource: "template_group_gas",
        },
        {
          title: "Spreadsheet",
          path: "/konfigurasi/spreadsheet-source",
          resource: "spreadsheet_source_gas",
        },
        {
          title: "API Keys",
          path: "/konfigurasi/bot/api-keys",
          resource: "api_keys_gas",
        },
        {
          title: "Data Master",
          path: "/konfigurasi/data-master",
          resource: "system_config_gas",
        },
      ],
    },
    {
      title: "Manajemen Bot",
      path: "/whatsappbot",
      icon: Bot,
      resource: "bot_management_gas",
    },
  ];

  const bbmMenus: MenuType[] = [
    {
      title: "Beranda",
      path: "/dashboard/bbm",
      icon: LayoutDashboard,
      resource: "dashboard_bbm",
    },
    {
      title: "Manajemen Data",
      path: "/edit-bbm",
      icon: FileText,
      // Default to data_input_bbm to show parent.
      // Individual children have explicit resources.
      resource: "data_input_bbm",
      children: [
        { title: "Data Input", path: "/edit-bbm", resource: "data_input_bbm" },
        {
          title: "Kertas Kerja",
          path: "/edit-bbm/kertas-kerja",
          resource: "kertas_kerja_bbm",
        },
      ],
    },
    {
      title: "TBBM & Pembangkit",
      path: "/site-bbm",
      icon: MapPin,
      resource: "site_management_bbm",
    },
    {
      title: "Konfigurasi Sistem",
      path: "/konfigurasi-bbm",
      icon: Database,
      children: [
        {
          title: "Pengguna",
          path: "/konfigurasi-bbm/pengguna",
          resource: "users_bbm",
        },
        {
          title: "Template Grup",
          path: "/konfigurasi-bbm/template-grup",
          resource: "template_group_bbm",
        },
        {
          title: "Spreadsheet",
          path: "/konfigurasi-bbm/spreadsheet-source",
          resource: "spreadsheet_source_bbm",
        },
        {
          title: "Data Master",
          path: "/konfigurasi-bbm/data-master",
          resource: "system_config",
        },
      ],
    },
  ];

  const isBbmRoute = pathname.includes("/bbm") || pathname.includes("-bbm");
  const menus = isBbmRoute ? bbmMenus : gasMenus;

  const filteredMenus = menus
    .map((menu) => {
      if (menu.children) {
        return {
          ...menu,
          children: menu.children.filter(
            (child) => !child.resource || hasPrivilege(child.resource, "READ"),
          ),
        };
      }
      return menu;
    })
    .filter((menu) => {
      if (menu.children) {
        return menu.children.length > 0;
      }
      if (menu.resource && !hasPrivilege(menu.resource, "READ")) return false;
      return true;
    });

  // ─── Light-mode styles ─────────────────────────────────────────────
  const menuActive =
    "flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-primary bg-primary/10 rounded-xl w-full cursor-pointer shadow-sm transition-all duration-200 ease-out scale-100";
  const menuNonActive =
    "flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-primary hover:bg-gray-100 rounded-xl w-full cursor-pointer transition-all duration-200 ease-out hover:scale-[1.03]";

  const submenuWrapper = "ml-8 mt-1 space-y-1 border-l border-gray-200 pl-3";

  const chevronBase = "ml-auto transition-transform duration-200 text-gray-400";

  const getActiveDashboardDetails = () => {
    if (pathname.includes("/bbm") || pathname.includes("-bbm")) {
      return {
        title: "BBM",
        icon: Fuel,
        gradient: "from-[#fb923c] to-[#ea580c]",
        textColor: "text-[#ea580c]",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
      };
    } else if (pathname.includes("/lng") || pathname.includes("-lng")) {
      return {
        title: "LNG",
        icon: Wind,
        gradient: "from-cyan-400 to-blue-600",
        textColor: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      };
    }
    return {
      title: "Gas Pipa",
      icon: Flame,
      gradient: "from-secondary to-primary",
      textColor: "text-primary",
      bgColor: "bg-secondary/10",
      borderColor: "border-secondary/20",
    };
  };

  const activeDash = getActiveDashboardDetails();
  const DashIcon = activeDash.icon;

  const sidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full">
      {/* Header with gradient */}
      <div className="p-5 flex justify-between items-center">
        {isMobile && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 rounded-full hover:bg-gray-100 absolute right-3 top-3 transition-colors"
          >
            <X size={24} className="text-gray-400" />
          </button>
        )}
        {!isCollapsed && (
          <div className="flex items-center gap-6">
            <div className="">
              <Image
                src="/logos/pln-epi.png"
                alt="PLN logo"
                width={110}
                height={30}
                className={`transition-none ${isCollapsed ? "opacity-0" : "opacity-100"}`}
              />
            </div>
            {!isMobile && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 hidden lg:block transition-colors"
              >
                {isCollapsed ? (
                  <ChevronRight size={16} className="text-gray-500" />
                ) : (
                  <ChevronLeft size={16} className="text-gray-500" />
                )}
              </button>
            )}
          </div>
        )}
        {isCollapsed && !isMobile && (
          <div className="relative flex items-center h-10 w-full justify-center">
            <Image
              src="/logos/pln.png"
              alt="PLN logo"
              width={30}
              height={30}
              className={`transition-none ${!isCollapsed ? "opacity-0" : "opacity-100"}`}
            />

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="absolute z-100 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 -right-8 transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight size={16} className="text-gray-500" />
              ) : (
                <ChevronLeft size={16} className="text-gray-500" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Decorative line */}
      <div className="mx-4 h-px bg-linear-to-r from-transparent via-gray-200 to-transparent" />

      {/* Merged Dashboard & User Card */}
      <div className="px-3 pt-4 pb-3">
        {!isCollapsed || isMobile ? (
          <div
            className={`rounded-xl border ${activeDash.borderColor} ${activeDash.bgColor} flex flex-col overflow-hidden shadow-sm`}
          >
            {/* Top: Active Dashboard */}
            <div
              onClick={() => router.push("/landingpage")}
              className="p-3 flex items-center gap-3 cursor-pointer hover:bg-white/40 transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activeDash.gradient} flex items-center justify-center shrink-0 shadow-sm`}
              >
                <DashIcon size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">
                  Dashboard Aktif
                </p>
                <p
                  className={`font-bold text-sm truncate ${activeDash.textColor}`}
                >
                  {activeDash.title}
                </p>
              </div>
            </div>

            <div className="h-px w-full bg-black/5" />

            {/* Bottom: User Info */}
            <div className="px-3 py-2.5 flex items-center gap-3 bg-white/40">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 border border-gray-200 shadow-sm">
                <User size={16} className="text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-800 font-semibold text-xs truncate">
                  {user?.email || "User"}
                </p>
                <p className="text-gray-500 text-[10px] truncate">
                  {user?.roles?.join(", ") || "User"}
                </p>
              </div>
              {!isBbmRoute && canReadNotification && (
                <div
                  onClick={() => router.push("/notification")}
                  className="relative p-1.5 rounded-full hover:bg-gray-200 cursor-pointer text-gray-500 transition-colors"
                  title="Notifikasi"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-3 min-w-[12px] px-0.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 items-center">
            <div
              onClick={() => router.push("/landingpage")}
              title={activeDash.title}
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activeDash.gradient} flex items-center justify-center shrink-0 shadow-sm cursor-pointer hover:opacity-90 transition-opacity`}
            >
              <DashIcon size={20} className="text-white" />
            </div>
            <div
              title={user?.email || "User"}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
            >
              <User size={16} className="text-gray-600" />
            </div>
            {!isBbmRoute && canReadNotification && (
              <div
                onClick={() => router.push("/notification")}
                title="Notifikasi"
                className="relative w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 shadow-sm cursor-pointer hover:opacity-90 transition-opacity text-gray-600"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-gray-100">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 py-2 overflow-y-auto">
        <div className="px-4 mb-3">
          {(!isCollapsed || isMobile) && (
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              OVERVIEW
            </p>
          )}
        </div>
        <nav className="space-y-1 px-2">
          {filteredMenus.map((menu, index) => {
            const Icon = menu.icon;

            const isParentActive = menu.path && pathname.startsWith(menu.path);

            const isSubmenuOpen = menu.children?.some((c) =>
              pathname.startsWith(c.path),
            );
            const isOpen = isSubmenuOpen || openMenu === menu.title;

            return (
              <div key={index}>
                {/* Parent menu */}
                {menu.children ? (
                  <button
                    onClick={() =>
                      setOpenMenu(openMenu === menu.title ? null : menu.title)
                    }
                    className={
                      isParentActive || isOpen ? menuActive : menuNonActive
                    }
                  >
                    {Icon && <Icon className="w-5 h-5" />}
                    {(!isCollapsed || isMobile) && (
                      <span className="flex-1 text-left">{menu.title}</span>
                    )}

                    {/* Chevron */}
                    {isOpen && (!isCollapsed || isMobile) && (
                      <ChevronUp className={chevronBase} size={18} />
                    )}
                    {!isOpen && (!isCollapsed || isMobile) && (
                      <ChevronDown className={chevronBase} size={18} />
                    )}
                  </button>
                ) : (
                  <Link
                    href={menu.path || "#"}
                    className={
                      isParentActive || isOpen ? menuActive : menuNonActive
                    }
                  >
                    {Icon && (
                      <div className="relative">
                        <Icon className="w-5 h-5" />
                        {menu.badgeCount && isCollapsed && !isMobile && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                            {menu.badgeCount}
                          </span>
                        )}
                      </div>
                    )}
                    {(!isCollapsed || isMobile) && (
                      <span className="flex-1 text-left flex items-center justify-between">
                        {menu.title}
                        {menu.badgeCount && (
                          <span className="flex h-5 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-bold text-white shadow-sm">
                            {menu.badgeCount}
                          </span>
                        )}
                      </span>
                    )}
                  </Link>
                )}
                {/* Submenu (auto open only when active) */}
                {menu.children && isOpen && (
                  <div className={submenuWrapper}>
                    {menu.children.map((child, idx) => {
                      const isChildActive = pathname === child.path;
                      return (
                        <Link
                          key={idx}
                          href={child.path}
                          className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg w-full cursor-pointer transition-all duration-200 hover:scale-[1.02]
                            ${
                              isChildActive
                                ? "text-primary font-semibold bg-primary/10"
                                : "text-gray-500 hover:text-primary hover:bg-gray-100 font-medium"
                            }
                          ${isCollapsed && !isMobile ? "justify-center" : ""}
                        `}
                        >
                          {child.title}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="mx-4 h-px bg-linear-to-r from-transparent via-gray-200 to-transparent" />
      <div className="py-2">
        <nav className="space-y-1 px-2 pb-3">
          <Link
            href="/landingpage"
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-primary hover:bg-gray-100 rounded-xl mt-2 cursor-pointer w-full transition-all duration-200 hover:scale-[1.03] ${isCollapsed && !isMobile ? "justify-center" : ""}`}
          >
            <Reply className="w-5 h-5" />
            {(!isCollapsed || isMobile) && <span>Pilih Dashboard</span>}
          </Link>
          <button
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-primary hover:bg-gray-100 rounded-xl cursor-pointer w-full transition-all duration-200 hover:scale-[1.03] ${isCollapsed && !isMobile ? "justify-center" : ""}`}
          >
            <Settings className="w-5 h-5" />
            {(!isCollapsed || isMobile) && <span>Pengaturan</span>}
          </button>
          <button
            onClick={logout}
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl cursor-pointer w-full transition-all duration-200 hover:scale-[1.03] ${isCollapsed && !isMobile ? "justify-center" : ""}`}
          >
            <LogOut className="w-5 h-5" />
            {(!isCollapsed || isMobile) && <span>Logout</span>}
          </button>
        </nav>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button — hide when sidebar is already open */}
      {!isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-white shadow-lg border border-slate-200 hover:shadow-xl transition-all"
        >
          <Menu size={22} className="text-primary" />
        </button>
      )}

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-72 bg-white z-50 transform transition-transform duration-300 ease-in-out flex flex-col overflow-y-auto shadow-2xl border-r border-gray-100 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent(true)}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`${
          isCollapsed ? "w-20" : "w-64"
        } bg-white h-full flex-shrink-0 hidden lg:flex flex-col transition-[width] duration-300 ease-in-out shadow-lg border-r border-gray-100 overflow-hidden`}
      >
        {sidebarContent(false)}
      </aside>
    </>
  );
}
