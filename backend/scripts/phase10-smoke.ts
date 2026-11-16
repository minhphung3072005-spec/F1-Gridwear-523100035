import "dotenv/config";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import request from "supertest";

import { createApp } from "../src/app.js";
import { prisma } from "../src/config/prisma.js";
import { InventoryTransactionType } from "../src/generated/prisma/enums.js";

const app = createApp();
const customerEmail = "minhanh@example.com";
const sku = "FER-TEE-001-RACING-RED-M";

try {
  const login = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: customerEmail, password: "Customer@123" })
    .expect(200);
  const token = login.body.data.accessToken as string;
  const auth = { Authorization: `Bearer ${token}` };

  const [variant, customer] = await Promise.all([
    prisma.productVariant.findUniqueOrThrow({ where: { sku }, select: { id: true, stock: true } }),
    prisma.user.findUniqueOrThrow({ where: { email: customerEmail }, include: { addresses: { where: { isDefault: true }, take: 1 } } }),
  ]);
  assert.equal(variant.stock, 10);
  const address = customer.addresses[0];
  assert.ok(address);

  await request(app).delete("/api/v1/cart/items").set(auth).expect(204);
  await request(app).post("/api/v1/cart/items").set(auth).send({ variantId: variant.id, quantity: 2 }).expect(201);

  const preview = await request(app).post("/api/v1/coupons/validate").set(auth).send({ code: "race10" }).expect(200);
  assert.equal(preview.body.data.preview.code, "RACE10");
  assert.equal(preview.body.data.preview.subtotal, 2_380_000);
  assert.equal(preview.body.data.preview.discount, 238_000);
  assert.equal(preview.body.data.preview.shippingFee, 0);

  const key = randomUUID();
  const body = { shippingAddressId: address.id, couponCode: "RACE10", paymentMethod: "COD", note: "Phase 10 smoke test" };
  const first = await request(app).post("/api/v1/orders").set(auth).set("Idempotency-Key", key).send(body).expect(201);
  const orderId = first.body.data.order.id as string;
  assert.equal(first.body.data.replayed, false);
  assert.equal(first.body.data.order.total, 2_142_000);
  assert.equal((await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock, 8);

  const replay = await request(app).post("/api/v1/orders").set(auth).set("Idempotency-Key", key).send(body).expect(200);
  assert.equal(replay.body.data.replayed, true);
  assert.equal(replay.body.data.order.id, orderId);
  assert.equal((await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock, 8);

  const mismatched = await request(app).post("/api/v1/orders").set(auth).set("Idempotency-Key", key).send({ ...body, note: "Different request" }).expect(409);
  assert.equal(mismatched.body.code, "IDEMPOTENCY_KEY_REUSED");
  await request(app).get(`/api/v1/orders/${orderId}`).set(auth).expect(200);

  await request(app).post(`/api/v1/orders/${orderId}/cancel`).set(auth).send({ reason: "Smoke test cancellation" }).expect(200);
  assert.equal((await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock, 10);
  const secondCancel = await request(app).post(`/api/v1/orders/${orderId}/cancel`).set(auth).send({ reason: "Second cancellation" }).expect(409);
  assert.equal(secondCancel.body.code, "ORDER_NOT_CANCELLABLE");

  const [sales, returns] = await Promise.all([
    prisma.inventoryTransaction.count({ where: { orderId, variantId: variant.id, type: InventoryTransactionType.SALE } }),
    prisma.inventoryTransaction.count({ where: { orderId, variantId: variant.id, type: InventoryTransactionType.CANCEL_RETURN } }),
  ]);
  assert.equal(sales, 1);
  assert.equal(returns, 1);
  console.info(JSON.stringify({ success: true, orderId, stockFlow: [10, 8, 8, 10], sales, returns }));
} finally {
  await prisma.$disconnect();
}
