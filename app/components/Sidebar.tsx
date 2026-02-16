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
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [subMenuOpen, setSubMenuOpen] = useState(false);
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
    children?: {
      title: string;
      path: string;
    }[];
  };

  const menus: MenuType[] = [
    {
      title: "Beranda",
      path: "/dashboard/gas",
      icon: LayoutDashboard,
    },
    {
      title: "Manajemen Data",
      path: "/edit",
      icon: FileText,
    },
    {
      title: "Konfigurasi Sistem",
      path: "/konfigurasi",
      icon: Database,
      children: [
        { title: "Manajemen Site", path: "/konfigurasi/site" },
        { title: "Kontrak & Dokumen", path: "/konfigurasi/kontrak" },
        { title: "Email Ingest", path: "/konfigurasi/email-ingest" },
        { title: "Template Grup", path: "/konfigurasi/template-grup" },
      ],
    },
    {
      title: "Manajemen Bot",
      path: "/whatsappbot",
      icon: Bot,
    },
  ];

  // ─── Dark-mode-compatible styles ───────────────────────────────────
  const menuActive =
    "flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-white bg-white/15 backdrop-blur-sm rounded-xl w-full cursor-pointer shadow-inner transition-all duration-200 ease-out";
  const menuNonActive =
    "flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-xl w-full cursor-pointer transition-all duration-200 ease-out";

  const submenuWrapper = "ml-8 mt-1 space-y-1 border-l border-white/15 pl-3";

  const chevronBase = "ml-auto transition-transform duration-200 text-white/50";

  const sidebarContent = (isMobile = false) => (
    <>
      {/* Header */}
      <div className="p-5 flex justify-between items-center">
        {isMobile && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 rounded-full hover:bg-white/10 absolute right-3 top-3 transition-colors"
          >
            <X size={24} className="text-white/70" />
          </button>
        )}
        {!isCollapsed && (
          <div className="flex items-center gap-6">
            <div>
              <Image
                src="/logos/pln-epi.png"
                alt="PLN logo"
                width={110}
                height={30}
                className={`transition-none brightness-0 invert ${isCollapsed ? "opacity-0" : "opacity-100"}`}
              />
            </div>
            {!isMobile && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 hidden lg:block transition-colors"
              >
                {isCollapsed ? (
                  <ChevronRight size={16} className="text-white/70" />
                ) : (
                  <ChevronLeft size={16} className="text-white/70" />
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
              className={`transition-none brightness-0 invert ${!isCollapsed ? "opacity-0" : "opacity-100"}`}
            />

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="absolute z-100 p-1.5 rounded-full bg-white/10 hover:bg-white/20 -right-8 transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight size={16} className="text-white/70" />
              ) : (
                <ChevronLeft size={16} className="text-white/70" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Decorative line */}
      <div className="mx-4 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />

      {/* User Profile Card */}
      <div className="px-3 py-3">
        {!isCollapsed || isMobile ? (
          <div className="bg-white/10 rounded-xl p-2.5 border border-white/10 flex items-center gap-3">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-linear-to-br from-white/20 to-white/5 flex items-center justify-center shrink-0 border border-white/15">
              <User size={18} className="text-white" />
            </div>
            {/* User Info */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">
                Ivan Fabriano
              </p>
              <p className="text-white/50 text-xs truncate">
                Admin · IT Division
              </p>
            </div>
          </div>
        ) : (
          /* Collapsed view - just avatar */
          <div className="flex justify-center">
            <div className="w-9 h-9 rounded-full bg-linear-to-br from-white/20 to-white/5 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors border border-white/15">
              <User size={18} className="text-white" />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 py-2">
        <div className="px-4 mb-3">
          {(!isCollapsed || isMobile) && (
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">
              OVERVIEW
            </p>
          )}
        </div>
        <nav className="space-y-1 px-2">
          {menus.map((menu, index) => {
            const Icon = menu.icon;

            const isParentActive = menu.path && pathname.startsWith(menu.path);

            const isSubmenuOpen = menu.children?.some((c) =>
              pathname.startsWith(c.path),
            );

            return (
              <div key={index}>
                {/* Parent menu */}
                <button
                  onClick={() =>
                    menu.children
                      ? setSubMenuOpen(!subMenuOpen)
                      : menu.path && router.push(menu.path)
                  }
                  className={`${
                    isParentActive || isSubmenuOpen ? menuActive : menuNonActive
                  } ${isCollapsed && !isMobile ? "justify-center" : ""}`}
                >
                  {Icon && <Icon className="w-5 h-5" />}
                  {(!isCollapsed || isMobile) && (
                    <span className="flex-1 text-left">{menu.title}</span>
                  )}

                  {/* Chevron */}
                  {menu.children &&
                    subMenuOpen &&
                    (!isCollapsed || isMobile) && (
                      <ChevronUp className={chevronBase} size={18} />
                    )}
                  {menu.children &&
                    !subMenuOpen &&
                    (!isCollapsed || isMobile) && (
                      <ChevronDown className={chevronBase} size={18} />
                    )}
                </button>
                {/* Submenu (auto open only when active) */}
                {menu.children && (isSubmenuOpen || subMenuOpen) && (
                  <div className={submenuWrapper}>
                    {menu.children.map((child, idx) => {
                      const isChildActive = pathname === child.path;
                      return (
                        <button
                          key={idx}
                          onClick={() => router.push(child.path)}
                          className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg w-full cursor-pointer transition-all duration-200
                            ${
                              isChildActive
                                ? "text-white font-semibold bg-white/15"
                                : "text-white/60 hover:text-white hover:bg-white/10 font-medium"
                            }
                            ${isCollapsed && !isMobile ? "justify-center" : ""}
                          `}
                        >
                          {child.title}
                        </button>
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
      <div className="mx-4 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />
      <div className="py-2">
        <nav className="space-y-1 px-2 pb-3">
          <button
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-xl mt-2 cursor-pointer w-full transition-all ${isCollapsed && !isMobile ? "justify-center" : ""}`}
            onClick={() => router.push("/landingpage")}
          >
            <Reply className="w-5 h-5" />
            {(!isCollapsed || isMobile) && <span>Pilih Dashboard</span>}
          </button>
          <button
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-xl cursor-pointer w-full transition-all ${isCollapsed && !isMobile ? "justify-center" : ""}`}
          >
            <Settings className="w-5 h-5" />
            {(!isCollapsed || isMobile) && <span>Pengaturan</span>}
          </button>
          <button
            onClick={() => router.push("/auth/login")}
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-300 hover:text-red-200 hover:bg-red-500/10 rounded-xl cursor-pointer w-full transition-all ${isCollapsed && !isMobile ? "justify-center" : ""}`}
          >
            <LogOut className="w-5 h-5" />
            {(!isCollapsed || isMobile) && <span>Logout</span>}
          </button>
        </nav>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-white shadow-lg border border-slate-200 hover:shadow-xl transition-all"
      >
        <Menu size={22} className="text-[#115d72]" />
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-72 bg-linear-to-b from-[#115d72] via-[#115d72] to-[#0e4d5f] z-50 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent(true)}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`${
          isCollapsed ? "w-20" : "w-64"
        } bg-linear-to-b from-[#115d72] via-[#115d72] to-[#0e4d5f] h-screen hidden lg:flex flex-col transition-[width] duration-300 ease-in-out shadow-xl shadow-[#115d72]/20`}
      >
        {sidebarContent(false)}
      </aside>
    </>
  );
}
