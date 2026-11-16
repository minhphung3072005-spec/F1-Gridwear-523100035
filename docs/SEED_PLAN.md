# PHASE 4 - PRISMA AND SEED PLAN

## 1. Phase 4 Output

Phase 4 tao cac file:

```text
backend/
  prisma.config.ts
  prisma/
    schema.prisma
    seed.ts
    check-constraints.sql
docs/
  SEED_PLAN.md
```

Prisma target: stable Prisma ORM 7.x voi MySQL 8.0+. Database URL duoc dat trong `prisma.config.ts`, generator `prisma-client` output vao `backend/src/generated/prisma`.

## 2. Schema Coverage

- 12 enums.
- 24 models.
- Tat ca relation trong `docs/ERD.md`.
- Unique email, slug, SKU, product variant combination, cart item, favorite, review va idempotency key.
- Referential actions duoc khai bao ro tren moi relation.
- Index cho catalog, admin orders, dashboard, inventory va authentication.
- Money dung `Decimal(12,2)`, timestamp dung `DateTime(3)`.
- Database table/column map sang snake_case.

Prisma Schema khong bieu dien duoc CHECK constraint. File `check-constraints.sql` chua rule can them vao initial migration sau khi chay `prisma migrate dev --create-only`.

## 3. Seed Data Target

| Data | So luong |
|---|---:|
| Admin | 1 |
| Customers | 5 |
| Addresses | 5 |
| Carts | 5 |
| F1 brands | 7 |
| Categories | 7 |
| Sizes | 5 |
| Colors | 7 |
| Products | 25 |
| Product variants | 50 |
| Product images/assets | 25/25 |
| Coupons | 3 |
| Orders | 12 |
| Reviews | 5 |
| Favorites | 5 |
| Cart items | 3 |
| Initial inventory transactions | 50 |

Ngoai 50 initial IMPORT transactions, seed tao them SALE va CANCEL_RETURN transaction theo 12 order.

## 4. Demo Accounts

Chi dung trong development:

```text
Admin
Email: admin@f1store.com
Password: Admin@123

Customer example
Email: minhanh@example.com
Password: Customer@123
```

Password duoc bcrypt voi cost 12. Seed bi chan neu `NODE_ENV=production`.

## 5. Required Demo Inventory

Variant demo:

```text
Product: Ferrari Race Graphic Tee
Color: Racing Red
Size: M
SKU: FER-TEE-001-RACING-RED-M
Stock after seed: 10
```

12 order mau khong dung variant nay. Vi vay flow hoi dong co the them 2 san pham va quan sat stock `10 -> 8`, cung InventoryTransaction `SALE -2`.

## 6. Seed Order Distribution

| Status | So luong |
|---|---:|
| DELIVERED | 5 |
| SHIPPING | 2 |
| CONFIRMED | 2 |
| PENDING | 1 |
| CANCELLED | 2 |

Moi order co:

- OrderItem snapshot.
- OrderStatusHistory dung transition.
- COD Payment record.
- CheckoutIdempotency record.
- SALE InventoryTransaction.
- CANCEL_RETURN neu order CANCELLED.
- CouponRedemption neu ap dung coupon.

Dashboard co the tinh revenue tu 5 order DELIVERED va test cac queue status khac.

## 7. Seed Execution Order

1. Tu choi chay trong production.
2. Xoa development data theo thu tu child-to-parent.
3. Tao admin va 5 customers.
4. Tao address/cart nested theo customer.
5. Tao category, brand, size, color.
6. Tao asset, product, image, variant va initial IMPORT audit.
7. Tao coupon.
8. Tao 12 orders trong transaction rieng tung order.
9. Tao review tu delivered order item.
10. Tao favorite va cart item.
11. Count va in summary de verify.

Seed la reset seed, khong phai production fixture. Khong chay tren database co du lieu can giu.

## 8. Commands To Initialize Database

Phase 5 da tao `package.json`, dependencies va `.env`. Khi MySQL local da san sang:

```bash
npx prisma format
npx prisma validate
npx prisma migrate dev --name init --create-only
```

Them noi dung `prisma/check-constraints.sql` vao cuoi migration SQL vua tao, sau do:

```bash
npx prisma migrate dev
npx prisma generate
npx prisma db seed
```

Prisma ORM 7 chi seed khi goi explicit `prisma db seed`; migrate/reset khong tu dong seed.

## 9. Runtime Dependencies

```text
dependencies:
  @prisma/client
  @prisma/adapter-mariadb
  mariadb
  bcrypt
  dotenv

devDependencies:
  prisma
  tsx
  typescript
  @types/node
  @types/bcrypt
```

Backend Prisma singleton va seed script cung dung `src/config/database.ts` de tao `PrismaMariaDb` adapter, tranh duplicate cach parse `DATABASE_URL`.

## 10. Verification

Da chay:

```text
npx prisma@7.10.0 format --schema backend/prisma/schema.prisma
npx prisma@7.10.0 validate --schema backend/prisma/schema.prisma
```

Ket qua: schema hop le voi Prisma 7.10.0.

MySQL Server 8.0.46 da duoc cau hinh local. Initial migration `20261005072022_init` da duoc apply thanh cong, gom ca cac CHECK constraint trong `check-constraints.sql`.

Seed da chay thanh cong va duoc reset lai sau bai test tich hop auth. Ket qua baseline: 6 users, 25 products, 50 variants, 12 orders, 5 reviews, 64 inventory transactions va ton kho Ferrari Red/M bang 10.
