import { useCallback, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";
import { useAppStore } from "@/lib/store";

const THRESHOLD = 62;

function isControl(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      "button, a, input, textarea, select, label, [role='button'], [role='switch'], [role='slider'], [role='tab']",
    ),
  );
}

export function PullScroll({
  onRefresh,
  className,
  children,
}: {
  onRefresh?: () => Promise<void> | void;
  className?: string;
  children: ReactNode;
}) {
  const reduce = useAppStore((s) => s.reduceMotion);
  const hapticsOn = useAppStore((s) => s.haptics);
  const scroller = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pulling = useRef(false);
  const armed = useRef(false);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [settling, setSettling] = useState(true);

  const resist = (dy: number) => {
    const raw = Math.max(0, dy);
    return Math.min(108, raw * 0.42);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!onRefresh || reduce || refreshing) return;
    if (isControl(e.target)) return;
    const el = scroller.current;
    if (!el || el.scrollTop > 2) return;
    pulling.current = true;
    armed.current = false;
    startY.current = e.clientY;
    setSettling(false);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!pulling.current) return;
    const dy = e.clientY - startY.current;
    if (dy < 8) return;
    const el = scroller.current;
    if (el && !el.hasPointerCapture(e.pointerId)) {
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    e.preventDefault();
    const next = resist(dy);
    if (next > THRESHOLD && !armed.current) {
      armed.current = true;
      haptic(hapticsOn, "medium");
    }
    if (next < THRESHOLD - 8) armed.current = false;
    setPull(next);
  };

  const finish = useCallback(
    async (should: boolean) => {
      pulling.current = false;
      setSettling(true);
      if (should && onRefresh) {
        setRefreshing(true);
        setPull(52);
        haptic(hapticsOn, "success");
        try {
          await onRefresh();
        } finally {
          setPull(0);
          setRefreshing(false);
        }
      } else {
        setPull(0);
      }
    },
    [hapticsOn, onRefresh],
  );

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!pulling.current) return;
    const el = scroller.current;
    if (el?.hasPointerCapture(e.pointerId)) {
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    void finish(pull >= THRESHOLD);
  };

  const progress = Math.min(1, pull / THRESHOLD);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center"
        style={{ height: Math.max(pull, refreshing ? 52 : 0) }}
        aria-hidden="true"
      >
        <div
          className={cn("thanox-ptr", (refreshing || pull > 8) && "is-on")}
          style={{
            transform: `translateY(${Math.max(8, pull * 0.35)}px) scale(${0.55 + progress * 0.45})`,
            opacity: refreshing ? 1 : progress,
          }}
        >
          <span className={cn("thanox-ptr-arc", refreshing && "is-spin")} />
        </div>
      </div>
      <div
        ref={scroller}
        className={cn("scroll-y flex-1", className)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          transform: pull || refreshing ? `translateY(${refreshing ? 52 : pull}px)` : undefined,
          transition: settling ? "transform 420ms cubic-bezier(0.32, 0.72, 0, 1)" : "none",
          touchAction: pull > 0 || refreshing ? "none" : "pan-y",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function DraggableSheet({
  title,
  children,
  footer,
  onClose,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}) {
  const reduce = useAppStore((s) => s.reduceMotion);
  const hapticsOn = useAppStore((s) => s.haptics);
  const [dy, setDy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [out, setOut] = useState(false);
  const start = useRef(0);
  const last = useRef(0);

  const close = () => {
    setOut(true);
    haptic(hapticsOn, "light");
    window.setTimeout(onClose, reduce ? 0 : 380);
  };

  const onDown = (e
... 