import { useMemo, useState } from "react";
import { Activity, Copy, Cpu, HardDrive, LayoutGrid, Settings, Sparkles, Stethoscope, Wifi, Zap } from "lucide-react";
import {
  CheckRow,
  EmptyState,
  GlassCard,
  GlassSlider,
  NavRow,
  PillButton,
  PrimaryButton,
  ProgressBar,
  ProgressRing,
  SecondaryButton,
  SectionHeader,
  Segmented,
  SettingsRow,
  StatusBadge,
} from "@/components/ds";
import { IconButton } from "@/components/ds";
import { Screen, SheetFrame, useT } from "@/components/shell";
import { readBattery, readDevice, readStorage, systemScore } from "@/lib/device";
import { runNetworkTest } from "@/lib/network";
import { useAppStore } from "@/lib/store";
import { formatBytes, formatDateTime } from "@/lib/utils";
import type { MsgKey } from "@/lib/i18n";
import type { NetworkQuality, StatusTone } from "@/lib/types";

function qualityTone(q: NetworkQuality): StatusTone {
  if (q === "excellent" || q === "good") return "ok";
  if (q === "fair") return "warn";
  return "error";
}

export function ToolsScreen() {
  const t = useT();
  const push = useAppStore((s) => s.push);
  const patch = useAppStore((s) => s.patchTune);
  const toast = useAppStore((s) => s.toast);
  const selected = useAppStore((s) => s.tune.selectedProfile);
  const device = useAppStore((s) => s.lastDevice);
  const battery = useAppStore((s) => s.lastBattery);
  const net = useAppStore((s) => s.lastNetwork);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);

  const profiles = [
    {
      id: "core",
      title: t("wsCore"),
      hint: t("wsCoreHint"),
      meta: device?.cores ? `${device.cores} nhân · ${device.memoryGB ?? "—"} GB` : t("notAvailable"),
      icon: Cpu,
      apply: () => {
        patch({ selectedProfile: "core", cpuOpt: true, ramOpt: true });
        useAppStore.getState().setReduceMotion(true);
      },
      open: () => push("device"),
    },
    {
      id: "net",
      title: t("wsNet"),
      hint: t("wsNetHint"),
      meta: net ? `${net.type}${net.avgMs != null ? ` · ${Math.round(net.avgMs)} ms` : ""}` : t("cellular"),
      icon: Wifi,
      apply: async () => {
        patch({ selectedProfile: "net" });
        await runNetworkTest().catch(() => undefined);
      },
      open: () => push("network"),
    },
    {
      id: "power",
      title: t("wsPower"),
      hint: t("wsPowerHint"),
      meta: battery?.level != null ? `${battery.level}%` : t("notAvailable"),
      icon: Zap,
      apply: () => {
        patch({ selectedProfile: "power", batteryOpt: true });
        useAppStore.getState().setReduceMotion(true);
        useAppStore.getState().setRefreshSeconds(60);
      },
      open: () => push("battery"),
    },
    {
      id: "display",
      title: t("wsDisplay"),
      hint: t("wsDisplayHint"),
      meta: device?.screen ?? t("notAvailable"),
      icon: LayoutGrid,
      apply: () => {
        patch({ selectedProfile: "display", gpuBoost: true });
        useAppStore.getState().setReduceMotion(true);
      },
      open: () => push("diagnostics"),
    },
  ];

  return (
    <Screen
      title={t("toolsTitle")}
      right={
        <IconButton label={t("settingsTitle")} onClick={() => push("settings")}>
          <Settings className="size-4" />
        </IconButton>
      }
    >
      <div className="space-y-2.5">
        {profiles.map((p) => (
          <GlassCard key={p.id} className="flex items-center gap-3 p-3.5">
            <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={p.open}>
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent/18 text-accent-bright">
                <p.icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[16px] font-semibold">{p.title}</div>
                <div className="truncate text-[12px] text-muted">{p.hint}</div>
                <div className="text-[11px] text-muted">{p.meta}</div>
              </div>
            </button>
            <button
              type="button"
              className="shrink-0 rounded-full bg-[linear-gradient(180deg,#ff5a4f,#d70018)] px-3.5 py-2 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgb(215_0_24_/_0.35)] active:scale-[0.96]"
              disabled={busyId === p.id}
              onClick={async () => {
                setBusyId(p.id);
                await p.apply();
                const storage = await readStorage();
                useAppStore.getState().setLastStorage(storage);
                setDoneId(p.id);
                setBusyId(null);
                toast("success", t("toolApplied"));
              }}
            >
              {busyId === p.id ? t("applyingInline") : doneId === p.id ? t("optApplied") : t("optimizeNow")}
            </button>
          </GlassCard>
        ))}
      </div>
      {selected ? <p className="mt-3 text-center text-[12px] text-muted">{t("profileApplied")}</p> : null}
    </Screen>
  );
}

