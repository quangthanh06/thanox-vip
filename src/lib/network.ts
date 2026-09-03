import type { NetworkQuality, NetworkResult } from "./types";

function qualityFromMs(avg: number, online: boolean): NetworkQuality {
  if (!online) return "offline";
  if (avg < 55) return "excellent";
  if (avg < 120) return "good";
  if (avg < 250) return "fair";
  return "poor";
}

function connectionType() {
  const c = (navigator as Navigator & { connection?: { effectiveType?: string; type?: string } }).connection;
  if (!navigator.onLine) return "offline";
  return c?.effectiveType || c?.type || "unknown";
}

export async function runNetworkTest(rounds = 5, onProgress?: (done: number, total: number) => void): Promise<NetworkResult> {
  const online = navigator.onLine;
  if (!online) {
    return {
      at: Date.now(),
      online: false,
      quality: "offline",
      avgMs: null,
      minMs: null,
      maxMs: null,
      samples: 0,
      type: "offline",
      error: "offline",
    };
  }

  const samples: number[] = [];
  try {
    for (let i = 0; i < rounds; i += 1) {
      const url = `/api/ping?n=${i}&t=${Date.now()}`;
      const t0 = performance.now();
      const res = await fetch(url, { cache: "no-store" });
      const t1 = performance.now();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await res.json().catch(() => null);
      samples.push(t1 - t0);
      onProgress?.(i + 1, rounds);
    }
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    return {
      at: Date.now(),
      online: true,
      quality: qualityFromMs(avg, true),
      avgMs: Math.round(avg),
      minMs: Math.round(Math.min(...samples)),
      maxMs: Math.round(Math.max(...samples)),
      samples: samples.length,
      type: connectionType(),
    };
  } catch (err) {
    return {
      at: Date.now(),
      online: navigator.onLine,
      quality: navigator.onLine ? "poor" : "offline",
      avgMs: samples.length ? Math.round(samples.reduce((a, b) => a + b, 0) / samples.length) : null,
      minMs: samples.length ? Math.round(Math.min(...samples)) : null,
      maxMs: samples.length ? Math.round(Math.max(...samples)) : null,
      samples: samples.length,
      type: connectionType(),
      error: err instanceof Error ? err.message : "network-error",
    };
  }
}
