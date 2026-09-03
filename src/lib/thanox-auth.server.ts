import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { getSql } from "@/lib/db";

export type KeyType = "USER" | "VIP" | "STAFF" | "ADMIN" | "OWNER";
export type KeyStatus = "ACTIVE" | "EXPIRED" | "REVOKED" | "SUSPENDED";

export type PublicSession = {
  token: string;
  role: KeyType;
  expiresAt: string | null;
  label: string | null;
  permissions: string[];
  last4: string;
  keyHint: string;
};

function keyHintOf(type: KeyType, prefix: string | null, last4: string) {
  if (prefix && prefix.includes("-")) return `${prefix}-XXXX`;
  const head = type === "ADMIN" || type === "OWNER" || type === "STAFF" ? "ADM" : "VIP";
  return `${head}-••••-XXXX`;
}

function prefixOf(raw: string) {
  const p = normalizeKey(raw).split("-");
  return p.slice(0, 2).join("-");
}

function sha(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

function uid() {
  return randomBytes(16).toString("hex");
}

function mintUserKey() {
  const s = randomBytes(8).toString("hex").toUpperCase();
  return `VIP-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}`;
}

function mintAdminKey() {
  const s = randomBytes(16).toString("hex").toUpperCase();
  return `ADM-${s.match(/.{4}/g)!.join("-")}`;
}

function mintKey(type: KeyType = "USER") {
  if (type === "ADMIN" || type === "OWNER" || type === "STAFF") return mintAdminKey();
  return mintUserKey();
}

function normalizeKey(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

async function audit(actor: string | null, action: string, target: string | null, result: string) {
  const sql = await getSql();
  await sql`insert into audit_logs (id, actor, action, target, result) values (${uid()}, ${actor}, ${action}, ${target}, ${result})`;
}

export async function setupIfEmpty() {
  const sql = await getSql();
  const rows = await sql<{ n: number }>`select count(*)::int as n from access_keys`;
  return { empty: (rows[0]?.n ?? 0) === 0 };
}

let cachedDisplay: { key: string; role: "OWNER" | "ADMIN" } | null = null;

export async function visibleAdminKey() {
  return { ok: false as const };
}

const ADMIN_KEY_FILE = "/workspace/data/.admin-key";
const PINNED_ADMIN_KEY = "ADMIN-THANOX-06086810";
const PINNED_ADMIN_LABEL = "Thanox Admin v2";

function persistAdminFile(raw: string) {
  try {
    mkdirSync("/workspace/data", { recursive: true });
    writeFileSync(ADMIN_KEY_FILE, raw, { mode: 0o600 });
  } catch {
    /* preview may not persist files */
  }
}

export async function ensureStrongAdmin() {
  const sql = await getSql();
  try {
    await sql.query("alter table access_keys add column if not exists key_prefix text");
  } catch {
    /* already there */
  }

  const purged = await sql<{ id: string }>`select id from audit_logs where action = ${"PURGE_NON_ADMIN"} limit 1`;
  if (!purged[0]) {
    await sql`update access_keys set status = ${"REVOKED"} where type not in (${"ADMIN"}, ${"OWNER"}) and status = ${"ACTIVE"}`;
    await sql`update thanox_sessions set revoked = true where key_id in (select id from access_keys where type not in (${"ADMIN"}, ${"OWNER"}))`;
    await audit("system", "PURGE_NON_ADMIN", null, "SUCCESS");
  }

  const raw = normalizeKey(PINNED_ADMIN_KEY);
  const hash = sha(raw);
  persistAdminFile(raw);

  const match = await sql<{ id: string }>`select id from access_keys where key_hash = ${hash} and status = ${"ACTIVE"} limit 1`;
  if (match[0]) {
    await sql`update access_keys
      set type = ${"ADMIN"},
          device_limit = ${0},
          key_prefix = ${prefixOf(raw)},
          key_last4 = ${raw.slice(-4)},
          label = ${PINNED_ADMIN_LABEL},
          expires_at = null
      where id = ${match[0].id}`;
    await sql`update access_keys set status = ${"REVOKED"}
      where (type = ${"ADMIN"} or type = ${"OWNER"}) and status = ${"ACTIVE"} and id <> ${match[0].id}`;
    cachedDisplay = { key: raw, role: "ADMIN" };
    return { created: false as const };
  }

  await sql`update thanox_sessions set revoked = true where key_id in (
    select id from access_keys where type in (${"ADMIN"}, ${"OWNER"})
  )`;
  await sql`update access_keys set status = ${"REVOKED"} where (type = ${"ADMIN"} or type = ${"OWNER"}) and status = ${"ACTIVE"}`;

  const id = uid();
  await sql`insert into access_keys (id, key_hash, key_last4, key_prefix, type, status, device_limit, label, permissions, created_by)
    values (${id}, ${hash}, ${raw.slice(-4)}, ${prefixOf(raw)}, ${"ADMIN"}, ${"ACTIVE"}, ${0}, ${PINNED_ADMIN_LABEL}, ${"[]"}, ${"system"})`;
  await audit("system", "ROTATE_PINNED_ADMIN", id, "SUCCESS");
  cachedDisplay = { key: raw, role: "ADMIN" };
  return { created: true as const };
}

export async function bootstrapOwner() {
  const sql = await getSql();
  const rows = await sql<{ n: number }>`select count(*)::int as n from access_keys`;
  if ((rows[0]?.n ?? 0) > 0) {
    return { ok: false as const, code: "ALREADY_INITIALIZED" };
  }
  const raw = mintKey("OWNER");
  const id = uid();
  await sql`insert into access_keys (id, key_hash, key_last4, type, status, device_limit, label, permissions, created_by)
    values (${id}, ${sha(normalizeKey(raw))}, ${raw.slice(-4)}, ${"OWNER"}, ${"ACTIVE"}, ${5}, ${"Owner"}, ${"[]"}, ${"system"})`;
  await audit("system", "BOOTSTRAP", id, "SUCCESS");
  return { ok: true as const, key: raw, role: "OWNER" as const };
}

export async function inspectKey(raw: string, deviceId: string) {
  const sql = await getSql();
  const hash = sha(normalizeKey(raw));
  const found = await sql<{
    id: string;
    type: KeyType;
    status: KeyStatus;
    expires_at: string | null;
    device_limit: number;
    label: string | null;
    key_last4: string;
  }>`select id, type, status, expires_at, device_limit, label, key_last4 from access_keys where key_hash = ${hash} limit 1`;
  const row = found[0];
  if (!row) {
    return { exists: false as const };
  }
  const devices = await sql<{ n: number }>`select count(*)::int as n from thanox_sessions where key_id = ${row.id} and revoked = false and expires_at > now()`;
  const bound = devices[0]?.n ?? 0;
  const mine = await sql<{ id: string }>`select id from thanox_sessions where key_id = ${row.id} and device_id = ${deviceId} and revoked = false and expires_at > now() limit 1`;
  return {
    exists: true as const,
    type: row.type,
    status: row.status,
    expiresAt: row.expires_at,
    deviceLimit: row.device_limit,
    devicesBound: bound,
    thisDeviceBound: Boolean(mine[0]),
    label: row.label,
    last4: row.key_last4,
  };
}

export async function verifyKey(input: { key: string; deviceId: string }): Promise<
  | { ok: true; session: PublicSession }
  | { ok: false; code: "INVALID_KEY" | "EXPIRED_KEY" | "REVOKED_KEY" | "DEVICE_LIMIT" | "SUSPENDED" }
> {
  await ensureStrongAdmin();
  const sql = await getSql();
  const hash = sha(normalizeKey(input.key));
  const found = await sql<{
    id: string;
    type: KeyType;
    status: KeyStatus;
    expires_at: string | null;
    device_limit: number;
    label: string | null;
    permissions: string;
    key_last4: string;
    key_prefix: string | null;
  }>`select id, type, status, expires_at, device_limit, label, permissions, key_last4, key_prefix from access_keys where key_hash = ${hash} limit 1`;
  const row = found[0];
  if (!row) {
    await audit(null, "VERIFY", null, "INVALID_KEY");
    return { ok: false, code: "INVALID_KEY" };
  }
  if (row.status === "REVOKED") {
    await audit(row.id, "VERIFY", row.id, "REVOKED_KEY");
    return { ok: false, code: "REVOKED_KEY" };
  }
  if (row.status === "SUSPENDED") {
    await audit(row.id, "VERIFY", row.id, "SUSPENDED");
    return { ok: false, code: "SUSPENDED" };
  }
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    await sql`update access_keys set status = ${"EXPIRED"} where id = ${row.id} and status = ${"ACTIVE"}`;
    await audit(row.id, "VERIFY", row.id, "EXPIRED_KEY");
    return { ok: false, code: "EXPIRED_KEY" };
  }

  const devices = await sql<{ n: number }>`select count(*)::int as n from thanox_sessions where key_id = ${row.id} and revoked = false and expires_at > now()`;
  const active = devices[0]?.n ?? 0;
  const existing = await sql<{ id: string }>`select id from thanox_sessions where key_id = ${row.id} and device_id = ${input.deviceId} and revoked = false and expires_at > now() limit 1`;
  if (!existing[0] && row.device_limit > 0 && active >= row.device_limit) {
    await audit(row.id, "VERIFY", row.id, "DEVICE_LIMIT");
    return { ok: false, code: "DEVICE_LIMIT" };
  }

  const token = randomBytes(32).toString("hex");
  const sid = uid();
  const exp = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();
  await sql`insert into thanox_sessions (id, token_hash, key_id, dev
... 