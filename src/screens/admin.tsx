import { useEffect, useRef, useState } from "react";
import { Copy, ImagePlus, Plus, Shield, Trash2 } from "lucide-react";
import { GlassCard, PrimaryButton, SecondaryButton, Segmented, StatusBadge } from "@/components/ds";
import { Screen, SheetFrame, useT } from "@/components/shell";
import { fileToIconDataUrl } from "@/lib/image";
import { GAME_META } from "@/lib/games";
import { useAppStore } from "@/lib/store";
import { thanoxAudit, thanoxCreateKey, thanoxExtendKey, thanoxListKeys, thanoxResetDevices, thanoxRevokeKey, thanoxStats } from "@/lib/thanox-auth";
import type { KeyType } from "@/lib/thanox-auth";

type KeyRow = {
  id: string;
  key_last4: string;
  key_prefix?: string | null;
  type: KeyType;
  status: string;
  created_at: string;
  expires_at: string | null;
  device_limit: number;
  label: string | null;
  last_used_at: string | null;
};

export function AdminScreen() {
  const t = useT();
  const session = useAppStore((s) => s.session);
  const toast = useAppStore((s) => s.toast);
  const apps = useAppStore((s) => s.appTargets);
  const setAppIcon = useAppStore((s) => s.setAppIcon);
  const loginMark = useAppStore((s) => s.loginMark);
  const setLoginMark = useAppStore((s) => s.setLoginMark);
  const token = session?.token ?? "";
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0, revoked: 0, users: 0, vip: 0, admins: 0 });
  const [create, setCreate] = useState(false);
  const [made, setMade] = useState<string | null>(null);
  const [type, setType] = useState<KeyType>("VIP");
  const [days, setDays] = useState(30);
  const [limit, setLimit] = useState(1);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [logs, setLogs] = useState<{ action: string; result: string; at: string }[]>([]);
  const [target, setTarget] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!token) return;
    const [s, k, a] = await Promise.all([
      thanoxStats({ data: { token } }),
      thanoxListKeys({ data: { token, q, filter } }),
      thanoxAudit({ data: { token } }),
    ]);
    if (s.ok) setStats(s.stats);
    if (k.ok) setKeys(k.keys);
    if (a.ok) setLogs(a.logs.map((x) => ({ action: x.action, result: x.result, at: x.at })));
  };

  useEffect(() => {
    void load();
  }, [token, q, filter]);

  const make = async () => {
    setBusy(true);
    try {
      const res = await thanoxCreateKey({ data: { token, type, days, deviceLimit: limit, label } });
      if (res.ok) {
        setMade(res.key);
        toast("success", t("keyCreated"));
        void load();
      } else toast("error", t("permissionDenied"));
    } finally {
      setBusy(false);
    }
  };

  const pick = (id: string | "login") => {
    setTarget(id);
    fileRef.current?.click();
  };

  const onFile = async (file?: File) => {
    if (!file || !target) return;
    try {
      const data = await fileToIconDataUrl(file);
      if (target === "login") setLoginMark(data);
      else setAppIcon(target, data);
      toast("success", t("imageSaved"));
    } catch {
      toast("error", t("imageInvalid"));
    } finally {
      setTarget(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Screen title={t("adminTitle")} back>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />

      <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{t("imageLibrary")}</p>
      <GlassCard className="mb-4 p-3">
        <div className="mb-3 flex items-center gap-3">
          {loginMark ? (
            <img src={loginMark} alt="" className="size-12 rounded-[14px] object-cover" />
          ) : (
            <span className="grid size-12 place-items-center rounded-[14px] bg-elevated
... 