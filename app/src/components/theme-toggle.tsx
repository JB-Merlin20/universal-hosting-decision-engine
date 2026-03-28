"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center rounded-lg border border-input bg-muted/50 p-0.5">
      <button
        onClick={() => setTheme("light")}
        className={`inline-flex items-center justify-center rounded-md p-1.5 transition-all duration-150 cursor-pointer ${
          theme === "light"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        title="Light mode"
        aria-label="Switch to light mode"
      >
        <Sun className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`inline-flex items-center justify-center rounded-md p-1.5 transition-all duration-150 cursor-pointer ${
          theme === "dark"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        title="Dark mode"
        aria-label="Switch to dark mode"
      >
        <Moon className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`inline-flex items-center justify-center rounded-md p-1.5 transition-all duration-150 cursor-pointer ${
          theme === "system"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        title="System theme"
        aria-label="Use system theme"
      >
        <Monitor className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
