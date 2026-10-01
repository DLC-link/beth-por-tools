import assert from "node:assert/strict";
import { test } from "node:test";
import { parseAttestorUrls } from "../src/utils/config.js";
import { fetchAllSupplies } from "../src/utils/supply.js";

const urls = ["http://a.test/supply", "http://b.test/supply", "http://c.test/supply", "http://d.test/supply"];

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const fakeFetch: typeof fetch = async (input) => {
  const url = String(input);
  if (url.startsWith("http://a.test"))
    return jsonResponse(200, { status: "ready", total_supply_beth: "0.0100000000", last_updated: "t1" });
  if (url.startsWith("http://b.test"))
    return jsonResponse(200, { status: "ready", total_supply_beth: "0.0200000000", last_updated: "t2" });
  if (url.startsWith("http://c.test"))
    return jsonResponse(200, { status: "not_yet_calculated", message: "still building" });
  return new Response("Not Found", { status: 404, statusText: "Not Found" });
};

test("fetchAllSupplies returns one result per URL in input order", async () => {
  const results = await fetchAllSupplies(urls, fakeFetch);
  assert.deepEqual(
    results.map((r) => r.url),
    urls,
  );

  const [a, b, c, d] = results;
  assert.ok(a.ok && a.totalSupplyWei === 10_000_000_000_000_000n && a.lastUpdated === "t1");
  assert.ok(b.ok && b.totalSupplyBeth === "0.0200000000");
  assert.ok(!c.ok && c.error === "still building");
  assert.ok(!d.ok && d.error === "HTTP 404 Not Found");
});

test("a network error becomes a per-attestor error, not an exception", async () => {
  const failing: typeof fetch = async () => {
    throw new Error("connect ECONNREFUSED");
  };
  const [r] = await fetchAllSupplies([urls[0]], failing);
  assert.ok(!r.ok && r.error.includes("ECONNREFUSED"));
});

test("parseAttestorUrls splits on commas and drops blanks", () => {
  assert.deepEqual(parseAttestorUrls(" http://a/x , http://b/y,,"), ["http://a/x", "http://b/y"]);
  assert.deepEqual(parseAttestorUrls(undefined), []);
  assert.deepEqual(parseAttestorUrls(""), []);
});
