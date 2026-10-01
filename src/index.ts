import { allAgree, compare } from "./utils/compare.js";
import { ATTESTOR_SUPPLY_URLS_VAR, BETH_REGISTRAR_PARTY, parseAttestorUrls } from "./utils/config.js";
import { createClient, fetchReserve } from "./utils/reserve.js";
import { fetchAllSupplies } from "./utils/supply.js";
import { weiToEth } from "./utils/units.js";

const json = process.argv.includes("--json");

const rpcUrl = process.env.ETH_RPC_URL;
if (!rpcUrl) {
  console.error("ETH_RPC_URL is not set. Copy .env.example to .env and fill it in.");
  process.exit(2);
}

const attestorUrls = parseAttestorUrls(process.env[ATTESTOR_SUPPLY_URLS_VAR]);
if (attestorUrls.length === 0) {
  console.error(`${ATTESTOR_SUPPLY_URLS_VAR} is not set. It must list the attestor supply URLs, comma-separated.`);
  process.exit(2);
}

const [reserve, supplies] = await Promise.all([
  fetchReserve(createClient(rpcUrl)),
  fetchAllSupplies(attestorUrls),
]);

const rows = supplies.map((s) =>
  s.ok ? { ...s, ...compare(reserve.balanceWei, s.totalSupplyWei) } : s,
);
const okValues = rows.flatMap((r) => (r.ok ? [r.totalSupplyWei] : []));
const agree = okValues.length > 0 && allAgree(okValues);

if (json) {
  console.log(
    JSON.stringify(
      {
        registrarParty: BETH_REGISTRAR_PARTY,
        reserve: {
          address: reserve.address,
          chainId: reserve.chainId,
          blockNumber: reserve.blockNumber.toString(),
          balanceWei: reserve.balanceWei.toString(),
          balanceEth: weiToEth(reserve.balanceWei),
        },
        attestors: rows.map((r) =>
          r.ok
            ? {
                url: r.url,
                totalSupplyBeth: r.totalSupplyBeth,
                totalSupplyWei: r.totalSupplyWei.toString(),
                lastUpdated: r.lastUpdated,
                ratio: r.ratio,
                status: r.status,
              }
            : { url: r.url, error: r.error },
        ),
        attestorsAgree: agree,
      },
      null,
      2,
    ),
  );
} else {
  console.log("BETH Proof of Reserve");
  console.log("");
  console.log("Reserve (Ethereum mainnet)");
  console.log(`  address       ${reserve.address}`);
  console.log(`  block         ${reserve.blockNumber}`);
  console.log(`  balance       ${weiToEth(reserve.balanceWei)} ETH`);
  console.log("");
  console.log("Supply (Canton mainnet, per attestor)");
  console.log(`  registrar     ${BETH_REGISTRAR_PARTY}`);
  rows.forEach((r, i) => {
    console.log("");
    console.log(`  attestor ${i + 1}  ${r.url}`);
    if (r.ok) {
      console.log(`    totalSupply    ${r.totalSupplyBeth} BETH`);
      console.log(`    lastUpdated    ${r.lastUpdated}`);
      console.log(`    reserve/supply ${r.ratio}  ${r.status}`);
    } else {
      console.log(`    error          ${r.error}`);
    }
  });
  console.log("");
  console.log(
    okValues.length === 0
      ? "No attestor returned a supply value."
      : agree
        ? `All ${okValues.length} answering attestors report the same supply.`
        : "Answering attestors disagree on the supply. Inspect the rows above.",
  );
}
