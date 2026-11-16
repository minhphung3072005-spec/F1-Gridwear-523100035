import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ReviewStatus } from "../../generated/prisma/enums.js";
import { reviewCreateSchema, reviewListSchema, reviewStatusSchema } from "./review.schema.js";

describe("review validation", () => {
  it("accepts a verified-purchase review payload", () => {
    const parsed = reviewCreateSchema.parse({ orderItemId: "order-item-1", rating: 5, title: "Rất tốt", content: "Sản phẩm đúng mô tả và chất lượng tốt." });
    assert.equal(parsed.rating, 5);
  });
  it("rejects ratings outside one to five", () => {
    assert.equal(reviewCreateSchema.safeParse({ orderItemId: "item", rating: 6, content: "Không hợp lệ" }).success, false);
  });
  it("parses moderation filters and status", () => {
    assert.equal(reviewListSchema.parse({ rating: "4", page: "2" }).rating, 4);
    assert.equal(reviewStatusSchema.parse({ status: ReviewStatus.APPROVED }).status, ReviewStatus.APPROVED);
  });
});
