import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { variantBulkCreateSchema, variantCreateSchema } from "./variant.schema.js";

describe("variant validation", () => {
  it("normalizes SKU to uppercase", () => {
    const result = variantCreateSchema.parse({
      sizeId: "size_1",
      colorId: "color_1",
      sku: " fer-red-m ",
    });
    assert.equal(result.sku, "FER-RED-M");
    assert.equal(result.isActive, true);
  });

  it("rejects a sale price equal to the regular variant price", () => {
    assert.equal(
      variantCreateSchema.safeParse({
        sizeId: "size_1",
        colorId: "color_1",
        sku: "FER-RED-L",
        price: 500000,
        salePrice: 500000,
      }).success,
      false,
    );
  });

  it("rejects duplicate SKU and combinations in a bulk request", () => {
    const item = { sizeId: "size_1", colorId: "color_1", sku: "FER-RED-M" };
    assert.equal(variantBulkCreateSchema.safeParse({ items: [item, item] }).success, false);
  });
});
