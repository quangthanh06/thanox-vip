import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";

export type GraphRange = "30s" | "5m" | "30m";

const N = 72;

function intervalMs(range: GraphRange) {
  if (range === "5m") return 5000;
  if (range === "30m") return 30000;
  return 500;
}

function rangeLabel(range: GraphRange, i: number) {
  const total = range === "5m" ? 300 : range === "30m" ? 1800 : 30;
  const t = Math.round((1 - i) * total);
  if (t === 0) return "Now";
  if (range === "30s") return `-${t}s`;
  if (t < 60) return `-${t}s`;
  return `-${Math.round(t / 60)}m`;
}

export function LiveGraph({
  cpu,
  ram,
  battery,
  range = "30s",
  tall = false,
}: {
  cpu: number;
  ram: number;
  battery: number | null;
  range?: GraphRange;
  tall?: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduce = useAppStore((s) => s.reduceMotion);
  const cpuRef = useRef(cpu);
  const ramRef = useRef(ram);
  const batRef = useRef(battery);
  const rangeRef = useRef(range);
  const reduceRef = useRef(reduce);
  cpuRef.current = cpu;
  ramRef.current = ram;
  batRef.current = battery;
  rangeRef.current = range;
  reduceRef.current = reduce;

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    const buf = {
      cpu: Array.from({ length: N }, () => cpuRef.current),
      ram: Array.from({ length: N }, () => ramRef.current),
      bat: Array.from({ length: N }, () => batRef.current ?? 100),
    };
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let phase = 0;

    const sample = (now: number) => {
      const pulse = 0.5 + 0.5 * Math.sin(now / 980);
      const beat = Math.max(0, Math.sin(now / 640)) ** 3 * 2.4;
      const ncpu = Math.max(0, Math.min(100, cpuRef.current + beat * pulse - 0.4));
      const nram = Math.max(0, Math.min(100, ramRef.current + Math.sin(now / 2100) * 0.7));
      const rawBat = batRef.current;
      const nbat = rawBat == null ? null : Math.max(0, Math.min(100, rawBat + Math.sin(now / 4200) * 0.12));
      buf.cpu.push(ncpu);
      buf.ram.push(nram);
      buf.bat.push(nbat ?? buf.bat[buf.bat.length - 1] ?? 100);
      buf.cpu.shift();
      buf.ram.shift();
      buf.bat.shift();
    };

    const drawLine = (arr: number[], color: string, glow: string, w: number, h: number, width: number, scroll: number) => {
      ctx.beginPath();
      arr.forEach((v, i) => {
        const x = ((i - scroll) / (arr.length - 1)) * w;
        const y = h - 18 - (v / 100) * (h - 28);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = glow;
      ctx.lineWidth = width + 2.4;
      ctx.globalAlpha = 0.28;
      ctx.stroke();
      ctx.beginPath();
      arr.forEach((v, i) => {
        const x = ((i - scroll) / (arr.length - 1)) * w;
        const y = h - 18 - (v / 100) * (h - 28);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.globalAlpha = 1;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
    };

    const tick = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      const step = intervalMs(rangeRef.current);
      if (!reduceRef.current) {
        acc += dt;
        while (acc >= step) {
          acc -= step;
          sample(now);
        }
        phase = acc / step;
      }
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w < 8 || h < 8) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const pw = Math.floor(w * dpr);
      const ph = Math.floor(h * dpr);
      if (el.width !== pw || el.height !== ph) {
        el.width = pw;
        el.height = ph;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,45,45,0.035)";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i <= 6; i++) {
        const x
... 