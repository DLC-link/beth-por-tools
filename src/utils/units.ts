/** 1 BETH = 1 ETH = 1e18 wei. */
export const WEI_PER_BETH = 10n ** 18n;

/**
 * Convert a decimal BETH string such as "0.0100000000" to wei with exact integer math.
 * The attestor returns at most 10 decimal places, so no rounding happens here.
 */
export function bethToWei(beth: string): bigint {
  const match = /^(\d+)(?:\.(\d{0,18}))?$/.exec(beth.trim());
  if (!match) throw new Error(`Invalid BETH amount: ${JSON.stringify(beth)}`);
  const [, whole, frac = ""] = match;
  return BigInt(whole) * WEI_PER_BETH + BigInt(frac.padEnd(18, "0"));
}

/** Format wei as a decimal ETH string with 18 places, for display only. */
export function weiToEth(wei: bigint): string {
  const whole = wei / WEI_PER_BETH;
  const frac = (wei % WEI_PER_BETH).toString().padStart(18, "0");
  return `${whole}.${frac}`;
}
