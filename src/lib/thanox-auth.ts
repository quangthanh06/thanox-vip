import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type KeyType = "USER" | "VIP" | "STAFF" | "ADMIN" | "OWNER";
export type PublicSession = {
  token: string;
  role: KeyType;
  expiresAt: string | null;
  label: string | null;
  permissions: string[];
  last4: string;
  keyHint?: string;
};

const TOKEN = "thanox_session_token";
const DEVICE = "thanox_device_id";

export function getDeviceId() {
  if (typeof window === "undefined") return "server";
  let id = sessionStorage.getItem(DEVICE);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(DEVICE, id);
  }
  return id;
}

export function readSessionToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN);
}

export function writeSessionToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) sessionStorage.setItem(TOKEN, token);
  else sessionStorage.removeItem(TOKEN);
}

export const thanoxNeedsSetup = createServerFn({ method: "GET" }).handler(async () => {
  const m = await import("./thanox-auth.server");
  await m.ensureStrongAdmin();
  return m.setupIfEmpty();
});

export const thanoxInspect = createServerFn({ method: "POST" })
  .validator(z.object({ key: z.string().min(4).max(64), deviceId: z.string().min(4) }))
  .handler(async ({ data }) => {
    const m = await import("./thanox-auth.server");
    return m.inspectKey(data.key, data.deviceId);
  });

export const thanoxVerify = createServerFn({ method: "POST" })
  .validator(z.object({ key: z.string().min(4).max(48), deviceId: z.string().min(4) }))
  .handler(async ({ data }) => {
    const m = await import("./thanox-auth.server");
    await m.ensureStrongAdmin();
    return m.verifyKey(data);
  });

export const thanoxSession = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8) }))
  .handler(async ({ data }) => {
    const m = await import("./thanox-auth.server");
    return m.sessionMe(data.token);
  });

export const thanoxLogout = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(8) }))
  .handler(async ({ data }) => {
    const m = await import("./thanox-auth.server");
    return m.logoutSession(data.token);
  });

export const thanoxStats = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string() }))
  .handler(async ({ data }) => {
    const m = await import("./thanox-auth.server");
    return m.stats(data.token);
  });

export const thanoxListKeys = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string(), q: z.string().optional(), filter: z.string().optional() }))
  .handler(async ({ data }) => {
    const m = await import("./thanox-auth.server");
    return m.listKeys(data.token, data.q ?? "", data.filter ?? "all");
  });

export const thanoxCreateKey = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string(),
      type: z.enum(["USER", "VIP", "STAFF", "ADMIN", "OWNER"]),
      days: z.number(),
      deviceLimit: z.number(),
      label: z.string().optional(),
      note: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const m = await import("./thanox-auth.server");
    return m.createKey(data.token, data);
  });

export const thanoxRevokeKey = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string(), id: z.string() }))
  .handler(async ({ data }) => {
    const m = await import("./thanox-auth.server");
    return m.revokeKey(data.token, data.id);
  });

export const thanoxExtendKey = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string(), id: z.string(), days: z.number() }))
  .handler(async ({ data }) => {
    const m = await import("./thanox-auth.server");
    return m.extendKey(data.token, data.id, data.days);
  });

export const thanoxResetDevices = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string(), id: z.string() }))
  .handler(async ({ data }) => {
    const m = await import("./thanox-auth.server");
    return m.resetKeyDevices(data.token, data.id);
  });

export const thanoxAudit = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string() }))
  .handler(async ({ data }) => {
    const m = await import("./thanox-auth.server");
    return m.listAudit(data.token);
  });
