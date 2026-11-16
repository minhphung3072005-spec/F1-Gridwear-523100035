import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizeSlug } from "../../utils/slug.js";
import {
  productCreateSchema,
  productListQuerySchema,
  productStatusSchema,
} from "./product.schema.js";

describe("catalog validation", () => {
  it("normalizes Vietnamese names into stable slugs", () => {
    assert.equal(normalizeSlug("  Áo Đua Ferrari 2026  "), "ao-dua-ferrari-2026");
  });

  it("parses product filters and removes duplicate values", () => {
    const result = productListQuerySchema.parse({
      brand: "ferrari, mclaren,ferrari",
      inStock: "true",
      page: "2",
      limit: "24",
    });

    assert.deepEqual(result.brand, ["ferrari", "mclaren"]);
    assert.equal(result.inStock, true);
    assert.equal(result.page, 2);
    assert.equal(result.limit, 24);
  });

  it("rejects an inverted price range", () => {
    assert.equal(productListQuerySchema.safeParse({ minPrice: "500", maxPrice: "100" }).success, false);
  });

  it("rejects sale prices that are not below the base price", () => {
    const result = productCreateSchema.safeParse({
      categoryId: "category_1",
      brandId: "brand_1",
      name: "Race Tee",
      basePrice: 500000,
      salePrice: 500000,
    });
    assert.equal(result.success, false);
  });

  it("requires a field in a product status patch", () => {
    assert.equal(productStatusSchema.safeParse({}).success, false);
    assert.equal(productStatusSchema.safeParse({ isFeatured: true }).success, true);
  });
});
