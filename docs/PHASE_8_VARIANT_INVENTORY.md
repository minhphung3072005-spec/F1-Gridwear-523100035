# PHASE 8 - PRODUCT VARIANT AND INVENTORY

## Scope

Phase 8 implements:

- Public size and color options.
- Admin CRUD/deactivation for sizes and colors.
- Admin single and bulk product variant creation.
- Admin variant update and deactivation.
- Inventory list with search, filters, pagination and status summary.
- Manual stock adjustment with `SET`, `INCREMENT` and `DECREMENT` modes.
- Atomic bulk stock import.
- Immutable inventory transaction history.
- Low-stock and out-of-stock classification.

## Endpoints

Public:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/sizes` | Active sizes |
| GET | `/api/v1/colors` | Active colors |

Admin size and color management:

| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/v1/admin/sizes` | List or create size |
| PUT/DELETE | `/api/v1/admin/sizes/:sizeId` | Replace or deactivate size |
| GET/POST | `/api/v1/admin/colors` | List or create color |
| PUT/DELETE | `/api/v1/admin/colors/:colorId` | Replace or deactivate color |

Admin variant management:

| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/v1/admin/products/:productId/variants` | List or create variant |
| POST | `/api/v1/admin/products/:productId/variants/bulk` | Create up to 100 variants |
| PUT/DELETE | `/api/v1/admin/variants/:variantId` | Replace or deactivate variant |

Admin inventory:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/admin/inventory` | Search/filter inventory |
| GET | `/api/v1/admin/inventory/:variantId/transactions` | Immutable stock history |
| PATCH | `/api/v1/admin/inventory/:variantId` | Manual stock adjustment |
| POST | `/api/v1/admin/inventory/imports` | Atomic multi-variant import |

Every admin endpoint requires a valid access token and role `ADMIN`.

## Variant Rules

- SKU is trimmed, normalized to uppercase and globally unique.
- A product can have only one variant for each size/color combination.
- New variants always start with stock `0`.
- Stock is not accepted by variant create or update endpoints.
- Size and color must exist and be active when assigning a variant.
- Variant sale price must be below the effective regular price.
- Deactivating the last active variant of an active product is rejected.
- Bulk creation rejects duplicate SKU or duplicate size/color pairs before writing.

## Inventory Rules

Derived stock statuses:

```text
OUT_OF_STOCK: stock = 0
LOW_STOCK:    1 <= stock <= 5
IN_STOCK:     stock > 5
```

Manual adjustment body:

```json
{
  "mode": "DECREMENT",
  "quantity": 2,
  "reason": "Physical stock recount"
}
```

- `SET` sets an absolute stock value.
- `INCREMENT` adds a positive quantity.
- `DECREMENT` subtracts only when enough stock exists.
- A no-op `SET` returns `409 STOCK_UNCHANGED` because inventory transactions cannot have a zero delta.
- Every successful manual change creates a `MANUAL_ADJUSTMENT` transaction with actor, delta, before, after and reason.
- Conditional updates compare the previously read stock, preventing lost updates.
- Stock can never become negative.

Bulk import body:

```json
{
  "items": [
    { "variantId": "variant-id", "quantity": 20 }
  ],
  "reference": "PO-2026-001",
  "reason": "October warehouse receipt"
}
```

Imports are atomic. Items are sorted by variant ID before update to reduce deadlock risk. One invalid or concurrent item rolls back the whole batch. Each item creates an `IMPORT` transaction under the same reference.

## Files

```text
backend/src/modules/
  variants/
    variant.controller.ts
    variant.routes.ts
    variant.schema.ts
    variant.schema.test.ts
    variant.service.ts
  inventory/
    inventory.controller.ts
    inventory.routes.ts
    inventory.schema.ts
    inventory.schema.test.ts
    inventory.service.ts
```

## Verification

- Strict TypeScript typecheck: pass.
- Production build: pass.
- Automated tests: 29/29 pass.
- Public size/color APIs against MySQL: pass.
- Admin size, color and variant create/list/deactivate lifecycle: pass.
- Ferrari Red/M manual adjustment: stock `10 -> 8`: pass.
- Attempt to decrement below zero returns HTTP 409: pass.
- Atomic import restores Ferrari Red/M stock `8 -> 10`: pass.
- Transaction history contains `MANUAL_ADJUSTMENT` and `IMPORT`: pass.
- Reset seed restores 6 users, 25 products, 50 variants, 12 orders and Ferrari Red/M stock 10: pass.
