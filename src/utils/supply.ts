import { REQUEST_TIMEOUT_MS } from "./config.js";
import { bethToWei } from "./units.js";

/** Successful answer from one attestor. */
export interface SupplyReading {
  url: string;
  ok: true;
  /** Total BETH supply as the attestor returned it: a decimal string in whole BETH. */
  totalSupplyBeth: string;
  /** The same value in wei (1 BETH = 1e18 wei), for comparison with the reserve. */
  totalSupplyWei: bigint;
  /** When the attestor last refreshed its supply index (RFC 3339). */
  lastUpdated: string;
}

/** Failed answer from one attestor. The error text explains why. */
export interface SupplyError {
  url: string;
  ok: false;
  error: string;
}

export type SupplyResult = SupplyReading | SupplyError;

type SupplyResponse =
  | { status: "ready"; total_supply_beth: string; last_updated: string }
  | { status: "not_yet_calculated"; message: string };

/**
 * Ask every attestor for the BETH total supply, in parallel.
 * The function never picks a winner. It returns one result per URL, in input order,
 * so the caller sees exactly what each independent node reports.
 */
export async function fetchAllSupplies(
  urls: readonly string[],
  fetchFn: typeof fetch = fetch,
): Promise<SupplyResult[]> {
  return Promise.all(urls.map((url) => fetchSupply(url, fetchFn)));
}

export async function fetchSupply(url: string, fetchFn: typeof fetch = fetch): Promise<SupplyResult> {
  try {
    const res = await fetchFn(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!res.ok) {
      return { url, ok: false, error: `HTTP ${res.status} ${res.statusText}`.trim() };
    }
    const body = (await res.json()) as SupplyResponse;
    if (body.status !== "ready") {
      return { url, ok: false, error: body.message ?? `status ${body.status}` };
    }
    return {
      url,
      ok: true,
      totalSupplyBeth: body.total_supply_beth,
      totalSupplyWei: bethToWei(body.total_supply_beth),
      lastUpdated: body.last_updated,
    };
  } catch (err) {
    return { url, ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
