/**
 * Formats a possibly non-finite metric for display.
 * '∞' / '−∞' for infinite values, '-' for NaN/undefined, fixed decimals otherwise.
 * Keeps the UI from showing 'Infinity', 'NaN' or garbage at the horn-torus
 * limit (r = R), where W = +∞ and K_min = −∞ by design.
 */
export function formatMetricSafe(
  value: number | undefined | null,
  decimals: number = 4
): string {
  if (value === Infinity) return "∞";
  if (value === -Infinity) return "−∞";
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return value.toFixed(decimals);
}
