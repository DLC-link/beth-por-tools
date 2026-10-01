export type BackingStatus = "fully_backed" | "over_backed" | "under_backed";

export interface Comparison {
  /** reserve / supply, as a decimal string with 6 places. "n/a" when supply is zero. */
  ratio: string;
  status: BackingStatus;
}

/**
 * Compare one reserve value with one supply value, both in wei.
 * The comparison is exact. Any difference, however small, counts as over or under backed.
 */
export function compare(reserveWei: bigint, supplyWei: bigint): Comparison {
  const status: BackingStatus =
    reserveWei === supplyWei ? "fully_backed" : reserveWei > supplyWei ? "over_backed" : "under_backed";
  return { ratio: formatRatio(reserveWei, supplyWei), status };
}

const RATIO_PLACES = 6;

/** Integer division scaled to RATIO_PLACES decimals, so no float enters the calculation. */
export function formatRatio(numerator: bigint, denominator: bigint): string {
  if (denominator === 0n) return "n/a";
  const scale = 10n ** BigInt(RATIO_PLACES);
  const scaled = (numerator * scale) / denominator;
  const whole = scaled / scale;
  const frac = (scaled % scale).toString().padStart(RATIO_PLACES, "0");
  return `${whole}.${frac}`;
}

/** True when every successful reading carries the same value. */
export function allAgree(values: readonly bigint[]): boolean {
  return values.every((v) => v === values[0]);
}
