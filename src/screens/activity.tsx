import { useMemo, useState } from "react";
import { Activity, Trash2 } from "lucide-react";
import { EmptyState, GlassCard, IconButton, SearchField, Segmented, StatusBadge } from "@/components/ds";
import { Screen, useT } from "@/components/shell";
import { useAppStore } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";
import type { MsgKey } from "@/lib/i18n";
import type { StatusTone } from "@/lib/types";

export function ActivityScreen() {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const items = useAppStore((s) => s.activities);
  const confirm = useAppStore((s) => s.confirmActions);
  const openSheet = useAppStore((s) => s.openSheet);
  const clear = useAppStore((s) => s.clearActivity);
  const remove = useAppStore((s) => s.removeActivity);
  const toast = useAppStore((s) => s.toast);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | StatusTone>("all");

  const filtered = useMemo(() => {
    return items.filter((a) => {
      if (filter !== "all" && a.status !== filter) return false;
      if (!q.trim()) return true;
      const blob = `${t(a.titleKey as MsgKey)} ${a.detail} ${a.kind}`.toLowerCase();
      return blob.includes(q.trim().toLowerCase());
    });
  }, [items, filter, q, t]);

  const onClear = () => {
    if (confirm) {
      openSheet({
        kind: "confirm",
        title: t("clearAll"),
        body: t("confirmClearActivity"),
        confirmLabel: t("clearAll"),
        destructive: true,
        action: "clear-activity",
      });
    } else {
      clear();
      toast("success", t("toastCleared"));
    }
  };

  return (
    <Screen
      title={t("activity")}
      subtitle={t("version")}
      right={
        items.length ? (
          <IconButton label={t("clearAll")} onClick={onClear}>
            <Trash2 className="size-4" />
          </IconButton>
        ) : undefined
      }
    >
      <div className="mb-3">
        <SearchField value={q} onChange={setQ} placeholder={t("searchPlaceholder")} />
      </div>
      <div className="mb-3">
        <Segmented
          value={filter === "all" ? "all" : filter === "ok" ? "ok" : filter === "warn" ? "warn" : "error"}
          onChange={(v) => setFilter(v as typeof filter)}
          options={[
            { id: "all", label: t("filterAll") },
            { id: "ok", label: t("filterOk") },
            { id: "warn", label: t("filterWarn") },
          ]}
        />
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          icon={Activity}
          title={items.length === 0 ? t("noActivity") : t("emptyFilter")}
          body={items.length === 0 ? t("noActivityBody") : t("searchEmpty")}
        />
      ) : (
        <GlassCard className="p-0">
          {filtered.map((a, i) => (
            <div
              key={a.id}
              className="flex items-start gap-3 px-3.5 py-3"
              style={{ boxShadow: i ? "inset 0 1px 0 var(--color-separator)" : undefined }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[14px] font-semibold">{t(a.titleKey as MsgKey)}</span>
                  <StatusBadge tone={a.status}>{a.status === "ok" ? t("complete") : a.status === "warn" ? t("diagnosticWarn") : t("toastError")}</StatusBadge>
                </div>
                <p className="mt-0.5 truncate text-[12px] text-fg-2">{a.detail}</p>
                <p className="mt-0.5 text-[11px] text-muted">{formatDateTime(a.at, locale)}</p>
              </div>
              <button type="button" className="text-muted" aria-label={t("delete")} onClick={() => remove(a.id)}>
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </GlassCard>
      )}
    </Screen>
  );
}
