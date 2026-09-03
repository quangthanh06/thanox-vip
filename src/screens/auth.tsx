import { useEffect, useRef, useState } from "react";
import { Bot, X } from "lucide-react";
import { LogoMark, Wordmark } from "@/components/ds";
import { useT } from "@/components/shell";
import { haptic } from "@/lib/haptics";
import { useAppStore } from "@/lib/store";
import { getDeviceId, thanoxVerify, writeSessionToken } from "@/lib/thanox-auth";

const PHONE = "0889696810";
const ZALO = `https://zalo.me/${PHONE}`;

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "valid"; role: string; expiresAt: string | null; otherDevice: boolean }
  | { kind: "invalid" }
  | { kind: "expired" }
  | { kind: "revoked" }
  | { kind: "suspended" }
  | { kind: "limit" }
  | { kind: "empty" }
  | { kind: "timeout" };

type BotView = "closed" | "menu" | "buy" | "contact" | "broken";

function failKind(code: string): Status {
  if (code === "EXPIRED_KEY") return { kind: "expired" };
  if (code === "REVOKED_KEY") return { kind: "revoked" };
  if (code === "SUSPENDED") return { kind: "suspended" };
  if (code === "DEVICE_LIMIT") return { kind: "limit" };
  return { kind: "invalid" };
}

function normalizeKey(raw: string) {
  return raw.replace(/\s+/g, "").toUpperCase();
}

async function timed<T>(p: Promise<T>, ms = 15000): Promise<T> {
  let id = 0;
  const timeout = new Promise<never>((_, rej) => {
    id = window.setTimeout(() => rej(new Error("timeout")), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    window.clearTimeout(id);
  }
}

export function AuthScreen() {
  const t = useT();
  const haptics = useAppStore((s) => s.haptics);
  const setSession = useAppStore((s) => s.setSession);
  const setTab = useAppStore((s) => s.setTab);
  const toast = useAppStore((s) => s.toast);
  const pop = useAppStore((s) => s.pop);
  const stacked = useAppStore((s) => s.stack.includes("auth"));
  const loginMark = useAppStore((s) => s.loginMark);
  const [key, setKey] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [bot, setBot] = useState<BotView>("closed");
  const [kb, setKb] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lock = useRef(false);

  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 240);
    const vv = window.visualViewport;
    if (!vv) return () => window.clearTimeout(id);
    const sync = () => setKb(window.innerHeight - vv.height > 90);
    vv.addEventListener("resize", sync);
    return () => {
      window.clearTimeout(id);
      vv.removeEventListener("resize", sync);
    };
  }, []);

  const check = async () => {
    if (lock.current) return;
    const v = normalizeKey(key);
    if (!v) {
      setStatus({ kind: "empty" });
      haptic(haptics, "warning");
      inputRef.current?.focus();
      return;
    }
    lock.current = true;
    setKey(v);
    setStatus({ kind: "loading" });
    haptic(haptics, "medium");
    try {
      const res = await timed(thanoxVerify({ data: { key: v, deviceId: getDeviceId() } }));
      if (!res.ok) {
        setStatus(failKind(res.code));
        haptic(haptics, "error");
        return;
      }
      setStatus({
        kind: "valid",
        role: res.session.role,
        expiresAt: res.session.expiresAt,
        otherDevice: false,
      });
      haptic(haptics, "success");
      writeSessionToken(res.session.token);
      setSession(res.session);
      setTab("home");
      if (stacked) pop();
    } catch {
      setStatus({ kind: "timeout" });
      haptic(haptics, "error");
    } finally {
      lock.current = false;
    }
  };

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(PHONE);
      toast("success", t("toastCopied"));
    } catch {
      toast("error", PHONE);
    }
  };

  const openZalo = () => {
    const w = window.open(ZALO, "_blank", "noopener,noreferrer");
    if (!w) void copyPhone();
  };

  const bad =
    status.kind === "invalid" ||
    status.kind === "expired" ||
    status.kind === "revoked" ||
    status.kind === "suspended" ||
    status.kind === "limit" ||
    
... 