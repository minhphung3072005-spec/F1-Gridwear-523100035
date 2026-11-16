# PHASE 9 - CART

## Scope

Phase 9 implements the authenticated customer cart:

- Fetch the current cart and calculated summary.
- Add a variant or increment its existing quantity.
- Replace an item quantity.
- Remove one item or clear the cart.
- Merge a guest cart after login.
- Validate product, variant and stock at every write.
- Enforce item ownership through the authenticated user's cart.

Guest cart persistence in `localStorage` belongs to the frontend in Phase 12. The backend merge endpoint is ready for that flow.

## Endpoints

All endpoints require a valid access token with role `CUSTOMER`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/cart` | Cart items and current summary |
| POST | `/api/v1/cart/items` | Add a variant or increment quantity |
| PATCH | `/api/v1/cart/items/:itemId` | Replace item quantity |
| DELETE | `/api/v1/cart/items/:itemId` | Remove an owned item |
| DELETE | `/api/v1/cart/items` | Clear the current cart |
| POST | `/api/v1/cart/merge` | Atomically merge guest items |

Add item body:

```json
{
  "variantId": "variant-id",
  "quantity": 2
}
```

Guest merge body:

```json
{
  "items": [
    { "variantId": "variant-id-1", "quantity": 2 },
    { "variantId": "variant-id-2", "quantity": 1 }
  ]
}
```

## Business Rules

- Quantity must be an integer from 1 to 99.
- The product and variant must both be active and not soft-deleted.
- Add and merge sum the incoming quantity with the current server quantity.
- The resulting quantity cannot exceed current variant stock.
- Duplicate variant IDs in one merge request are rejected.
- Merge is atomic: one invalid or insufficient-stock item rolls back every change.
- A user can only update or remove items from their own cart.
- Admin accounts cannot use customer cart routes.
- Cart operations do not reserve or decrement inventory.
- Checkout in Phase 10 must validate stock again inside its database transaction.

## Price Trust Boundary

The API does not accept price, product name, image, subtotal, discount, shipping or total from the client. It reloads the current catalog data and applies this price priority:

```text
variant sale price
-> variant regular price
-> product sale price
-> product base price
```

Each response includes `unitPrice`, `lineTotal`, variant stock, size, color, product data and primary image.

Cart summary:

```json
{
  "distinctItems": 1,
  "itemCount": 2,
  "subtotal": 2380000,
  "discount": 0,
  "shipping": 0,
  "total": 2380000,
  "hasUnavailableItems": false
}
```

Coupon discount and shipping calculation are finalized during checkout in Phase 10. Cart values are previews only.

## Availability

Reading a cart does not silently delete stale items. Every item contains:

- `isAvailable`.
- `availabilityCode`, either `VARIANT_UNAVAILABLE`, `INSUFFICIENT_STOCK` or `null`.
- Current stock and current price.

This lets the frontend clearly explain catalog or inventory changes before checkout.

## Concurrency

Add, update and merge compare the quantity read at the start of the transaction with the quantity being updated. A concurrent modification returns `409 CART_CONFLICT` instead of silently overwriting another request.

## Files

```text
backend/src/modules/cart/
  cart.controller.ts
  cart.routes.ts
  cart.schema.ts
  cart.schema.test.ts
  cart.service.ts
```

## Verification

- Strict TypeScript typecheck: pass.
- Production build: pass.
- Automated tests: 33/33 pass.
- Customer cart add flow: quantity `0 -> 2`: pass.
- Repeated add: quantity `2 -> 3`: pass.
- Quantity update: `3 -> 4`: pass.
- Quantity above Ferrari Red/M stock 10 returns `409 INSUFFICIENT_STOCK`: pass.
- Guest merge: quantity `4 + 2 -> 6`: pass.
- Another customer deleting the item returns 404: pass.
- Admin opening a customer cart returns 403: pass.
- Item deletion and final empty cart: pass.
- Development seed reset after integration testing: pass.
