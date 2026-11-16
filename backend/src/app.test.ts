import assert from "node:assert/strict";
import { before, describe, it } from "node:test";

import type { Express } from "express";
import request from "supertest";

let app: Express;

before(async () => {
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = "mysql://root:password@localhost:3306/f1_fashion_store_test";
  process.env.FRONTEND_URL = "http://localhost:3000";
  process.env.RATE_LIMIT_MAX = "1000";

  const { createApp } = await import("./app.js");
  app = createApp();
});

describe("backend application", () => {
  it("returns a healthy response", async () => {
    const response = await request(app).get("/api/v1/health").expect(200);

    assert.equal(response.body.success, true);
    assert.equal(response.body.data.status, "ok");
    assert.equal(response.body.data.service, "f1-fashion-store-api");
    const requestId = response.headers["x-request-id"];
    assert.equal(typeof requestId, "string");
    assert.match(requestId as string, /.+/);
  });

  it("returns the standard error shape for unknown routes", async () => {
    const response = await request(app).get("/api/v1/unknown").expect(404);

    assert.equal(response.body.success, false);
    assert.equal(response.body.code, "ROUTE_NOT_FOUND");
    assert.ok(Array.isArray(response.body.errors));
    assert.match(response.body.requestId, /.+/);
  });

  it("uses an incoming request id when it is valid", async () => {
    const response = await request(app)
      .get("/api/v1/health")
      .set("X-Request-ID", "phase-5-test-request")
      .expect(200);

    assert.equal(response.headers["x-request-id"], "phase-5-test-request");
  });

  it("rejects a protected route without an access token", async () => {
    const response = await request(app).get("/api/v1/auth/me").expect(401);

    assert.equal(response.body.success, false);
    assert.equal(response.body.code, "AUTHENTICATION_REQUIRED");
  });

  it("protects catalog administration routes", async () => {
    const response = await request(app).get("/api/v1/admin/products").expect(401);

    assert.equal(response.body.success, false);
    assert.equal(response.body.code, "AUTHENTICATION_REQUIRED");
  });

  it("protects inventory administration routes", async () => {
    const response = await request(app).get("/api/v1/admin/inventory").expect(401);

    assert.equal(response.body.code, "AUTHENTICATION_REQUIRED");
  });

  it("protects customer cart routes", async () => {
    const response = await request(app).get("/api/v1/cart").expect(401);

    assert.equal(response.body.code, "AUTHENTICATION_REQUIRED");
  });

  it("protects checkout and address routes", async () => {
    const [orders, addresses, coupons] = await Promise.all([
      request(app).get("/api/v1/orders"),
      request(app).get("/api/v1/addresses"),
      request(app).post("/api/v1/coupons/validate").send({ code: "RACE10" }),
    ]);
    assert.equal(orders.status, 401);
    assert.equal(addresses.status, 401);
    assert.equal(coupons.status, 401);
  });

  it("protects order administration routes", async () => {
    const response = await request(app).get("/api/v1/admin/orders").expect(401);
    assert.equal(response.body.code, "AUTHENTICATION_REQUIRED");
  });

  it("protects dashboard administration routes", async () => {
    const response = await request(app).get("/api/v1/admin/dashboard/summary").expect(401);
    assert.equal(response.body.code, "AUTHENTICATION_REQUIRED");
  });

  it("protects customer, review and coupon administration routes", async () => {
    const responses = await Promise.all([
      request(app).get("/api/v1/admin/customers"),
      request(app).get("/api/v1/admin/reviews"),
      request(app).get("/api/v1/admin/coupons"),
    ]);
    for (const response of responses) {
      assert.equal(response.status, 401);
      assert.equal(response.body.code, "AUTHENTICATION_REQUIRED");
    }
  });

  it("protects customer review submission", async () => {
    const response = await request(app).post("/api/v1/reviews").send({ orderItemId: "item", rating: 5 }).expect(401);
    assert.equal(response.body.code, "AUTHENTICATION_REQUIRED");
  });

  it("validates query parameters on Express 5 without mutating its query getter", async () => {
    const response = await request(app).get("/api/v1/products?page=0").expect(400);

    assert.equal(response.body.code, "VALIDATION_ERROR");
    assert.equal(response.body.errors[0].field, "page");
  });

  it("distinguishes an expired access token", async () => {
    const [{ default: jwt }, { env }, { UserRole }] = await Promise.all([
      import("jsonwebtoken"),
      import("./config/env.js"),
      import("./generated/prisma/enums.js"),
    ]);
    const expiredToken = jwt.sign(
      { role: UserRole.CUSTOMER, tokenVersion: 0, type: "access" },
      env.JWT_ACCESS_SECRET,
      {
        algorithm: "HS256",
        subject: "expired-user",
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
        expiresIn: -1,
      },
    );
    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${expiredToken}`)
      .expect(401);

    assert.equal(response.body.code, "ACCESS_TOKEN_EXPIRED");
  });

  it("validates registration input before accessing the database", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({ fullName: "A", email: "invalid-email", password: "weak" })
      .expect(400);

    assert.equal(response.body.code, "VALIDATION_ERROR");
    assert.ok(response.body.errors.length >= 3);
  });

  it("rejects refresh requests without the HttpOnly cookie", async () => {
    const response = await request(app).post("/api/v1/auth/refresh").expect(401);

    assert.equal(response.body.code, "REFRESH_TOKEN_INVALID");
  });
});
