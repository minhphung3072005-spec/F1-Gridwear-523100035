import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { inventoryAdjustmentSchema, inventoryImportSchema } from "./inventory.schema.js";
import { stockStatus } from "./inventory.service.js";

describe("inventory validation", () => {
  it("derives stock status at the required thresholds", () => {
    assert.equal(stockStatus(0), "OUT_OF_STOCK");
    assert.equal(stockStatus(1), "LOW_STOCK");
    assert.equal(stockStatus(5), "LOW_STOCK");
    assert.equal(stockStatus(6), "IN_STOCK");
  });

  it("requires a positive quantity for increment and decrement", () => {
    assert.equal(
      inventoryAdjustmentSchema.safeParse({ mode: "DECREMENT", quantity: 0, reason: "Stock check" }).success,
      false,
    );
    assert.equal(
      inventoryAdjustmentSchema.safeParse({ mode: "SET", quantity: 0, reason: "Stock check" }).success,
      true,
    );
  });

  it("rejects duplicate variants in an atomic import", () => {
    assert.equal(
      inventoryImportSchema.safeParse({
        items: [
          { variantId: "variant_1", quantity: 2 },
          { variantId: "variant_1", quantity: 3 },
        ],
        reason: "Warehouse receipt",
      }).success,
      false,
    );
  });
});
