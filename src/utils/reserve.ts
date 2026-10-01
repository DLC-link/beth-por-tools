import { createPublicClient, http, type PublicClient } from "viem";
import { mainnet } from "viem/chains";
import { BETH_BRIDGE_ADDRESS } from "./config.js";

export interface ReserveReading {
  /** Bridge contract that holds the ETH. */
  address: string;
  chainId: number;
  /** ETH balance of the bridge address, in wei. */
  balanceWei: bigint;
  /** Block at which the balance was read. */
  blockNumber: bigint;
}

export function createClient(rpcUrl: string): PublicClient {
  return createPublicClient({ chain: mainnet, transport: http(rpcUrl) });
}

/**
 * Read the native ETH balance of the bridge address at a pinned block.
 * The balance is the reserve. It is what the chain holds for BETH holders, and it does not
 * depend on any accounting inside the bridge contract.
 */
export async function fetchReserve(client: PublicClient): Promise<ReserveReading> {
  const blockNumber = await client.getBlockNumber();
  const balanceWei = await client.getBalance({ address: BETH_BRIDGE_ADDRESS, blockNumber });
  return { address: BETH_BRIDGE_ADDRESS, chainId: mainnet.id, balanceWei, blockNumber };
}
