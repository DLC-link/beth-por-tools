# BETH Proof of Reserve tools

Example code that reads both sides of the BETH Proof of Reserve (PoR) and compares them.

BETH is bridged ETH on Canton Network. A user locks ETH in the bridge contract on Ethereum,
and the attestor network mints the same amount of BETH on Canton. For every BETH in
circulation the bridge must hold one ETH.

- **Reserve** = the ETH balance of the `BitSafeEvmAssetBridge` proxy address on Ethereum mainnet.
- **Supply** = total BETH on Canton, as reported by each attestor node's public supply endpoint.

The script reads the reserve with [viem](https://viem.sh), reads the supply from every attestor
with `fetch`, and prints both with the reserve/supply ratio and a backing status.

## How the two sides are produced

### Reserve: the bridge contract

The bridge contract `BitSafeEvmAssetBridge` locks ETH. A deposit sends ETH to the contract,
and a withdrawal pays ETH out of it.

The script reads the native ETH balance of the proxy address with `eth_getBalance` at a pinned
block. The balance is the reserve. It does not depend on any counter inside the contract, so a
verifier can confirm it on any block explorer. The proxy address is in `src/utils/config.ts`.

### Supply: the attestor network

Attestor nodes run by independent operators each index the Canton ledger. A node counts a
holding toward the supply only when its instrument is `BETH` and the registrar party issued and
signed it. Each node serves its own figure on a public HTTP endpoint. BitSafe shares the list of
endpoint URLs with you directly. The URLs are not part of this repository.

Response when ready:

```json
{ "status": "ready", "total_supply_beth": "0.0100000000", "last_updated": "2026-10-01T12:26:00+00:00" }
```

`total_supply_beth` is a decimal string in whole BETH with up to 10 places. 1 BETH = 1 ETH = 1e18 wei.
While a node still builds its index it answers `{ "status": "not_yet_calculated", ... }`.

The script does not aggregate the attestor values. It prints every node's answer, so the
consumer applies its own quorum rule. The nodes read the same ledger, so healthy nodes return
the same value. A node that returns a different value, or no value, is stale or faulty.

## Run it

Requirements: Node 22.9 or newer.

1. Install dependencies.

   ```sh
   npm install
   ```

2. Create `.env` from the example and fill in both variables.

   ```sh
   cp .env.example .env
   ```

   `ETH_RPC_URL` is your Ethereum mainnet RPC endpoint. `ATTESTOR_SUPPLY_URLS` is the
   comma-separated list of attestor supply URLs that BitSafe gave you. `npm start` loads `.env`
   on its own. You can also export both variables in your shell instead.

3. Run the check.

   ```sh
   npm start
   ```

   Add `--json` for one machine-readable object:

   ```sh
   npm start -- --json
   ```

4. Run the tests and the type check.

   ```sh
   npm test
   npm run typecheck
   ```

## Output

The default report shows the reserve, then one block per attestor with its supply, the
`reserve/supply` ratio and a status:

| Status | Meaning |
| --- | --- |
| `fully_backed` | reserve equals supply exactly |
| `over_backed` | reserve is larger than supply, for example a deposit that is locked but not yet minted |
| `under_backed` | reserve is smaller than supply |

A final line says whether all answering attestors agree.

The `--json` object has the same data: `reserve` with `balanceWei` and `blockNumber`,
an `attestors` array with one entry per node, and `attestorsAgree`.

## Configuration

`src/utils/config.ts` holds the fixed values:

| Constant | Value |
| --- | --- |
| `BETH_BRIDGE_ADDRESS` | `0xb5d425d678B10949dD0f7bB0dd0427C47451D57E` (Ethereum mainnet, proxy) |
| `BETH_REGISTRAR_PARTY` | `beth-network::1220704c3cebc23916785557ebe79a5c7f68d034890a5b15690ea7ce050c7d463075` |
| `REQUEST_TIMEOUT_MS` | per-attestor timeout |

Two environment variables complete the setup:

| Variable | Value |
| --- | --- |
| `ETH_RPC_URL` | Ethereum mainnet JSON-RPC endpoint |
| `ATTESTOR_SUPPLY_URLS` | comma-separated full URLs of the attestor supply endpoints |

## Layout

```
src/index.ts            CLI entry point
src/utils/config.ts     constants: contract, registrar party, env var parsing
src/utils/reserve.ts    ETH balance of the bridge via viem
src/utils/supply.ts     fan-out to attestor supply endpoints via fetch
src/utils/units.ts      exact BETH <-> wei conversion with bigint
src/utils/compare.ts    ratio and backing status
test/                   unit tests (node:test); only fetch is mocked
```
