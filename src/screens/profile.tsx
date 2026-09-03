import { Check, LogOut, Settings, Shield } from "lucide-react";
import { GlassCard, IconButton, NavRow, PrimaryButton, SecondaryButton } from "@/components/ds";
import { Screen, useT } from "@/components/shell";
import { useAppStore } from "@/lib/store";
import { thanoxLogout, writeSessionToken } from "@/lib/thanox-auth";

export function ProfileScreen() {
  const t = useT();
  const push = useAppStore((s) => s.push);
  const session = useAppStore((s) => s.session);
  const setSession = useAppStore((s) => s.setSession);
  const name = useAppStore((s) => s.displayName.trim()) || "Thanox";
  const device = useAppStore((s) => s.lastDevice);
  const admin = session && ["ADMIN", "OWNER", "STAFF"].includes(session.role);

  const logout = async () => {
    if (session?.token) await thanoxLogout({ data: { token: session.token } });
    writeSessionToken(null);
    setSession(null);
  };

  return (
    <Screen
      title={t("profileTitle").toUpperCase()}
      right={
        <IconButton label={t("settingsTitle")} onClick={() => push("settings")}>
          <Settings className="size-4" />
        </IconButton>
      }
    >
      <GlassCard glow className="mb-4 p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-full bg-accent/20 text-lg font-semibold text-accent-bright">
            {name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="truncate text-[17px] font-semibold">{name}</div>
              <span className="rounded-md bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-accent-bright">{session?.role ?? "USER"}</span>
            </div>
            <div className="text-[12px] text-muted">{t("premiumMember")}</div>
          </div>
          <Check className="size-5 text-success" />
        </div>
      </GlassCard>

      <GlassCard className="mb-4 p-4">
        <div className="mb-1 flex items-center justify-between">
          <div className="text-[16px] font-semibold">{t("keyStatus")}</div>
          <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success">
            {t("activated")}
          </span>
        </div>
        <div className="mt-3 space-y-1.5 text-[13px]">
          <div className="flex justify-between">
            <span className="text-muted">{t("roleLabel")}</span>
            <span>{session?.role ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">{t("expiresLabel")}</span>
            <span>{session?.expiresAt ? new Date(session.expiresAt).toLocaleDateString() : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">{t("sessionDevice")}</span>
            <span className="font-mono">{session?.keyHint ?? `••••${session?.last4 ?? ""}`}</span>
          </div>
        </div>
        {admin ? (
          <PrimaryButton className="mt-4" icon={Shield} onClick={() => push("admin")}>
            {t("adminPanel")}
          </PrimaryButton>
        ) : !session ? (
          <PrimaryButton className="mt-4" icon={Shield} onClick={() => push("auth")}>
            {t("verifyKey")}
          </PrimaryButton>
        ) : null}
      </GlassCard>

      <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{t("account")}</p>
      <GlassCard className="mb-4 p-0">
        <NavRow icon={Settings} title={t("deviceName")} hint={device?.platform ?? "iPhone"} onClick={() => push("device")} />
        <NavRow icon={Settings} title={t("prefsTitle")} hint={t("locale")} onClick={() => push("preferences")} />
        <NavRow icon={Shield} title={t("privacy")} onClick={() => push("privacy")} />
      </GlassCard>
      {session ? (
        <SecondaryButton className="mb-4 w-full" icon={LogOut} onClick={() => void logout()}>
          {t("logOut")}
        </SecondaryButton>
      ) : null}
      <p className="text-center text-[11px] uppercase tracking-[0.18em] text-muted">{t("brand")}</p>
    </Screen>
  );
}