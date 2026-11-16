import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { productImageCreateSchema } from "./product-image.schema.js";
describe("product image validation", () => {
  it("accepts HTTPS product images", () => { assert.equal(productImageCreateSchema.parse({ url: "https://images.example.com/f1.jpg" }).isPrimary, false); });
  it("rejects invalid image URLs", () => { assert.equal(productImageCreateSchema.safeParse({ url: "not-a-url" }).success, false); });
});
