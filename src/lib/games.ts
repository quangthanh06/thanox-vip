export type FpsOpt = 60 | 90 | 120;
export type PerfOpt = "balanced" | "high" | "max";
export type NetOpt = "standard" | "lowlat";
export type TouchOpt = "standard" | "fast" | "ultra";

export type GameTune = {
  fps: FpsOpt;
  perf: PerfOpt;
  net: NetOpt;
  touch: TouchOpt;
  thermal: number;
};

export type SensProfile = {
  general: number;
  redDot: number;
  scope2: number;
  scope4: number;
  sniper: number;
  freeLook: number;
  fire: number;
};

export const DEFAULT_GAME_TUNE: GameTune = {
  fps: 90,
  perf: "high",
  net: "lowlat",
  touch: "ultra",
  thermal: 45,
};

export const GAME_META: Record<
  string,
  { title: string; subtitle: string; version: string; size: string; scheme: string; store: string; mark: string; icon: string }
> = {
  ff: {
    title: "Free Fire",
    subtitle: "Free Fire: 9th Anniversary",
    version: "1.13",
    size: "1.45 GB",
    scheme: "freefire://",
    store: "https://apps.apple.com/app/id1300146617",
    mark: "FF",
    icon: "/games/ff.png",
  },
  ffmax: {
    title: "Free Fire MAX",
    subtitle: "Free Fire MAX",
    version: "2.130.1",
    size: "1.27 GB",
    scheme: "freefiremax://",
    store: "https://apps.apple.com/app/id1480516829",
    mark: "MX",
    icon: "/games/ffmax.png",
  },
};

export function hashSeed(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seedSens(seed: string): SensProfile {
  const h = hashSeed(seed || "thanox");
  const n = (shift: number, min: number, max: number) => min + ((h >>> shift) % (max - min + 1));
  return {
    general: n(0, 150, 195),
    redDot: n(3, 145, 190),
    scope2: n(6, 130, 175),
    scope4: n(9, 120, 160),
    sniper: n(12, 95, 135),
    freeLook: n(15, 140, 185),
    fire: n(18, 35, 70),
  };
}

export function openGame(kind: string) {
  const meta = GAME_META[kind];
  if (!meta) return { ok: false as const };
  try {
    window.location.href = meta.scheme;
    window.setTimeout(() => {
      window.open(meta.store, "_blank", "noopener,noreferrer");
    }, 900);
    return { ok: true as const };
  } catch {
    window.open(meta.store, "_blank", "noopener,noreferrer");
    return { ok: true as const };
  }
}
