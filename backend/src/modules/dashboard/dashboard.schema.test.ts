import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dashboardTimelineSchema, dashboardTopSchema } from "./dashboard.schema.js";
import { buildTimeline } from "./dashboard.service.js";

describe("dashboard validation and chart helpers", () => {
  it("applies safe chart and ranking defaults", () => {
    assert.equal(dashboardTimelineSchema.parse({}).groupBy, "month");
    assert.equal(dashboardTopSchema.parse({}).limit, 10);
  });

  it("rejects inverted and excessively large ranges", () => {
    assert.equal(dashboardTimelineSchema.safeParse({ from: "2026-10-10", to: "2026-01-01" }).success, false);
    assert.equal(dashboardTimelineSchema.safeParse({ from: "2020-01-01", to: "2026-01-01" }).success, false);
  });

  it("zero-fills missing daily chart periods", () => {
    const points = buildTimeline(
      { from: new Date("2026-10-01T00:00:00.000Z"), to: new Date("2026-10-03T23:59:59.999Z") },
      "day",
      [
        { date: new Date("2026-10-01T12:00:00.000Z"), revenue: 100, orders: 1 },
        { date: new Date("2026-10-03T12:00:00.000Z"), revenue: 250, orders: 2 },
      ],
    );
    assert.deepEqual(points, [
      { period: "2026-10-01", revenue: 100, orders: 1 },
      { period: "2026-10-02", revenue: 0, orders: 0 },
      { period: "2026-10-03", revenue: 250, orders: 2 },
    ]);
  });
});
