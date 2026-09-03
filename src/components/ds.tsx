import { useId, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Check, ChevronRight, Loader2, Search, type LucideIcon } from "lucide-react";
import { useCount } from "@/lib/motion";
import { cn, clamp } from "@/lib/utils";
import { haptic } from "@/lib/haptics";
import { useAppStore } from "@/lib/store";
import type { StatusTone } from "@/lib/types";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="4" y="4" width="56" height="56" rx="16" fill="#111113" stroke="#d70018" strokeOpacity="0.55" />
      <path d="M18 20h28v7H36.2V46h-8.4V27H18z" fill="#ff2d2d" />
    </svg>
  );
}

export function Wordmark({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const h = size === "lg" ? 42 : size === "sm" ? 26 : 34;
  const uid = useId();
  return (
    <svg
      viewBox="0 0 320 48"
      height={h}
      className={cn("thanox-wordmark-svg", className)}
      role="img"
      aria-label="THANOX"
    >
      <defs>
        <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#e8e8ee" />
          <stop offset="100%" stopColor="#9a9aa3" />
        </linearGradient>
        <linearGradient id={`${uid}-t`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff5a4f" />
          <stop offset="100%" stopColor="#d70018" />
        </linearGradient>
        <filter id={`${uid}-glow`} x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <text
        x="8"
        y="36"
        fill={`url(#${uid}-t)`}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="34"
        fontWeight="700"
        letterSpacing="2"
        filter={`url(#${uid}-glow)`}
      >
        T
      </text>
      <text
        x="36"
        y="36"
        fill={`url(#${uid}-fill)`}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="32"
        fontWeight="600"
        letterSpacing="7.5"
      >
        HANOX
      </text>
    </svg>
  );
}

export function GlassCard({
  className,
  glow,
  children,
  onClick,
  as: As = "div",
}: {
  className?: string;
  glow?: boolean;
  children: ReactNode;
  onClick?: () => void;
  as?: "div" | "button";
}) {
  const Comp = As;
  return (
    <Comp
      className={cn("thanox-card p-4", glow && "thanox-card-glow", onClick && "active:scale-[0.96] transition-transform duration-150", className)}
      onClick={onClick}
      {...(As === "button" ? { type: "button" } : {})}
    >
      {children}
    </Comp>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  selected?: boolean;
  icon?: LucideIcon;
};

export function PrimaryButton({
  loading,
  selected,
  icon: Icon,
  className,
  children,
  disabled,
  onClick,
  state = "idle",
  ...rest
}: BtnProps & { state?: "idle" | "loading" | "success" | "error" }) {
  const haptics = useAppStore((s) => s.haptics);
  const busy = loading || state === "loading";
  return (
    <button
      className={cn("thanox-cta", selected && "ring-2 ring-fg/40", state === "success" && "is-ok", state === "error" && "is-err", className)}
      disabled={disabled || busy}
      onClick={(e) => {
        haptic(haptics, state === "error" ? "warning" : "medium");
        onClick?.(e);
      }}
      {...rest}
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : state === "success" ? <Check className="size-4" /> : Icon ? <Icon className="size-4" /> : null}
      {children}
    </button>
  );
}

export function SecondaryButton({ loading, icon: Icon, className, children, disabled, onClick, ...rest }: BtnProps) {
  const haptics = useAppStore((s) => s.haptics);
  return (
    <button
      className={cn("thanox-btn thanox-btn-ghost", className)}
      disabled={disabled || loading}
      onClick={(e) => {
        haptic(haptics, "light");
        onClick?.(e);
      }}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : Icon ? <Icon className="size-4" /> : null}
      {children}
    </button>
  );
}

export function DestructiveButton({ loading, className, children, onClick, ...rest }: BtnProps) {
  const haptics = useAppStore((s) => s.haptics);
  return (
    <button
      className={cn("thanox-btn thanox-btn-danger", className)}
      onClick={(e) => {
        haptic(haptics, "warning");
        onClick?.(e);
      }}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : children}
    </button>
  );
}

export function IconButton({
  label,
  className,
  children,
  onClick,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  const haptics = useAppStore((s) => s.haptics);
  return (
    <button
      aria-label={label}
      className={cn("thanox-icon-btn", className)}
      onClick={(e) => {
        haptic(haptics, "light");
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function PillButton({
  children,
  onClick,
  tone = "accent",
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "accent" | "ghost";
}) {
  const haptics = useAppStore((s) => s.haptics);
  return (
    <button
      type="button"
      onClick={() => {
        haptic(haptics, "light");
        onClick?.();
      }}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-3.5 text-[12px] font-semibold transition-transform duration-150 active:scale-[0.96]",
        tone === "accent"
          ? "bg-accent text-white shadow-[0_0_16px_rgb(255_45_45_/_0.35)]"
          : "bg-accent/15 text-accent-bright",
      )}
    >
      {children}
    </button>
  );
}

export function Glass
... 