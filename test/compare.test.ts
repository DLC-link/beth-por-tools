import assert from "node:assert/strict";
import { test } from "node:test";
import { allAgree, compare, formatRatio } from "../src/utils/compare.js";

const ONE = 10n ** 18n;

test("equal values are fully backed with ratio 1", () => {
  assert.deepEqual(compare(ONE, ONE), { ratio: "1.000000", status: "fully_backed" });
});

test("larger reserve is over backed", () => {
  assert.deepEqual(compare(ONE * 3n, ONE * 2n), { ratio: "1.500000", status: "over_backed" });
});

test("smaller reserve is under backed, even by one wei", () => {
  const c = compare(ONE - 1n, ONE);
  assert.equal(c.status, "under_backed");
  assert.equal(c.ratio, "0.999999");
});

test("zero supply gives n/a ratio", () => {
  assert.equal(formatRatio(ONE, 0n), "n/a");
});

test("allAgree", () => {
  assert.equal(allAgree([1n, 1n, 1n]), true);
  assert.equal(allAgree([1n, 2n]), false);
  assert.equal(allAgree([]), true);
});
