import type { BatterySnapshot, DeviceSnapshot, StorageSnapshot } from "./types";

type NavWithExtras = Navigator & {
  deviceMemory?: number;
  connection?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
    type?: string;
  };
  pdfViewerEnabled?: boolean;
  getBattery?: () => Promise<{
    level: number;
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
    addEventListener: (ev: string, fn: () => void) => void;
  }>;
  storage?: {
    estimate?: () => Promise<{ usage?: number; quota?: number }>;
    persisted?: () => Promise<boolean>;
  };
};

function friendlyPlatform(raw: string) {
  const s = raw.toLowerCase();
  if (s.includes("iphone") || s.includes("ios")) return "iPhone";
  if (s.includes("ipad")) return "iPad";
  if (s.includes("mac")) return "Mac";
  if (s.includes("android")) return "Android";
  if (s.includes("win")) return "Windows";
  if (s.includes("linux") || s.includes("x11")) return "Linux";
  return raw || "—";
}

function nav(): NavWithExtras {
  return navigator as NavWithExtras;
}

export function readDevice(): DeviceSnapshot {
  const n = nav();
  const c = n.connection;
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (n as Navigator & { standalone?: boolean }).standalone === true;

  return {
    at: Date.now(),
    userAgent: n.userAgent || "—",
    platform: friendlyPlatform(n.platform || n.userAgent || "—"),
    language: n.language || "—",
    languages: [...(n.languages ?? [])],
    cores: n.hardwareConcurrency || 0,
    memoryGB: typeof n.deviceMemory === "number" ? n.deviceMemory : null,
    screen: `${window.screen.width}×${window.screen.height}`,
    availScreen: `${window.screen.availWidth}×${window.screen.availHeight}`,
    pixelRatio: window.devicePixelRatio || 1,
    colorDepth: window.screen.colorDepth || 0,
    touchPoints: n.maxTouchPoints || 0,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "—",
    timezoneOffset: new Date().getTimezoneOffset(),
    cookiesEnabled: n.cookieEnabled,
    online: n.onLine,
    connectionType: c?.effectiveType || c?.type || (n.onLine ? "unknown" : "offline"),
    downlink: typeof c?.downlink === "number" ? c.downlink : null,
    rtt: typeof c?.rtt === "number" ? c.rtt : null,
    saveData: Boolean(c?.saveData),
    standalone,
    maxTouchPoints: n.maxTouchPoints || 0,
    vendor: n.vendor || "—",
    pdfViewer: n.pdfViewerEnabled ?? false,
    hardwareConcurrency: n.hardwareConcurrency || 0,
  };
}

export async function readBattery(): Promise<BatterySnapshot> {
  const n = nav();
  if (typeof n.getBattery !== "function") {
    return { at: Date.now(), level: null, charging: null, chargingTime: null, dischargingTime: null, supported: false };
  }
  try {
    const b = await n.getBattery();
    return {
      at: Date.now(),
      level: Math.round(b.level * 100),
      charging: b.charging,
      chargingTime: Number.isFinite(b.chargingTime) ? b.chargingTime : null,
      dischargingTime: Number.isFinite(b.dischargingTime) ? b.dischargingTime : null,
      supported: true,
    };
  } catch {
    return { at: Date.now(), level: null, charging: null, chargingTime: null, dischargingTime: null, supported: false };
  }
}

export async function readStorage(): Promise<StorageSnapshot> {
  const n = nav();
  if (!n.storage?.estimate) {
    return { at: Date.now(), usage: null, quota: null, persisted: null, supported: false };
  }
  try {
    const est = await n.storage.estimate();
    const persisted = n.storage.persisted ? await n.storage.persisted() : null;
    return {
      at: Date.now(),
      usage: est.usage ?? null,
      quota: est.quota ?? null,
      persisted,
      supported: true,
    };
  } catch {
    return { at: Date.now(), usage: null, quota: null, persisted: null, supported: false };
  }
}

export function systemScore(input: {
  online: boolean;
  battery: number | null;
  storageRatio: number | null;
  cores: number;
}): number {
  let score = 58;
  if (input.online) score += 12;
  else score -= 18;
  if (input.battery != null) {
    score += Math.round((input.battery / 100) * 16);
    if (input.battery < 15) score -= 10;
  } else {
    score += 8;
  }
  if (input.storageRatio != null) {
    score += Math.round((1 - input.storageRatio) * 12);
  } else {
    score += 6;
  }
  if (input.cores >= 8) score += 8;
  else if (input.cores >= 4) score += 4;
  return Math.max(8, Math.min(99, score));
}
