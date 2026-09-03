import { useMemo, useState } from "react";
import {
  ChevronRight,
  FileText,
  Home,
  Info,
  Languages,
  LifeBuoy,
  Palette,
  Search,
  Shield,
} from "lucide-react";
import {
  EmptyState,
  GlassCard,
  GlassSlider,
  GlassToggle,
  NavRow,
  PrimaryButton,
  SearchField,
  SecondaryButton,
  Segmented,
  SettingsRow,
  Wordmark,
} from "@/components/ds";
import { Screen, useT } from "@/components/shell";
import { useAppStore } from "@/lib/store";
import type { Locale, ScreenId, ThemeMode } from "@/lib/types";
import { messages, type MsgKey } from "@/lib/i18n";

export function SettingsScreen() {
  const t = useT();
  const push = useAppStore((s) => s.push);
  const s = useAppStore();
  return (
    <Screen title={t("settingsTitle")} subtitle={t("version")} back>
      <p className="mb-3 px-1 text-[12px] font-medium uppercase tracking-[0.18em] text-muted">{t("brand")}</p>

      <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{t("sectionAppearance")}</p>
      <GlassCard className="mb-4 p-0">
        <NavRow icon={Palette} title={t("appearanceTitle")} hint={t("theme")} onClick={() => push("appearance")} />
        <p className="mt-4 text-center text-[12px] text-muted">{t("madeFor")}</p>
      </GlassCard>

      <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{t("sectionNotifications")}</p>
      <GlassCard className="mb-4 p-0">
        <SettingsRow
          title={t("enableNotifications")}
          trailing={<GlassToggle checked={s.notificationsEnabled} onChange={s.setNotificationsEnabled} label={t("enableNotifications")} />}
        />
        <SettingsRow
          title={t("notifSound")}
          trailing={<GlassToggle checked={s.notificationSound} onChange={s.setNotificationSound} label={t("notifSound")} />}
        />
      </GlassCard>

      <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{t("sectionHaptics")}</p>
      <GlassCard className="mb-4 p-0">
        <SettingsRow
          title={t("enableHaptics")}
          hint={t("hapticsHint")}
          trailing={<GlassToggle checked={s.haptics} onChange={s.setHaptics} label={t("enableHaptics")} />}
        />
      </GlassCard>

      <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{t("sectionBehavior")}</p>
      <GlassCard className="mb-4 p-0">
        <SettingsRow
          title={t("autoRefresh")}
          hint={t("autoHint")}
          trailing={<GlassToggle checked={s.autoRefresh} onChange={s.setAutoRefresh} label={t("autoRefresh")} />}
        />
        <div className="px-3.5 pb-3">
          <GlassSlider
            value={s.refreshSeconds}
            min={10}
            max={120}
            step={5}
            onChange={s.setRefreshSeconds}
            label={t("autoRefreshEvery")}
            suffix="s"
            minLabel="10s"
            maxLabel="120s"
          />
        </div>
        <SettingsRow
          title={t("confirmActions")}
          hint={t("confirmHint")}
          trailing={<GlassToggle checked={s.confirmActions} onChange={s.setConfirmActions} label={t("confirmActions")} />}
        />
        <SettingsRow
          title={t("autoEnter")}
          hint={t("autoEnterHint")}
          trailing={<GlassToggle checked={s.autoEnter} onChange={s.setAutoEnter} label={t("autoEnter")} />}
        />
        <SettingsRow
          title={t("requireEnter")}
          hint={t("requireEnterHint")}
          trailing={<GlassToggle checked={s.requireEnter} onChange={s.setRequireEnter} label={t("requireEnter")} />}
        />
      </GlassCard>

      <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{t("sectionInterface")}</p>
      <GlassCard className="mb-4 p-0">
        <SettingsRow
          title={t("compactMode")}
          hint={t("compactHint")}
          trailing={<GlassToggle checked={s.compact} onChange={s.setCompact} label={t("compactMode")} />}
        />
        <SettingsRow
          title={t("reduceMotion")}
          hint={t("reduceMotionHint")}
          trailing={<GlassToggle checked={s.reduceMotion} onChange={s.setReduceMotion} label={t("reduceMotion")} />}
        />
        <NavRow icon={Languages} title={t("prefsTitle")} hint={t("locale")} onClick={() => push("preferences")} />
      </GlassCard>

      <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{t("sectionAbout")}</p>
      <GlassCard className="mb-4 p-0">
        <NavRow icon={Home} title={t("installHome")} hint={t("installHomeHi
... 