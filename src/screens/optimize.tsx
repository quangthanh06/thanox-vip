import { useState } from "react";
import { Settings, Sparkles } from "lucide-react";
import {
  GlassCard,
  GlassSlider,
  GlassToggle,
  IconButton,
  PillButton,
  PrimaryButton,
  SecondaryButton,
  Segmented,
  SettingsRow,
} from "@/components/ds";
import { Screen, SheetFrame, useT } from "@/components/shell";
import { readBattery, readDevice, readStorage } from "@/lib/device";
import { runNetworkTest } from "@/lib/network";
import { useAppStore } from "@/lib/store";
import { formatBytes } from "@/lib/utils";
import type { MsgKey } from "@/lib/i18n";

const FUNS: { id: string; label: MsgKey }[] = [
  { id: "visual", label: "fnVisual" },
  { id: "anim", label: "fnAnim" },
  { id: "input", label: "fnInput" },
  { id: "refresh", label: "fnRefresh" },
  { id: "net", label: "fnNet" },
  { id: "bg", label: "fnBg" },
  { id: "thermal", label: "fnThermal" },
  { id: "battery", label: "fnBattery" },
  { id: "frame", label: "fnFrame" },
  { id: "touchlat", label: "fnTouchLat" },
  { id: "conn", label: "fnConn" },
  { id: "log", label: "fnLog" },
  { id: "mem", label: "fnMem" },
  { id: "session", label: "fnSession" },
];

const AI_SET = ["input", "frame", "net", "thermal"];

export function OptimizeScreen() {
  const t = useT();
  const push = useAppStore((s) => s.push);
  const mode = useAppStore((s) => s.perfMode);
  const setMode = useAppStore((s) => s.setPerfMode);
  const tune = useAppStore((s) => s.tune);
  const patch = useAppStore((s) => s.patchTune);
  const toggleFn = useAppStore((s) => s.toggleFn);
  const toast = useAppStore((s) => s.toast);
  const last = useAppStore((s) => s.lastStorage);
  const device = useAppStore((s) => s.lastDevice);
  const lastNet = useAppStore((s) => s.lastNetwork);
  const reduceMotion = useAppStore((s) => s.reduceMotion);
  const setReduceMotion = useAppStore((s) => s.setReduceMotion);
  const hapticsOn = useAppStore((s) => s.haptics);
  const setHaptics = useAppStore((s) => s.setHaptics);
  const autoRefresh = useAppStore((s) => s.autoRefresh);
  const setAutoRefresh = useAppStore((s) => s.setAutoRefresh);
  const refreshSeconds = useAppStore((s) => s.refreshSeconds);
  const setRefreshSeconds = useAppStore((s) => s.setRefreshSeconds);
  const [sheet, setSheet] = useState<null | "fn" | "tune" | "touch" | "compat">(null);
  const [run, setRun] = useState(false);
  const [applied, setApplied] = useState(false);

  const ramLabel =
    last?.usage != null && last.quota
      ? `${formatBytes(last.quota - last.usage)} / ${formatBytes(last.quota)}`
      : device?.memoryGB
        ? `${device.memoryGB} GB · ${t("compatPart")}`
        : t("notAvailable");

  const refreshRam = async () => {
    const storage = await readStorage();
    useAppStore.getState().setLastStorage(storage);
    toast("success", t("toastRefresh"));
  };

  const applyAi = () => {
    patch({ functions: [...AI_SET] });
    toast("success", t("toastAiApply"));
  };

  const applyAll = async () => {
    if (run) return;
    setRun(true);
    const snap = readDevice();
    const [battery, storage] = await Promise.all([readBattery(), readStorage()]);
    useAppStore.getState().setLastDevice(snap);
    useAppStore.getState().setLastBattery(battery);
    useAppStore.getState().setLastStorage(storage);
    if (mode === "quiet") {
      setReduceMotion(true);
      setAutoRefresh(true);
      setRefreshSeconds(60);
      patch({ batteryOpt: true, ramOpt: true, cpuOpt: true, gpuBoost: false, gamingMode: false });
    } else if (mode === "performance") {
      setReduceMotion(true);
      setAutoRefresh(true);
      setRefreshSeconds(15);
      patch({ cpuOpt: true, gpuBoost: true, ramOpt: true, batteryOpt: false, gamingMode: true });
    } else {
      setReduceMotion(true);
      setAutoRefresh(true);
      setRefreshSeconds(30);
      patch({ cpuOpt: true, ramOpt: true, gpuBoost: false, batteryOpt: false });
    }
    await runNetworkTest().catch(() => undefined);
    setApplied(true);
    toast("success", t("optApplied"));
    setRun(false);
  };

  return (
    <Screen
      title={t("optimizeTitle")}
      right={
        <IconButton label={t("settingsTitle")} onClick={() => push("settings")}>
          <Settings className="size-4" />
        <
... 