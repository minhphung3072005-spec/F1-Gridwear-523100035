import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { UserRole } from "../../generated/prisma/enums.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../../utils/jwt.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import { hashToken } from "../../utils/token-hash.js";
import { loginSchema, registerSchema } from "./auth.schema.js";

describe("authentication utilities", () => {
  it("hashes and verifies a password", async () => {
    const password = "Customer@123";
    const passwordHash = await hashPassword(password);

    assert.notEqual(passwordHash, password);
    assert.equal(await verifyPassword(password, passwordHash), true);
    assert.equal(await verifyPassword("wrong-password", passwordHash), false);
  });

  it("signs and verifies typed access tokens", () => {
    const token = signAccessToken({
      userId: "user_test_1",
      role: UserRole.ADMIN,
      tokenVersion: 2,
    });
    const claims = verifyAccessToken(token);

    assert.equal(claims.sub, "user_test_1");
    assert.equal(claims.role, UserRole.ADMIN);
    assert.equal(claims.tokenVersion, 2);
    assert.equal(claims.type, "access");
    assert.ok(claims.exp);
  });

  it("signs refresh tokens with session and family IDs", () => {
    const token = signRefreshToken({
      userId: "user_test_2",
      sessionId: "session_test_2",
      familyId: "family_test_2",
      tokenVersion: 0,
    });
    const claims = verifyRefreshToken(token);

    assert.equal(claims.sub, "user_test_2");
    assert.equal(claims.jti, "session_test_2");
    assert.equal(claims.familyId, "family_test_2");
    assert.equal(hashToken(token).length, 64);
  });

  it("does not accept an access token as a refresh token", () => {
    const token = signAccessToken({
      userId: "user_test_3",
      role: UserRole.CUSTOMER,
      tokenVersion: 0,
    });

    assert.throws(() => verifyRefreshToken(token));
  });

  it("normalizes registration email and rejects weak passwords", () => {
    const parsed = registerSchema.parse({
      fullName: "Test Customer",
      email: "  TEST@EXAMPLE.COM ",
      password: "Strong123",
    });

    assert.equal(parsed.email, "test@example.com");
    assert.equal(
      registerSchema.safeParse({
        fullName: "Test Customer",
        email: "test@example.com",
        password: "password",
      }).success,
      false,
    );
  });

  it("keeps login errors generic by only validating input shape", () => {
    assert.equal(
      loginSchema.safeParse({ email: "user@example.com", password: "anything" }).success,
      true,
    );
  });
});
