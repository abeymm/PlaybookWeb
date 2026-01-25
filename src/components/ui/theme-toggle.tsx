"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon, MonitorIcon } from "lucide-react";

type Theme = "system" | "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored) {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const isDark = theme === "dark" || (theme === "system" && mq.matches);
      document.documentElement.classList.toggle("dark", isDark);
    };

    applyTheme();

    if (theme === "system") {
      mq.addEventListener("change", applyTheme);
      return () => mq.removeEventListener("change", applyTheme);
    }
  }, [theme]);

  const cycle = () => {
    const next: Theme = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    setTheme(next);
    if (next === "system") {
      localStorage.removeItem("theme");
    } else {
      localStorage.setItem("theme", next);
    }
  };

  const icon = {
    system: <MonitorIcon className="h-5 w-5" />,
    light: <SunIcon className="h-5 w-5" />,
    dark: <MoonIcon className="h-5 w-5" />,
  };

  return (
    <Button variant="ghost" size="icon" onClick={cycle} aria-label={`Theme: ${theme}`} title={`Theme: ${theme}`}>
      {icon[theme]}
    </Button>
  );
}
