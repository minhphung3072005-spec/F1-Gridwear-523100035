# Phase 14 - Testing va Test Cases

## Muc tieu

Kiem tra validation, authentication, authorization, nghiep vu gio hang, checkout, inventory, order state machine, dashboard, review va giao dien responsive.

## Ket qua tu dong

- Backend: 55/55 test dat, 13 test suites.
- Backend va frontend production build: dat.
- Production dependency audit: 0 vulnerability.
- Browser QA: desktop 1440x900 va mobile 390x844.

## Test cases chinh

| ID | Nhom | Tinh huong | Ket qua mong doi |
|---|---|---|---|
| TC01 | Auth | Dang ky email hop le | Tao customer, tra access token va refresh cookie |
| TC02 | Auth | Mat khau yeu | HTTP 400, `VALIDATION_ERROR` |
| TC03 | Auth | Dang nhap sai | Loi chung, khong tiet lo email ton tai |
| TC04 | Auth | Access token het han | HTTP 401, `ACCESS_TOKEN_EXPIRED` |
| TC05 | Auth | Customer truy cap `/admin/*` | HTTP 403 |
| TC06 | Catalog | Tim theo ten, brand, category, SKU | Tra dung ket qua va pagination |
| TC07 | Catalog | `minPrice > maxPrice` | HTTP 400 |
| TC08 | Product | Sale price >= base price | Tu choi validation |
| TC09 | Variant | SKU trung | HTTP 409 |
| TC10 | Variant | Trung to hop size/color | Tu choi validation |
| TC11 | Cart | Them variant hop le | Tang quantity va tinh dung line total |
| TC12 | Cart | Quantity ngoai 1-99 | HTTP 400 |
| TC13 | Cart | Merge guest cart | Gop quantity, khong tao dong trung |
| TC14 | Coupon | Coupon het han | `COUPON_EXPIRED` |
| TC15 | Coupon | Chua dat don toi thieu | `COUPON_MINIMUM_NOT_MET` |
| TC16 | Coupon | PERCENT > 100 | Tu choi validation |
| TC17 | Checkout | Gio rong | `CART_EMPTY` |
| TC18 | Checkout | Thieu stock | HTTP 409, khong tao order |
| TC19 | Checkout | Idempotency key lap cung payload | Tra lai order cu, khong tru stock hai lan |
| TC20 | Checkout | Idempotency key lap khac payload | HTTP 409 |
| TC21 | Inventory | Checkout thanh cong | Stock giam atomically, tao `SALE` transaction |
| TC22 | Inventory | Huy don hop le | Hoan stock mot lan, tao `CANCEL_RETURN` |
| TC23 | Inventory | Dieu chinh am qua stock | Tu choi, stock khong am |
| TC24 | Order | `PENDING -> CONFIRMED` | Thanh cong va luu status history |
| TC25 | Order | `PENDING -> DELIVERED` | HTTP 409, invalid transition |
| TC26 | Order | Delivered COD | Payment `PAID`, co `deliveredAt` |
| TC27 | Dashboard | Revenue | Chi tinh order delivered, khong refunded |
| TC28 | Dashboard | Ngay khong co du lieu | Timeline zero-fill dung |
| TC29 | Review | Review don chua giao | `REVIEW_NOT_ALLOWED` |
| TC30 | Review | Review lan hai cung product | `REVIEW_ALREADY_EXISTS` |
| TC31 | Review | Rating ngoai 1-5 | HTTP 400 |
| TC32 | Review | Admin duyet | Review hien thi tren product detail |
| TC33 | Customer | Admin khoa tai khoan | Tang tokenVersion va revoke refresh session |
| TC34 | Security | Route bao ve khong token | HTTP 401 chuan |
| TC35 | UI | Mobile 390x844 | Sidebar overlay, table scroll, modal khong tran |
| TC36 | UI | Desktop 1440x900 | Dashboard, chart va table khong overlap |

## File test tu dong

```text
backend/src/app.test.ts
backend/src/middleware/authorize.test.ts
backend/src/modules/auth/auth.utils.test.ts
backend/src/modules/cart/cart.schema.test.ts
backend/src/modules/coupons/admin-coupon.schema.test.ts
backend/src/modules/customers/customer.schema.test.ts
backend/src/modules/dashboard/dashboard.schema.test.ts
backend/src/modules/inventory/inventory.schema.test.ts
backend/src/modules/orders/order.schema.test.ts
backend/src/modules/products/product-image.schema.test.ts
backend/src/modules/products/product.schema.test.ts
backend/src/modules/reviews/review.schema.test.ts
backend/src/modules/variants/variant.schema.test.ts
```

## Chay test

```powershell
cd backend
npm test
```

Smoke script checkout co thay doi database, vi vay chi chay tren database demo co the reset:

```powershell
npm run prisma:seed
npx tsx scripts/phase10-smoke.ts
npx tsx scripts/phase11-smoke.ts
```
