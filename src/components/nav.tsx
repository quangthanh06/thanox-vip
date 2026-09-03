import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ScreenId, TabId } from "@/lib/types";

const TABS: TabId[] = ["home", "optimize", "appopt", "tools", "profile"];

type Layer = { id: ScreenId; k: number; out: boolean };

export function Stage({
  tab,
  stack,
  renderTab,
  renderScreen,
}: {
  tab: TabId;
  stack: ScreenId[];
  renderTab: (id: TabId) => ReactNode;
  renderScreen: (id: ScreenId) => ReactNode;
}) {
  const reduce = useAppStore((s) => s.reduceMotion);
  const [layers, setLayers] = useState<Layer[]>([]);
  const seq = useRef(0);
  const prevLen = useRef(0);
  const prevTab = useRef(tab);
  const [tabAnim, setTabAnim] = useState(false);

  useEffect(() => {
    if (prevTab.current !== tab) {
      prevTab.current = tab;
      setTabAnim(true);
      const id = window.setTimeout(() => setTabAnim(false), 380);
      return () => window.clearTimeout(id);
    }
  }, [tab]);

  useEffect(() => {
    if (stack.length > prevLen.current) {
      seq.current += 1;
      setLayers((ls) => [...ls, { id: stack[stack.length - 1], k: seq.current, out: false }]);
    } else if (stack.length < prevLen.current) {
      setLayers((ls) => {
        if (!ls.length) return ls;
        return ls.map((x, i) => (i === ls.length - 1 ? { ...x, out: true } : x));
      });
      const t = window.setTimeout(
        () => {
          setLayers((ls) => ls.slice(0, Math.max(0, stack.length)));
        },
        reduce ? 0 : 400,
      );
      prevLen.current = stack.length;
      return () => window.clearTimeout(t);
    }
    prevLen.current = stack.length;
  }, [stack, reduce]);

  const stacked = layers.some((l) => !l.out);

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <div
        className="absolute inset-0 flex flex-col will-change-transform"
        style={{
          transform: stacked && !reduce ? "translateX(-26%) scale(0.94)" : "none",
          opacity: stacked ? 0.5 : 1,
          filter: stacked ? "brightness(0.72)" : "none",
          transition: reduce
            ? "none"
            : "transform 420ms cubic-bezier(0.32, 0.72, 0, 1), opacity 420ms cubic-bezier(0.32, 0.72, 0, 1), filter 420ms cubic-bezier(0.32, 0.72, 0, 1)",
          pointerEvents: stacked ? "none" : "auto",
        }}
      >
        {TABS.map((id) => {
          const on = tab === id;
          return (
            <div
              key={id}
              className={cn(
                "absolute inset-0 flex flex-col",
                on ? "z-[1]" : "invisible pointer-events-none",
                on && tabAnim && !reduce && "anim-tab",
              )}
              aria-hidden={!on}
            >
              {on ? renderTab(id) : null}
            </div>
          );
        })}
      </div>
      {layers.map((layer, i) => (
        <div
          key={layer.k}
          className={cn("absolute inset-0 flex flex-col bg-bg", layer.out ? "anim-stack-out" : "anim-stack-in")}
          style={{ zIndex: 12 + i }}
        >
          {renderScreen(layer.id)}
        </div>
      ))}
    </div>
  );
}
