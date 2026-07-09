import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { advanceNextBillingDate, isDateOnOrBeforeToday } from "./billing-date";

describe("advanceNextBillingDate", () => {
  it("advances monthly dates within the same year", () => {
    assert.equal(advanceNextBillingDate("2026-01-15", "monthly"), "2026-02-15");
  });

  it("clamps Jan 31 monthly to the last day of February", () => {
    assert.equal(advanceNextBillingDate("2026-01-31", "monthly"), "2026-02-28");
    assert.equal(advanceNextBillingDate("2024-01-31", "monthly"), "2024-02-29");
  });

  it("rolls monthly dates into the next year", () => {
    assert.equal(advanceNextBillingDate("2026-12-15", "monthly"), "2027-01-15");
  });

  it("advances yearly dates and clamps Feb 29 on non-leap years", () => {
    assert.equal(advanceNextBillingDate("2024-02-29", "yearly"), "2025-02-28");
    assert.equal(advanceNextBillingDate("2025-03-31", "yearly"), "2026-03-31");
  });

  it("supports multi-month catch-up sequencing", () => {
    let current = "2026-01-31";
    current = advanceNextBillingDate(current, "monthly");
    assert.equal(current, "2026-02-28");
    current = advanceNextBillingDate(current, "monthly");
    assert.equal(current, "2026-03-28");
    current = advanceNextBillingDate(current, "monthly");
    assert.equal(current, "2026-04-28");
  });
});

describe("isDateOnOrBeforeToday", () => {
  it("compares dates in UTC", () => {
    const now = new Date("2026-07-09T12:00:00.000Z");
    assert.equal(isDateOnOrBeforeToday("2026-07-09", now), true);
    assert.equal(isDateOnOrBeforeToday("2026-07-08", now), true);
    assert.equal(isDateOnOrBeforeToday("2026-07-10", now), false);
  });
});
