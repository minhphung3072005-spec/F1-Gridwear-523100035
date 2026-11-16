import assert from "node:assert/strict";
import { describe, it } from "node:test";

import express from "express";
import request from "supertest";

import { UserRole } from "../generated/prisma/enums.js";
import { errorMiddleware } from "./error.middleware.js";
import { requestIdMiddleware } from "./request-id.middleware.js";
import { authorize } from "./authorize.js";

function createAuthorizationTestApp(role: UserRole) {
  const app = express();
  app.use(requestIdMiddleware);
  app.use((request, _response, next) => {
    request.auth = { userId: "test-user", role };
    next();
  });
  app.get("/admin", authorize(UserRole.ADMIN), (_request, response) => {
    response.status(204).send();
  });
  app.use(errorMiddleware);
  return app;
}

describe("authorize middleware", () => {
  it("allows an admin role", async () => {
    await request(createAuthorizationTestApp(UserRole.ADMIN)).get("/admin").expect(204);
  });

  it("rejects a customer role", async () => {
    const response = await request(createAuthorizationTestApp(UserRole.CUSTOMER))
      .get("/admin")
      .expect(403);

    assert.equal(response.body.code, "FORBIDDEN");
  });
});
