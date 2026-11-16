# PHASE 10 - ORDER AND CHECKOUT

## Scope

Phase 10 implements the authenticated COD checkout flow:

- Customer shipping-address CRUD and default-address selection.
- Coupon preview against the current server-side cart.
- Atomic order creation with product and address snapshots.
- Stock deduction and inventory ledger entries.
- UUID idempotency keys to prevent duplicate orders.
- Customer order history, detail and cancellation.
- Admin order listing, detail, status transitions and payment status updates.
- Atomic stock restoration and coupon release after cancellation.

## Customer Endpoints

All endpoints require an access token with role `CUSTOMER`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/addresses` | List the customer's addresses |
| POST | `/api/v1/addresses` | Create an address |
| PATCH | `/api/v1/addresses/:addressId` | Update an owned address |
| DELETE | `/api/v1/addresses/:addressId` | Delete an owned address |
| PATCH | `/api/v1/addresses/:addressId/default` | Select the default address |
| POST | `/api/v1/coupons/validate` | Preview a coupon against the cart |
| POST | `/api/v1/orders` | Checkout the current cart |
| GET | `/api/v1/orders` | Paginated order history |
| GET | `/api/v1/orders/:orderId` | Owned order detail |
| POST | `/api/v1/orders/:orderId/cancel` | Cancel a pending/confirmed order |

Checkout requires a UUID in the `Idempotency-Key` header:

```json
{
  "shippingAddressId": "address-id",
  "couponCode": "RACE10",
  "paymentMethod": "COD",
  "note": "Call before delivery"
}
```

Only COD is enabled in this phase. VNPAY and MOMO are reserved for a later payment integration.

## Admin Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/admin/orders` | Search/filter/paginate orders |
| GET | `/api/v1/admin/orders/:orderId` | Full order detail |
| PATCH | `/api/v1/admin/orders/:orderId/status` | Apply a valid status transition |
| PATCH | `/api/v1/admin/orders/:orderId/payment-status` | Update payment state |

Valid order transitions:

```text
PENDING -> CONFIRMED -> SHIPPING -> DELIVERED
PENDING -> CANCELLED
CONFIRMED -> CANCELLED
```

## Checkout Transaction

Checkout executes in one database transaction:

1. Validate or create the idempotency record.
2. Reload the owned address, cart, products and variants.
3. Recalculate trusted prices, coupon discount, shipping and total.
4. Create the order and immutable item/address snapshots.
5. Conditionally decrement each variant's stock.
6. Add one `SALE` inventory transaction per item.
7. Apply the coupon redemption and increment usage.
8. Create the initial status history and COD payment record.
9. Clear the cart and complete the idempotency record.

The server never accepts price or total values from the client. Shipping is free from VND 2,000,000; otherwise it is VND 50,000.

## Idempotency

- The key is unique per customer.
- Repeating the same key and payload returns the original order without changing stock.
- Reusing a key with different data returns `409 IDEMPOTENCY_KEY_REUSED`.
- A request already being processed returns `409 CHECKOUT_IN_PROGRESS`.

## Cancellation

Cancellation changes the status only when it is still `PENDING` or `CONFIRMED`. In the same transaction it:

- Restores every order item's stock.
- Adds one `CANCEL_RETURN` inventory transaction per item.
- Releases an applied coupon and decrements its used count.
- Marks a pending COD payment as failed.
- Records the actor, prior status and reason.

The conditional status update prevents stock from being restored twice.

## Verification

- Strict TypeScript typecheck: pass.
- Production build: pass.
- Automated tests: 38/38 pass.
- Coupon `RACE10` preview on two Ferrari Red/M items: subtotal 2,380,000; discount 238,000; shipping 0: pass.
- Checkout stock flow `10 -> 8`: pass.
- Same idempotency key returns the same order and stock remains 8: pass.
- Same key with a different payload returns 409: pass.
- Customer cancellation restores stock `8 -> 10`: pass.
- Repeated cancellation returns 409 and does not restore stock again: pass.
- Inventory ledger contains exactly one `SALE` and one `CANCEL_RETURN`: pass.

The smoke scenario is available at `backend/scripts/phase10-smoke.ts`.
