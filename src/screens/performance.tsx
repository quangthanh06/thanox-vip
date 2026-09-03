import { useState } from "react";
import { GlassCard, Segmented } from "@/components/ds";
import { LiveGraph, type GraphRange } from "@/components/live-graph";
import { Screen, useT } from "@/components/shell";
import { useAppStore } from "@/lib/store";

export function PerformanceScreen() {
  const t = useT();
  const lastDevice = useAppStore((s) => s.lastDevice);
  const lastBattery = useAppStore((s) => s.lastBattery);
  const lastScore = useAppStore((s) => s.lastScore);
  const lastNetwork = useAppStore((s) => s.lastNetwork);
  const [range, setRange] = useState<GraphRange>("30s");
  const cpu = Math.max(8, 42 - (lastDevice?.cores ?? 4) * 3);
  const ram = lastDevice?.memoryGB == null ? 44 : lastDevice.memoryGB >= 8 ? 32 : lastDevice.memoryGB >= 4 ? 52 : 74;
  const batt = lastBattery?.supported ? lastBattery.level : null;
  const samples = [cpu, ram, batt ?? 0].filter((n) => n > 0);
  const avg = samples.length ? Math.round(samples.reduce((a, b) => a + b, 0) / samples.length) : 0;

  return (
    <Screen title={t("perfDetail")} subtitle={t("perfSubtitle")} back>
      <GlassCard className="mb-3 p-3.5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[12px] font-semibold tracking-[0.14em] text-accent-bright">LIVE</span>
          <span className="text-[12px] text-muted">{t("liveWatch")}</span>
        </div>
        <div className="mb-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[10px] uppercase text-muted">CPU</div>
            <div className="tabular text-lg font-semibold">{cpu}%</div>
            <div className="text-[10px] text-muted">{t("estimatedHint")}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted">{t("ram")}</div>
            <div className="tabular text-lg font-semibold">{ram}%</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted">{t("battery")}</div>
            <div className="tabular text-lg font-semibold">{batt == null ? t("notAvailable") : `${batt}%`}</div>
          </div>
        </div>
        <p className="mb-2 text-[13px] font-semibold">{t("timeRange")}</p>
        <div className="mb-2 grid grid-cols-3 gap-2 text-center text-[12px]">
          <div>Min {Math.min(cpu, ram)}</div>
          <div>Max {Math.max(cpu, ram, lastScore ?? 0)}</div>
          <div>Avg {avg}</div>
        </div>
        <Segmented
          value={range}
          onChange={(v) => setRange(v as GraphRange)}
          options={[
            { id: "30s", label: t("range30s") },
            { id: "5m", label: t("range5m") },
            { id: "30m", label: t("range30m") },
          ]}
        />
        <div className="mt-3">
          <LiveGraph cpu={cpu} ram={ram} battery={batt} range={range} tall />
        </div>
        <p className="mt-2 text-[11px] text-muted">{t("liveWatchData")}</p>
        <p className="mt-1 text-[11px] text-muted">{t("thermalWeb")}</p>
        {lastNetwork ? (
          <p className="mt-1 text-[12px] text-fg-2">
            {t("network")}: {lastNetwork.avgMs != null ? `${Math.round(lastNetwork.avgMs)} ms` : t("notAvailable")}
          </p>
        ) : null}
      </GlassCard>
    </Screen>
  );
}
