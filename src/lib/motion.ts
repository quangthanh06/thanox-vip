import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/lib/store";

export const MOTION = {
  fast: 160,
  standard: 280,
  slow: 480,
  ring: 920,
  splash: 1600,
  spring: "cubic-bezier(0.32, 0.72, 0, 1)",
  springOut: "cubic-bezier(0.34, 1.2, 0.64, 1)",
} as const;

export function useReduced() {
  return useAppStore((s) => s.reduceMotion);
}

export function useCount(target: number, duration: number = MOTION.ring) {
  const reduce = useReduced();
  const [value, setValue] = useState(reduce ? target : 0);
  const fromRef = useRef(reduce ? target : 0);
  useEffect(() => {
    if (reduce) {
      fromRef.current = target;
      setValue(target);
      return;
    }
    const from = fromRef.current;
    const delta = target - from;
    if (Math.abs(delta) < 0.15) {
      fromRef.current = target;
      setValue(target);
      return;
    }
    const dur = Math.min(1400, Math.max(280, duration * (Math.abs(delta) / 80)));
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - (1 - p) * (1 - p) * (1 - p);
      const next = from + delta * e;
      setValue(next);
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduce]);
  return value;
}

export function usePressScale() {
  const [pressed, setPressed] = useState(false);
  return {
    pressed,
    bind: {
      onPointerDown: () => setPressed(true),
      onPointerUp: () => setPressed(false),
      onPointerCancel: () => setPressed(false),
      onPointerLeave: () => setPressed(false),
    },
  };
}
