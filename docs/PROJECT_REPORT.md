# Tom tat bao cao do an

## 1. Ten de tai

**Xay dung website ban thoi trang Formula 1 - F1 Fashion Store**

## 2. Ly do chon de tai

Thuong mai dien tu la bai toan co tinh ung dung cao, ket hop giao dien, API, co so du lieu, bao mat va xu ly nghiep vu. De tai thoi trang Formula 1 tao boi canh ro rang de xay dung he thong ban hang co variant theo mau/size va ton kho theo SKU.

## 3. Muc tieu

- Xay dung website mua hang truc tuyen hoan chinh.
- Quan ly san pham, bien the, kho va don hang chinh xac.
- Phan quyen customer/admin.
- Bao dam checkout va cap nhat ton kho co tinh nhat quan.
- Cung cap dashboard phuc vu quan tri.

## 4. Pham vi

He thong gom customer storefront va admin dashboard. Thanh toan demo dung COD. Du lieu anh quan ly bang URL. He thong chay local voi MySQL.

## 5. Tac nhan

- Customer: xem san pham, gio hang, checkout, theo doi don, review.
- Admin: quan ly catalog, inventory, order, customer, review, coupon va analytics.

## 6. Kien truc

Frontend React goi REST API Express. Express validate bang Zod, xu ly nghiep vu trong service, truy cap MySQL qua Prisma. Authentication dung JWT access/refresh token.

```text
Browser -> React/Vite -> REST API/Express -> Prisma -> MySQL
```

## 7. Cac module

Authentication, Products, Variants, Categories, Brands, Cart, Addresses, Coupons, Orders, Inventory, Reviews, Customers va Dashboard.

## 8. Nghiep vu noi bat

Checkout chay trong transaction: kiem tra cart, coupon va stock; tru stock; tao order/items/payment/history/inventory transaction; xoa cart. Huy don hoan stock/coupon mot lan. Order state machine chi cho phep cac transition hop le.

## 9. Bao mat

- Bcrypt hash password.
- JWT ngan han va refresh rotation.
- HttpOnly refresh cookie.
- Role authorization tren backend.
- Zod validation, rate limit, Helmet, CORS allowlist.
- Khong tra password hash/token trong API.

## 10. Kiem thu

55 automated tests bao phu validation, auth, role, cart, coupon, product, variant, inventory, order, dashboard va review. Production build va responsive browser QA deu dat.

## 11. Ket qua

San pham dap ung day du source frontend/backend, MySQL schema/migration/seed, REST API, website customer, admin dashboard, authentication, catalog, inventory, cart, checkout, order, review, coupon, analytics va tai lieu.

## 12. Han che va huong phat trien

- Tich hop VNPay/MoMo va webhook.
- Upload anh Cloudinary/S3.
- Dong bo wishlist vao database.
- Email xac nhan don va quen mat khau.
- Docker, CI/CD va deploy cloud.
- Mo rong integration/E2E test tren database rieng.

## 13. Ket luan

He thong giai quyet duoc quy trinh ban hang va van hanh kho co ban, co phan quyen, validation, transaction va giao dien responsive. Cau truc module cho phep tiep tuc mo rong ma khong thay doi toan bo kien truc.
