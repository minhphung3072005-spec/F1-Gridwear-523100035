import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CouponType } from "../../generated/prisma/enums.js";
import { adminCouponCreateSchema, adminCouponListSchema } from "./admin-coupon.schema.js";

const validCoupon = { code: "race-20", type: CouponType.PERCENT, value: 20, minOrderValue: 500000, maxDiscount: 300000, startAt: "2026-01-01T00:00:00.000Z", endAt: "2026-12-31T00:00:00.000Z", usageLimit: 100, perUserLimit: 1, isActive: true };
describe("admin coupon validation", () => {
  it("normalizes coupon codes", () => { assert.equal(adminCouponCreateSchema.parse(validCoupon).code, "RACE-20"); });
  it("rejects percentages above one hundred", () => { assert.equal(adminCouponCreateSchema.safeParse({ ...validCoupon, value: 101 }).success, false); });
  it("rejects an inverted validity period", () => { assert.equal(adminCouponCreateSchema.safeParse({ ...validCoupon, startAt: validCoupon.endAt, endAt: validCoupon.startAt }).success, false); });
  it("parses the active list filter", () => { assert.equal(adminCouponListSchema.parse({ isActive: "false" }).isActive, false); });
});
