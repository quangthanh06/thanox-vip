export function haptic(
  enabled: boolean,
  style: "light" | "medium" | "heavy" | "success" | "warning" | "error" = "light",
) {
  if (!enabled || typeof navigator === "undefined" || !navigator.vibrate) return;
  const pattern =
    style === "light"
      ? 8
      : style === "medium"
        ? 16
        : style === "heavy"
          ? 28
          : style === "success"
            ? [10, 40, 18]
            : style === "warning"
              ? [18, 40, 18]
              : [24, 40, 24, 40, 32];
  try {
    navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}
