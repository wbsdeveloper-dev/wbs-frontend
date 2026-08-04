"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import {
  CssBaseline,
  ThemeProvider as MuiThemeProvider,
  createTheme,
} from "@mui/material";
import type {} from "@mui/x-data-grid/themeAugmentation";

export const THEME_STORAGE_KEY = "wbs-color-mode";

export type ColorMode = "light" | "dark";

type ThemeContextValue = {
  colorMode: ColorMode;
  isDark: boolean;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isColorMode(value: string | null): value is ColorMode {
  return value === "light" || value === "dark";
}

const themeListeners = new Set<() => void>();

function applyColorMode(mode: ColorMode) {
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  root.dataset.colorMode = mode;
  root.style.colorScheme = mode;
}

function getColorModeSnapshot(): ColorMode {
  return document.documentElement.dataset.colorMode === "dark"
    ? "dark"
    : "light";
}

function getServerColorModeSnapshot(): ColorMode {
  return "light";
}

function subscribeToColorMode(listener: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return;

    const mode: ColorMode = isColorMode(event.newValue)
      ? event.newValue
      : "light";
    applyColorMode(mode);
    listener();
  };

  themeListeners.add(listener);
  window.addEventListener("storage", handleStorage);

  return () => {
    themeListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function useAppTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useAppTheme must be used within ThemeProvider");
  }

  return context;
}

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const colorMode = useSyncExternalStore(
    subscribeToColorMode,
    getColorModeSnapshot,
    getServerColorModeSnapshot,
  );

  useEffect(() => {
    const storedMode = window.localStorage.getItem(THEME_STORAGE_KEY);
    const persistedMode: ColorMode = isColorMode(storedMode)
      ? storedMode
      : "light";

    // Next.js can reconcile server-rendered <html> attributes during hydration.
    // Reapply the persisted mode after each route transition so storage remains
    // authoritative even if the pre-hydration attributes were replaced.
    applyColorMode(persistedMode);
    if (persistedMode !== colorMode) {
      themeListeners.forEach((listener) => listener());
    }

    if (pathname && (pathname.includes("/bbm") || pathname.includes("-bbm"))) {
      document.body.setAttribute("data-theme", "bbm");
    } else {
      document.body.removeAttribute("data-theme");
    }
  }, [colorMode, pathname]);

  const setColorMode = useCallback((mode: ColorMode) => {
    applyColorMode(mode);
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    themeListeners.forEach((listener) => listener());
  }, []);

  const toggleColorMode = useCallback(() => {
    setColorMode(colorMode === "dark" ? "light" : "dark");
  }, [colorMode, setColorMode]);

  const isBbmRoute = pathname.includes("/bbm") || pathname.includes("-bbm");

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: colorMode,
          primary: {
            main: isBbmRoute
              ? colorMode === "dark"
                ? "#fb923c"
                : "#ea580c"
              : colorMode === "dark"
                ? "#22b8cf"
                : "#115d72",
          },
          secondary: {
            main: isBbmRoute
              ? colorMode === "dark"
                ? "#fdba74"
                : "#fb923c"
              : colorMode === "dark"
                ? "#67e8f9"
                : "#14a2bb",
          },
          background: {
            default: colorMode === "dark" ? "#080d17" : "#f8fafc",
            paper: colorMode === "dark" ? "#111827" : "#ffffff",
          },
          text: {
            primary: colorMode === "dark" ? "#f3f4f6" : "#111827",
            secondary: colorMode === "dark" ? "#9ca3af" : "#4b5563",
          },
          divider: colorMode === "dark" ? "#273449" : "#e5e7eb",
        },
        typography: {
          fontFamily: "var(--font-reddit-sans), system-ui, sans-serif",
        },
        shape: {
          borderRadius: 8,
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                transition: "background-color 180ms ease, color 180ms ease",
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
              },
            },
          },
          MuiInputBase: {
            styleOverrides: {
              root: {
                color: colorMode === "dark" ? "#f3f4f6" : "#111827",
              },
            },
          },
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                backgroundColor: colorMode === "dark" ? "#111827" : "#ffffff",
              },
            },
          },
          MuiDataGrid: {
            styleOverrides: {
              root: {
                borderColor: colorMode === "dark" ? "#273449" : "#e5e7eb",
                backgroundColor: colorMode === "dark" ? "#111827" : "#ffffff",
              },
              columnHeaders: {
                backgroundColor: colorMode === "dark" ? "#182235" : "#f9fafb",
              },
              row: {
                "&:hover": {
                  backgroundColor: colorMode === "dark" ? "#172033" : "#f9fafb",
                },
              },
            },
          },
          MuiTooltip: {
            styleOverrides: {
              tooltip: {
                backgroundColor: colorMode === "dark" ? "#e5e7eb" : "#111827",
                color: colorMode === "dark" ? "#111827" : "#ffffff",
              },
            },
          },
        },
      }),
    [colorMode, isBbmRoute],
  );

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      colorMode,
      isDark: colorMode === "dark",
      setColorMode,
      toggleColorMode,
    }),
    [colorMode, setColorMode, toggleColorMode],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline enableColorScheme />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
