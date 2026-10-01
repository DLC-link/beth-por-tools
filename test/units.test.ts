import assert from "node:assert/strict";
import { test } from "node:test";
import { bethToWei, weiToEth } from "../src/utils/units.js";

test("bethToWei converts the attestor decimal string exactly", () => {
  assert.equal(bethToWei("0.0100000000"), 10_000_000_000_000_000n);
  assert.equal(bethToWei("1"), 10n ** 18n);
  assert.equal(bethToWei("123.4567891234"), 123_456_789_123_400_000_000n);
  assert.equal(bethToWei("0"), 0n);
});

test("bethToWei rejects malformed input", () => {
  assert.throws(() => bethToWei("1e5"));
  assert.throws(() => bethToWei("-1"));
  assert.throws(() => bethToWei(""));
});

test("weiToEth formats with 18 places", () => {
  assert.equal(weiToEth(10_000_000_000_000_000n), "0.010000000000000000");
  assert.equal(weiToEth(10n ** 18n), "1.000000000000000000");
});
