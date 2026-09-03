import { useCallback, useEffect, useRef, useState } from "react";
import {
  Battery,
  Cpu,
  Gauge,
  HardDrive,
  MemoryStick,
  Settings,
  Sparkles,
  Thermometer,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { CheckRow, GlassCard, IconButton, PillButton, ProgressBar, ProgressRing, PrimaryButton, Segmented, Wordmark } from "@/components/ds";
import { LiveGraph, type GraphRange } from "@/components/live-graph";
import { SheetFrame, useT } from "@/components/shell";
import { PullScroll } from "@/components/motion";
import { readBattery, readDevice, readStorage, systemScore } from "@/lib/device";
import { runNetworkTest } from "@/lib/network";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";
import { useCount } from "@/lib/motion";
import type { MsgKey } from "@/lib/i18n";

function qualityKey(q: string): MsgKey {
  if (q === "excellent") return "excellent";
  if (q === "good") return "good";
  if (q === "fair") return "fair";
  if (q === "poor") return "poor";
  return "offline";
}

function cpuLoad(cores: number, rtt: number | null, online: boolean) {
  const base = Math.max(8, 42 - cores * 3);
  const net = !online ? 10 : rtt && rtt > 120 ? 8 : 0;
  return Math.round(Math.min(92, Math.max(0, base + net)));
}
function ramLoad(memoryGB: number | null) {
  if (memoryGB == null) return 44;
  if (memoryGB >= 8) return 32;
  if (memoryGB >= 4) return 52;
  return 74;
}

function ActionOrb({
  icon: Icon,
  label,
  hint,
  color,
  value,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  hint: string;
  color: string;
  value: number;
  onClick: () => void;
}) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const live = useCount(value, 800);
  const dash = (Math.max(8, live) / 100) * c;
  const haptics = useAppStore((s) => s.haptics);
  const lock = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  const fire = () => {
    if (lock.current) return;
    lock.current = true;
    haptic(haptics, "medium");
    onClick();
    window.setTimeout(() => {
      lock.current = false;
    }, 280);
  };
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        start.current = { x: e.clientX, y: e.clientY };
      }}
      onClick={fire}
      className="flex min-h-[96px] w-full flex-col items-center gap-1.5 rounded-2xl py-1 transition-transform duration-200 active:scale-[0.94]"
    >
      <span className="relative grid size-[74px] place-items-center">
        <svg width="74" height="74" className="absolute inset-0 -rotate-90">
          <circle cx="37" cy="37" r={r} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="3.2" />
          <circle
            cx="37"
            cy="37"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            className="transition-[stroke-dasharray] duration-500"
          />
        </svg>
        <Icon className="size-5" style={{ color }} />
      </span>
      <span className="text-[13px] font-semibold">{label}</span>
      <span className="text-[11px] text-muted">{hint}</span>
    </button>
  );
}

export function HomeScreen() {
  const t = useT();
  const push = useAppStore((s) => s.push);
  const setTab = useAppStore((s) => s.setTab);
  const lastScore = useAppStore((s) => s.lastScore);
  const lastNetwork = useAppStore((s) => s.lastNetwork);
  const lastBattery = useAppStore((s) => s.lastBattery);
  const lastDevice = useAppStore((s) => s.lastDevice);
  const autoRefresh = useAppStore((s) => s.autoRefresh);
  const refreshSeconds = useAppStore((s) => s.refreshSeconds);
  const toast = useAppStore((s) => s.toast);
  const compact = useAppStore((s) => s.compact);
  const haptics = useAppStore((s) => s.haptics);
  const selected = useAppStore((s) => s.tune.selectedProfile);
  const session = useAppStore((s) => s.session);
  const apps = useAppStore((s) => s.appTargets);
  const selectedAppId = useAppStore((s) => s.selectedAppId);
  const selectedGame = apps.find((a) => a.id === selectedAppId);
  const [online, setOnline] = useState(true);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [boost, setBoost] = useState(false);
  const [boostStep, setBoostStep] = useState(0);
  const [pick, setPick] = useState(false);
  const [range, setRange] = useState<GraphRange>("30s");

  const refreshMetrics = useCallback(
    async (silent = false) => {
      const device = readDevice();
      const [battery, storage] = await Promise.all([readBattery(), readStorage()]);
      useAppStore.getState().setLastDevice(device);
      useAppStore.getState().setLastBattery(battery);
      useAppStore.getState().setLastStorage(storage);
      const ratio = storage.usage != null && storage.quota ? storage.usage / storage.quota : null;
      const score = systemScore({
   
... 