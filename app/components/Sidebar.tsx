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
    "flex items-center gap-3 px-3 py-2 text-sm font-medium text-[#14a1bb] bg-teal-50 rounded-lg w-full cursor-pointer justify-center";
  const menuNonActive =
    "flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-teal-50 rounded-lg w-full cursor-pointer justify-center";

  const submenuWrapper = "ml-8 mt-1 space-y-1 border-l border-gray-200 pl-3";

  const chevronBase = "ml-auto transition-transform duration-200";

  const chevronOpen = "rotate-90";

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        {isMobile && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 rounded-full hover:bg-gray-100 absolute right-4 top-4"
          >
            <X size={24} className="text-gray-700" />
          </button>
        )}
        {!isCollapsed && (
          <div className="flex items-center gap-10">
            <Image
              src="/logos/pln-epi.png"
              alt="PLN logo"
              width={140}
              height={30}
              className={`transition-none ${
                isCollapsed ? "opacity-0" : "opacity-100"
              }`}
            />
            {!isMobile && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 rounded-full hover:bg-[#14a1bb] bg-[#13a5bf87] hidden lg:block"
              >
                {isCollapsed ? (
                  <ChevronRight size={18} />
                ) : (
                  <ChevronLeft size={18} />
                )}
              </button>
            )}
          </div>
        )}
        {isCollapsed && !isMobile && (
          <div className="relative flex items-center h-10">
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
              className="absolute z-100 p-2 rounded-full hover:bg-gray-100 bg-[#13a5bf87] -right-10"
            >
              {isCollapsed ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 py-6">
        <div className="px-4 mb-2">
          {(!isCollapsed || isMobile) && (
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
                              ? "text-[#14a1bb] bg-teal-50"
                              : "text-gray-700 hover:bg-teal-50"
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

      <div className="border-t border-gray-200">
        <div className="px-4 py-2"></div>
        <nav className="space-y-1 px-2 pb-4">
          <button
            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-teal-50 rounded-lg mt-4 cursor-pointer w-full ${isCollapsed && !isMobile ? "justify-center" : ""}`}
            onClick={() => router.push("/landingpage")}
          >
            <Reply className="w-5 h-5" />
            {(!isCollapsed || isMobile) && <span>Pilih Dashboard</span>}
          </button>
          <button
            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-teal-50 rounded-lg mt-4 cursor-pointer w-full ${isCollapsed && !isMobile ? "justify-center" : ""}`}
          >
            <Settings className="w-5 h-5" />
            {(!isCollapsed || isMobile) && <span>Pengaturan</span>}
          </button>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
          >
            <LogOut className="w-5 h-5" />
            {(!isCollapsed || isMobile) && <span>Logout</span>}
          </a>
        </nav>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md hover:bg-gray-50"
      >
        <Menu size={24} className="text-gray-700" />
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-white z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent isMobile={true} />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`${
          isCollapsed ? "w-20" : "w-64"
        } bg-white border-r h-screen hidden lg:flex flex-col transition-[width] duration-300 ease-in-out`}
      >
        <SidebarContent isMobile={false} />
      </aside>
    </>
  );
}
