import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { customerListSchema, customerStatusSchema } from "./customer.schema.js";
describe("customer administration validation", () => {
  it("parses pagination and active filters", () => { const value = customerListSchema.parse({ page: "2", limit: "10", isActive: "true" }); assert.equal(value.page, 2); assert.equal(value.isActive, true); });
  it("requires a boolean account status", () => { assert.equal(customerStatusSchema.safeParse({ isActive: "false" }).success, false); });
});
