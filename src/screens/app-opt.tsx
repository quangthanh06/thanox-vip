import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Plus, Settings } from "lucide-react";
import {
  GlassCard,
  GlassSlider,
  IconButton,
  PrimaryButton,
  SecondaryButton,
  Segmented,
} from "@/components/ds";
import { Screen, SheetFrame, useT } from "@/components/shell";
import { DEFAULT_GAME_TUNE, GAME_META, openGame, seedSens, type GameTune } from "@/lib/games";
import { useAppStore } from "@/lib/store";

export function AppOptScreen() {
  const t = useT();
  const push = useAppStore((s) => s.push);
  const apps = useAppStore((s) => s.appTargets);
  const selectedId = useAppStore((s) => s.selectedAppId);
  const setSelected = useAppStore((s) => s.setSelectedAppId);
  const addApp = useAppStore((s) => s.addAppTarget);
  const removeApp = useAppStore((s) => s.removeAppTarget);
  const tunes = useAppStore((s) => s.gameTunes);
  const patchTune = useAppStore((s) => s.patchGameTune);
  const toast = useAppStore((s) => s.toast);
  const device = useAppStore((s) => s.lastDevice);
  const [openId, setOpenId] = useState<string | null>(null);
  const [custom, setCustom] = useState(false);
  const [sensOpen, setSensOpen] = useState(false);
  const [name, setName] = useState("");

  const current = apps.find((a) => a.id === (openId ?? selectedId)) ?? apps[0];
  const tune: GameTune = { ...DEFAULT_GAME_TUNE, ...tunes[current?.id ?? "ff"] };
  const meta = current ? GAME_META[current.kind] : undefined;

  const sheets =
    current && (custom || sensOpen) ? (
      <>
        {custom ? (
          <CustomizeSheet
            name={current.name}
            kind={current.kind}
            tune={tune}
            onPatch={(p) => patchTune(current.id, p)}
            onClose={() => setCustom(false)}
            onApply={() => {
              setSelected(current.id);
              toast("success", t("toastProfileUpdated"));
              setCustom(false);
            }}
          />
        ) : null}
        {sensOpen ? (
          <SensSheet
            seed={`${device?.userAgent ?? ""}:${device?.cores ?? 0}:${device?.screen ?? ""}`}
            onClose={() => setSensOpen(false)}
          />
        ) : null}
      </>
    ) : null;

  if (openId && current) {
    return (
      <>
        <GameDetail
          name={current.name}
          kind={current.kind}
          icon={current.icon}
          tune={tune}
          hideCtas={custom || sensOpen}
          onBack={() => {
            setOpenId(null);
            setCustom(false);
            setSensOpen(false);
          }}
          onCustomize={() => setCustom(true)}
          onSens={() => setSensOpen(true)}
          onSelect={() => {
            setSelected(current.id);
            if (current.kind === "custom") {
              toast("info", t("selectGameWeb"));
              return;
            }
            openGame(current.kind);
            toast("success", t("openingGame", { name: current.name }));
          }}
          settings={() => push("settings")}
        />
        {sheets}
      </>
    );
  }

  return (
    <Screen
      title={t("gamesTitle")}
      right={
        <IconButton label={t("settingsTitle")} onClick={() => push("settings")}>
          <Settings className="size-4" />
        </IconButton>
      }
    >
      <div className="space-y-2.5">
        {apps.map((a) => {
          const m = GAME_META[a.kind];
          return (
            <GlassCard key={a.id} className="flex items-center gap-3 p-3">
              <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setOpenId(a.id)}>
                <GameMark kind={a.kind} mark={m?.mark ?? a.name.slice(0, 2).toUpperCase()} icon={a.icon} />
                <div className="min-w-0 flex-1">
                  <div className="text-[16px] font-semibold">{a.name}</div>
                  <div className="truncate text-[12px] text-muted">
                    {m ? `${m.subtitle} · ${m.version}` : t("custom")}
                  </div>
                  <div className="text-[11px] text-muted">{m?.size ?? "—"}</div>
                </div>
              </button>
              <button
                type="button"
                className="shrink-0 rounded-full bg-[linear-gradient(180deg,#ff5a4f,#d70018)] px-3.5 py-2 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgb(215_0_24_/_0.35)]"
                onClick={() => setOpenId(a.id)}
              >
                {t("optimizeNow")}
              </button>
            </GlassCard>
          );
        })}
      </div>
      <div className="mt-4 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("addAppPh")}
          className="thanox-key-input !h-11 flex-1 !text-[14px] !tracking-normal"
        />
        <IconButton
          label={t("addApp")}
          onClick={() => {
            addApp(name);
            setName("");
          }}
        >
          <Plus className="size-4" />
       
... 