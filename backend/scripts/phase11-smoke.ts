import "dotenv/config";

import assert from "node:assert/strict";

import request from "supertest";

import { createApp } from "../src/app.js";
import { prisma } from "../src/config/prisma.js";

const app = createApp();

try {
  const adminLogin = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: "admin@f1store.com", password: "Admin@123" })
    .expect(200);
  const auth = { Authorization: `Bearer ${adminLogin.body.data.accessToken as string}` };

  const summaryResponse = await request(app).get("/api/v1/admin/dashboard/summary").set(auth).expect(200);
  const summary = summaryResponse.body.data.summary;
  assert.equal(summary.totalCustomers, 5);
  assert.equal(summary.totalProducts, 25);
  assert.ok(summary.totalRevenue > 0);
  assert.ok(summary.totalOrders >= 12);

  const timelineResponse = await request(app).get("/api/v1/admin/dashboard/revenue?groupBy=day").set(auth).expect(200);
  const points = timelineResponse.body.data.timeline.points as Array<{ period: string; revenue: number; orders: number }>;
  assert.equal(points.length, 30);
  assert.ok(points.some((point) => point.revenue > 0));
  assert.ok(points.some((point) => point.orders > 0));

  const distributionResponse = await request(app).get("/api/v1/admin/dashboard/orders").set(auth).expect(200);
  const distribution = distributionResponse.body.data.distribution;
  assert.equal(distribution.items.length, 5);
  assert.equal(distribution.total, summary.totalOrders);

  const topProductsResponse = await request(app).get("/api/v1/admin/dashboard/top-products?limit=3").set(auth).expect(200);
  const topCategoriesResponse = await request(app).get("/api/v1/admin/dashboard/top-categories?limit=3").set(auth).expect(200);
  assert.ok(topProductsResponse.body.data.items.length > 0);
  assert.ok(topProductsResponse.body.data.items.length <= 3);
  assert.ok(topCategoriesResponse.body.data.items.length > 0);
  assert.ok(topCategoriesResponse.body.data.items.length <= 3);

  const customerLogin = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: "minhanh@example.com", password: "Customer@123" })
    .expect(200);
  await request(app)
    .get("/api/v1/admin/dashboard/summary")
    .set("Authorization", `Bearer ${customerLogin.body.data.accessToken as string}`)
    .expect(403);

  console.info(JSON.stringify({
    success: true,
    totalRevenue: summary.totalRevenue,
    totalOrders: summary.totalOrders,
    totalCustomers: summary.totalCustomers,
    totalProducts: summary.totalProducts,
    timelinePoints: points.length,
    topProducts: topProductsResponse.body.data.items.length,
    topCategories: topCategoriesResponse.body.data.items.length,
  }));
} finally {
  await prisma.$disconnect();
}
