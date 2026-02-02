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
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

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
        { title: "Manajemen Pembangkit", path: "/konfigurasi/pembangkit" },
        { title: "Manajemen Pemasok", path: "/konfigurasi/pemasok" },
        { title: "Manajemen Lokasi", path: "/konfigurasi/lokasi" },
        { title: "Template Grup", path: "/konfigurasi/template-grup" },
        { title: "Manajemen Kontrak", path: "/konfigurasi/kontrak" },
      ],
    },
    {
      title: "Manajemen Bot",
      path: "/whatsappbot",
      icon: Bot,
    },
  ];

  const menuActive =
    "flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white bg-white/20 rounded-xl w-full cursor-pointer justify-center backdrop-blur-sm";
  const menuNonActive =
    "flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-xl w-full cursor-pointer justify-center transition-all duration-200";

  const submenuWrapper = "ml-8 mt-1 space-y-1 border-l border-white/20 pl-3";

  const chevronBase = "ml-auto transition-transform duration-200";

  const chevronOpen = "rotate-90";

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {/* Header with gradient */}
      <div className="p-5 flex justify-between items-center">
        {isMobile && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 rounded-full hover:bg-white/20 absolute right-3 top-3"
          >
            <X size={24} className="text-white" />
          </button>
        )}
        {!isCollapsed && (
          <div className="flex items-center gap-6">
            <div className="bg-white p-2 rounded-md">
              <Image
                src="/logos/pln-epi.png"
                alt="PLN logo"
                width={110}
                height={30}
                className={`transition-none ${
                  isCollapsed ? "opacity-0" : "opacity-100"
                }`}
              />
            </div>
            {!isMobile && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 hidden lg:block transition-colors"
              >
                {isCollapsed ? (
                  <ChevronRight size={16} className="text-white" />
                ) : (
                  <ChevronLeft size={16} className="text-white" />
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
              className={`transition-none ${
                !isCollapsed ? "opacity-0" : "opacity-100"
              }`}
            />

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="absolute z-100 p-1.5 rounded-full bg-white/20 hover:bg-white/30 -right-8 transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight size={16} className="text-white" />
              ) : (
                <ChevronLeft size={16} className="text-white" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Decorative line */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      {/* User Profile Card - Glass Style */}
      <div className="px-3 py-3">
        {(!isCollapsed || isMobile) ? (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/20 flex items-center gap-3">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center border border-white/30 flex-shrink-0">
              <User size={18} className="text-white" />
            </div>
            {/* User Info */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">Ivan Pratama</p>
              <p className="text-white/60 text-xs truncate">Admin · IT Division</p>
            </div>
          </div>
        ) : (
          /* Collapsed view - just avatar */
          <div className="flex justify-center">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center border border-white/30 cursor-pointer hover:bg-white/20 transition-colors">
              <User size={18} className="text-white" />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 py-2">
        <div className="px-4 mb-3">
          {(!isCollapsed || isMobile) && (
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">
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
                  className={
                    isParentActive || isSubmenuOpen ? menuActive : menuNonActive
                  }
                >
                  {Icon && <Icon className="w-5 h-5" />}
                  {(!isCollapsed || isMobile) && (
                    <span className="flex-1 text-left">{menu.title}</span>
                  )}

                  {/* Chevron */}
                  {menu.children && subMenuOpen && (!isCollapsed || isMobile) && (
                    <ChevronUp
                      className={`${chevronBase} ${
                        isSubmenuOpen ? chevronOpen : ""
                      }`}
                      size={18}
                    />
                  )}
                  {menu.children && !subMenuOpen && (!isCollapsed || isMobile) && (
                    <ChevronDown
                      className={`${chevronBase} ${
                        isSubmenuOpen ? chevronOpen : ""
                      }`}
                      size={18}
                    />
                  )}
                </button>

                {/* Submenu (auto open only when active) */}
                {menu.children && (isSubmenuOpen || subMenuOpen) && (
                  <div className={submenuWrapper}>
                    {menu.children.map((child, index) => {
                      return (
                        <button
                          key={index}
                          onClick={() =>
                            menu.children && (!isCollapsed || isMobile)
                              ? setSubMenuOpen(!subMenuOpen)
                              : menu.path && router.push(menu.path)
                          }
                          className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg w-full cursor-pointer
                          ${
                            isParentActive || isSubmenuOpen
                              ? "text-white bg-white/10"
                              : "text-white/70 hover:text-white hover:bg-white/10"
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
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="py-2">
        <nav className="space-y-1 px-2 pb-3">
          <button
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-xl mt-2 cursor-pointer w-full transition-all ${isCollapsed && !isMobile ? "justify-center" : ""}`}
            onClick={() => router.push("/landingpage")}
          >
            <Reply className="w-5 h-5" />
            {(!isCollapsed || isMobile) && <span>Pilih Dashboard</span>}
          </button>
          <button
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-xl cursor-pointer w-full transition-all ${isCollapsed && !isMobile ? "justify-center" : ""}`}
          >
            <Settings className="w-5 h-5" />
            {(!isCollapsed || isMobile) && <span>Pengaturan</span>}
          </button>
          <button
            onClick={() => router.push("/auth/login")}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-300 hover:text-red-200 hover:bg-red-500/20 rounded-xl cursor-pointer w-full transition-all"
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-gradient-to-br from-[#115d72] to-[#0e4d5f] shadow-lg shadow-[#115d72]/30 hover:shadow-xl transition-all"
      >
        <Menu size={22} className="text-white" />
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-[#115d72] via-[#115d72] to-[#0e4d5f] z-50 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent isMobile={true} />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`${
          isCollapsed ? "w-20" : "w-64"
        } bg-gradient-to-b from-[#115d72] via-[#115d72] to-[#0e4d5f] h-screen hidden lg:flex flex-col transition-[width] duration-300 ease-in-out shadow-xl shadow-[#115d72]/20`}
      >
        <SidebarContent isMobile={false} />
      </aside>
    </>
  );
}
