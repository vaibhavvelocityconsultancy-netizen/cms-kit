"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  collapsed?: boolean;
}

export function ThemeToggle({ collapsed = false }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`flex h-9 items-center gap-3 border border-sidebar-border bg-sidebar-accent px-3 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent/80 ${
        collapsed ? "w-9 justify-center px-0" : "w-full"
      }`}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      {!collapsed && <span>{isDark ? "Light theme" : "Dark theme"}</span>}
    </button>
  );
}
