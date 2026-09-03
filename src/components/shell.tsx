import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Bell,
  Check,
  ChevronLeft,
  Cpu,
  House,
  Info,
  LayoutGrid,
  Search,
  Settings,
  TriangleAlert,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { LogoMark, Wordmark, IconButton, PrimaryButton, SecondaryButton, DestructiveButton } from "@/components/ds";
import { DraggableSheet, PullScroll } from "@/components/motion";
import { useAppStore } from "@/lib/store";
import { translate, type MsgKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { TabId, ToastTone } from "@/lib/types";
import { haptic } from "@/lib/haptics";

function useT() {
  const locale = useAppStore((s) => s.locale);
  return (key: MsgKey, vars?: Record<string, string | number>) => translate(locale, key, vars);
}

export { useT };

function resolvedTheme(theme: "dark" | "light" | "system") {
  if (theme === "system") {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return theme;
}

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((s) => s.theme);
  const compact = useAppStore((s) => s.compact);
  const reduceMotion = useAppStore((s) => s.reduceMotion);
  const mode = resolvedTheme(theme);
  return (
    <div className="thanox-studio">
      <div
        className="thanox-phone"
        data-theme={mode}
        data-compact={compact ? "true" : "false"}
        data-reduce={reduceMotion ? "true" : "false"}
      >
        <div className="thanox-ambient" aria-hidden="true" />
        <div className="thanox-island" />
        <div className="thanox-screen">{children}</div>
        <div className="thanox-homebar" aria-hidden="true" />
      </div>
    </div>
  );
}

export function StatusBar() {
  return <div className="pointer-events-none relative z-20 h-[44px] shrink-0" aria-hidden="true" />;
}

const TABS: { id: TabId; icon: typeof House; label: MsgKey }[] = [
  { id: "home", icon: House, label: "tabHome" },
  { id: "optimize", icon: Zap, label: "tabOptimize" },
  { id: "appopt", icon: Cpu, label: "tabAppOpt" },
  { id: "tools", icon: LayoutGrid, label: "tabTools" },
  { id: "profile", icon: UserRound, label: "tabProfile" },
];

export function TabBar() {
  const t = useT();
  const tab = useAppStore((s) => s.tab);
  const setTab = useAppStore((s) => s.setTab);
  const haptics = useAppStore((s) => s.haptics);
  const unread = useAppStore((s) => s.notifications.filter((n) => !n.read).length);
  const idx = TABS.findIndex((item) => item.id === tab);
  return (
    <nav cla
... 