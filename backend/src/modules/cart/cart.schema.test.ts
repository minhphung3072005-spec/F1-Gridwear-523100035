import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cartItemCreateSchema, cartMergeSchema } from "./cart.schema.js";
import { effectiveUnitPrice } from "./cart.service.js";

describe("cart validation and pricing", () => {
  it("accepts quantities from 1 to 99", () => {
    assert.equal(cartItemCreateSchema.safeParse({ variantId: "variant_1", quantity: 1 }).success, true);
    assert.equal(cartItemCreateSchema.safeParse({ variantId: "variant_1", quantity: 0 }).success, false);
    assert.equal(cartItemCreateSchema.safeParse({ variantId: "variant_1", quantity: 100 }).success, false);
  });

  it("rejects duplicate guest variants", () => {
    assert.equal(
      cartMergeSchema.safeParse({
        items: [
          { variantId: "variant_1", quantity: 1 },
          { variantId: "variant_1", quantity: 2 },
        ],
      }).success,
      false,
    );
  });

  it("uses the most specific sale price", () => {
    assert.equal(
      effectiveUnitPrice({
        productBasePrice: 900000,
        productSalePrice: 850000,
        variantPrice: 920000,
        variantSalePrice: 800000,
      }),
      800000,
    );
    assert.equal(
      effectiveUnitPrice({
        productBasePrice: 900000,
        productSalePrice: 850000,
        variantPrice: null,
        variantSalePrice: null,
      }),
      850000,
    );
  });
});
