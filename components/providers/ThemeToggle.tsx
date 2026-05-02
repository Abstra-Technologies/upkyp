"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

export default function ThemeToggle({ variant = "default" }: { variant?: "default" | "light" | "dark" }) {
  const { theme, toggleTheme } = useTheme();

  const isLight = variant === "light";
  const isDark = variant === "dark";

  const iconColor = isLight
    ? "text-gray-700"
    : isDark
      ? "text-gray-300"
      : "text-white";

  const hoverBg = isLight
    ? "hover:bg-gray-100"
    : "hover:bg-white/10";

  return (
    <button
      onClick={toggleTheme}
      className={`relative p-2 rounded-lg transition-colors ${hoverBg}`}
      aria-label="Toggle theme"
    >
      <Sun className={`w-5 h-5 ${iconColor} transition-all duration-300 rotate-0 scale-100 dark:-rotate-90 dark:scale-0`} />
      <Moon className={`w-5 h-5 ${iconColor} transition-all duration-300 rotate-90 scale-0 dark:rotate-0 dark:scale-100 absolute inset-0 m-auto`} />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
