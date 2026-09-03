import { useMemo, useState } from "react";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { EmptyState, GlassCard, IconButton, SearchField, StatusBadge } from "@/components/ds";
import { Screen, useT } from "@/components/shell";
import { useAppStore } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";
import type { MsgKey } from "@/lib/i18n";

export function NotificationsScreen() {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const items = useAppStore((s) => s.notifications);
  const markRead = useAppStore((s) => s.markRead);
  const markAll = useAppStore((s) => s.markAllRead);
  const remove = useAppStore((s) => s.removeNotification);
  const confirm = useAppStore((s) => s.confirmActions);
  const openSheet = useAppStore((s) => s.openSheet);
  const clear = useAppStore((s) => s.clearNotifications);
  const toast = useAppStore((s) => s.toast);
  const [q, setQ] = useState("");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const unread = items.filter((n) => !n.read).length;

  const filtered = useMemo(() => {
    return items.filter((n) => {
      if (onlyUnread && n.read) return false;
      if (!q.trim()) return true;
      const title = t(n.titleKey as MsgKey);
      const body = n.body || t("notifWelcomeBody");
      return `${title} ${body} ${n.group}`.toLowerCase().includes(q.trim().toLowerCase());
    });
  }, [items, onlyUnread, q, t]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof filtered> = { system: [], analysis: [], network: [] };
      for (const n of filtered) (map[n.group ?? "system"] ?? map.system).push(n);
    return map;
  }, [filtered]);

  const onClear = () => {
    if (confirm) {
      openSheet({
        kind: "confirm",
        title: t("clearAll"),
        body: t("confirmClearNotifs"),
        confirmLabel: t("clearAll"),
        destructive: true,
        action: "clear-notifs",
      });
    } else {
      clear();
      toast("success", t("toastCleared"));
    }
  };

  return (
    <Screen
      title={t("notifications")}
      subtitle={unread ? t("unreadCount", { n: unread }) : t("version")}
      right={
        <div className="flex gap-1.5">
          <IconButton label={t("markAllRead")} onClick={markAll}>
            <CheckCheck className="size-4" />
          </IconButton>
          <IconButton label={t("clearAll")} onClick={onClear}>
            <Trash2 className="size-4" />
          </IconButton>
        </div>
      }
    >
      <div className="mb-3">
        <SearchField value={q} onChange={setQ} placeholder={t("searchPlaceholder")} />
      </div>
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setOnlyUnread(false)}
          className={`h-8 rounded-full px-3 text-[12px] font-semibold ${!onlyUnread ? "bg-accent text-fg" : "bg-elevated text-fg-2"}`}
        >
          {t("all")}
        </button>
        <button
          type="button"
          onClick={() => setOnlyUnread(true)}
          className={`h-8 rounded-full px-3 text-[12px] font-semibold ${onlyUnread ? "bg-accent text-fg" : "bg-elevated text-fg-2"}`}
        >
          {t("unread")}
        </button>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={Bell} title={t("noNotifications")} body={t("noNotificationsBody")} />
      ) : (
        (["system", "analysis", "network"] as const).map((g) =>
          grouped[g].length ? (
            <div key={g} className="mb-4">
              <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                {g === "system" ? t("groupSystem") : g === "analysis" ? t("groupAnalysis") : t("groupNetwork")}
              </p>
              <GlassCard className="p-0">
                {grouped[g].map((n, i) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => markRead(n.id)}
                    className="flex w-full items-start gap-3 px-3.5 py-3 text-left"
                    style={{ boxShadow: i ? "inset 0 1p
... 