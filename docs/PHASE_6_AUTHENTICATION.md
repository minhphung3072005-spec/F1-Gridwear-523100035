# PHASE 6 - AUTHENTICATION

## Scope

Phase 6 implements:

- Register customer.
- Login.
- Refresh-token rotation.
- Logout current session.
- Get current user.
- Access-token authentication middleware.
- Role authorization middleware.
- Password hashing and auth-specific rate limits.

## Endpoints

| Method | Endpoint | Authentication | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Public | Create customer, cart and session |
| POST | `/api/v1/auth/login` | Public | Validate credentials and create session |
| POST | `/api/v1/auth/refresh` | Refresh cookie | Rotate refresh token and return new access token |
| POST | `/api/v1/auth/logout` | Refresh cookie optional | Revoke current session and clear cookie |
| GET | `/api/v1/auth/me` | Bearer access token | Return current active user |

## Files

```text
backend/src/
  middleware/
    authenticate.ts
    authorize.ts
    authorize.test.ts
  modules/auth/
    auth.controller.ts
    auth.routes.ts
    auth.schema.ts
    auth.service.ts
    auth.types.ts
    auth.utils.test.ts
  utils/
    jwt.ts
    password.ts
    token-hash.ts
```

## Token Strategy

- Access token: HS256 JWT, 15 minutes, sent in `Authorization: Bearer`.
- Refresh token: HS256 JWT, 7 days, sent only in `HttpOnly` cookie.
- Access and refresh use different secrets.
- Claims validate algorithm, issuer, audience, type and expiration.
- Database stores only SHA-256 refresh-token hashes.
- Access token contains `tokenVersion`; middleware compares it with the current user.
- Frontend never receives password hash or refresh token in JSON.

Refresh cookie settings:

```text
HttpOnly=true
Secure=true in production
SameSite=Lax
Path=/api/v1/auth
Max-Age=7 days
```

## Refresh Rotation

1. Verify JWT signature and claims.
2. Hash presented token and find `RefreshSession`.
3. Validate `jti`, family, expiry, user status and token version.
4. Create a new session and conditionally revoke the old session in one transaction.
5. Link old session through `replacedById`.
6. Return a new access token and replace the cookie.

If a rotated token is reused, every active session in that token family is revoked. Two concurrent refreshes can only produce one committed replacement because the old session is updated with `revokedAt: null` as a condition.

## Password Rules

- 8-72 characters.
- At least one letter and one number.
- bcrypt cost comes from `BCRYPT_ROUNDS`, default 12.
- Login returns the same `INVALID_CREDENTIALS` response for unknown email and wrong password.
- Email is trimmed and normalized to lowercase.

## Authorization

`authenticate` verifies the token, loads the current database user, checks active/deleted status and token version, then attaches:

```ts
request.auth = { userId, role };
```

`authorize(UserRole.ADMIN)` runs after authentication and returns `403 FORBIDDEN` for non-admin users. Role is taken from the current database user, not trusted from frontend state.

## Error Codes

| Code | HTTP |
|---|---:|
| `VALIDATION_ERROR` | 400 |
| `INVALID_CREDENTIALS` | 401 |
| `AUTHENTICATION_REQUIRED` | 401 |
| `ACCESS_TOKEN_EXPIRED` | 401 |
| `INVALID_ACCESS_TOKEN` | 401 |
| `REFRESH_TOKEN_INVALID` | 401 |
| `ACCOUNT_DISABLED` | 403 |
| `FORBIDDEN` | 403 |
| `EMAIL_ALREADY_EXISTS` | 409 |

## Environment

Phase 6 adds:

```text
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
JWT_ISSUER
JWT_AUDIENCE
ACCESS_TOKEN_TTL_SECONDS
REFRESH_TOKEN_TTL_SECONDS
REFRESH_COOKIE_NAME
BCRYPT_ROUNDS
```

The secrets in `.env` are development-only. Production secrets must be independently generated random values and supplied by the deployment secret manager.

## Verification Boundary

Unit/API tests cover bcrypt, JWT claims, token type isolation, token hashing, input validation, missing auth/cookie, and admin authorization.

MySQL Server 8.0.46 is configured locally and the authentication flow has also been verified against the real database:

- Customer registration creates the user, cart and refresh session.
- `GET /auth/me` accepts the issued access token.
- Refresh rotation returns a new valid access token.
- Logout revokes the session; reusing its refresh token returns HTTP 401.
- Seeded admin login returns the `ADMIN` role.

After integration verification, the reset seed was rerun so the development database is back to its documented baseline.