export function WorkspaceScreen() {
  const t = useT();
  const id = useAppStore((s) => s.tune.selectedProfile) ?? "core";
  const tune = useAppStore((s) => s.tune);
  const mode = useAppStore((s) => s.perfMode);
  const patch = useAppStore((s) => s.patchTune);
  const toast = useAppStore((s) => s.toast);
  const [sheet, setSheet] = useState(false);
  const names: Record<string, MsgKey> = { core: "wsCore", net: "wsNet", power: "wsPower", display: "wsDisplay" };
  return (
    <Screen title={t(names[id] ?? "wsCore")} back>
      <GlassCard glow className="mb-4 p-4">
        <div className="text-[22px] font-semibold">{t(names[id] ?? "wsCore")}</div>
        <div className="mt-2 flex gap-2">
          <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-semibold text-accent-bright">
            {tune.refreshTarget} Hz
          </span>
          <span className="rounded-full bg-fg/10 px-2.5 py-1 text-[11px] font-semibold">{t("lowLatency")}</span>
        </div>
      </GlassCard>
      <GlassCard className="mb-4 p-0">
        <button type="button" className="flex w-full items-center justify-between px-3.5 py-3" onClick={() => setSheet(true)}>
          <span className="text-[15px] font-semibold">{t("refreshTarget")}</span>
          <span className="text-[13px] text-fg-2">{tune.refreshTarget} Hz ›</span>
        </button>
        <button type="button" className="flex w-full items-center justify-between px-3.5 py-3" onClick={() => setSheet(true)}>
          <span className="text-[15px] font-semibold">{t("perfMode")}</span>
          <span className="text-[13px] text-fg-2">{t("modePerf")} ›</span>
        </button>
        <button type="button" className="flex w-full items-center justify-between px-3.5 py-3" onClick={() => setSheet(true)}>
          <span className="text-[15px] font-semibold">{t("network")}</span>
          <span className="text-[13px] t
... 

function InfoLine({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 px-3.5 py-2.5">
      <span className="text-[13px] text-fg-2">{label}</span>
      <span className={`max-w-[60%] text-right text-[13px] font-medium ${mono ? "tabular break-all" : ""}`}>{value}</span>
    </div>
  );
}

export function DeviceScreen() {
  const t = useT();
  const d = useAppStore((s) => s.lastDevice);
  const toast = useAppStore((s) => s.toast);
  const snapshot = d ?? (typeof navigator !== "undefined" ? readDevice() : null);
  if (!snapshot) {
    return (
      <Screen title={t("deviceTitle")} back>
        <EmptyState icon={Cpu} title={t("deviceTitle")} body={t("unavailableApi")} />
      </Screen>
    );
  }
  return (
    <Screen title={t("deviceTitle")} back>
      <PrimaryButton
        className="mb-3"
        onClick={() => {
          const snap = readDevice();
          useAppStore.getState().setLastDevice(snap);
          toast("success", t("scanSystem"));
        }}
      >
        {t("scanSystem")}
      </PrimaryButton>
      <GlassCard className="mb-3 p-0">
        <InfoLine label={t("platform")} value={snapshot.platform} />
        <InfoLine label={t("language")} value={snapshot.language} />
        <InfoLine label={t("timezone")} value={snapshot.timezone} />
        <InfoLine label={t("screen")} value={`${snapshot.screen} @${snapshot.pixelRatio}x`} />
        <InfoLine label={t("colorDepth")} value={String(snapshot.colorDepth)} />
        <InfoLine label={t("cores")} value={t("coresVal", { n: snapshot.cores })} />
        <InfoLine label={t("memory")} value={snapshot.memoryGB ? t("memVal", { n: snapshot.memoryGB }) : t("notAvailable")} />
        <InfoLine label={t("touch")} value={String(snapshot.touchPoints)} />
        <InfoLine label={t("vendor")} value={snapshot.vendor} />
        <InfoLine label={t("standalone")} valu
... 