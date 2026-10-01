/**
 * Fixed values for BETH on mainnet.
 * Update this file when the bridge contract moves.
 */

/** Ethereum mainnet. */
export const CHAIN_ID = 1;

/** BitSafeEvmAssetBridge proxy for ETH. This address holds the ETH that backs BETH. */
export const BETH_BRIDGE_ADDRESS =
  "0xb5d425d678B10949dD0f7bB0dd0427C47451D57E" as const;

/**
 * Canton party that issues BETH. Every BETH holding on the ledger names this party as issuer.
 * The attestor supply endpoint counts only holdings issued and signed by this party.
 */
export const BETH_REGISTRAR_PARTY =
  "beth-network::1220704c3cebc23916785557ebe79a5c7f68d034890a5b15690ea7ce050c7d463075";

/** Per-request timeout for attestor calls. */
export const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Name of the environment variable that lists the attestor supply endpoints.
 * The value is a comma-separated list of full URLs, one per attestor.
 * The URLs are not part of this repository.
 */
export const ATTESTOR_SUPPLY_URLS_VAR = "ATTESTOR_SUPPLY_URLS";

/** Parse the comma-separated URL list. Blank entries are ignored. */
export function parseAttestorUrls(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
