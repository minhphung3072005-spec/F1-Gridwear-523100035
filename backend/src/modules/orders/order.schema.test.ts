import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OrderStatus, PaymentMethod } from "../../generated/prisma/enums.js";
import { checkoutSchema } from "./order.schema.js";
import { isValidOrderTransition } from "./order.service.js";

describe("order rules", () => {
  it("normalizes coupon codes and accepts COD checkout", () => {
    const input = checkoutSchema.parse({ shippingAddressId: "address-1", couponCode: " race10 ", paymentMethod: PaymentMethod.COD });
    assert.equal(input.couponCode, "RACE10");
  });
  it("rejects unsupported online payment methods for this phase", () => {
    assert.equal(checkoutSchema.safeParse({ shippingAddressId: "address-1", paymentMethod: "VNPAY" }).success, false);
  });
  it("enforces the order status state machine", () => {
    assert.equal(isValidOrderTransition(OrderStatus.PENDING, OrderStatus.CONFIRMED), true);
    assert.equal(isValidOrderTransition(OrderStatus.CONFIRMED, OrderStatus.CANCELLED), true);
    assert.equal(isValidOrderTransition(OrderStatus.SHIPPING, OrderStatus.DELIVERED), true);
    assert.equal(isValidOrderTransition(OrderStatus.DELIVERED, OrderStatus.CANCELLED), false);
  });
});
