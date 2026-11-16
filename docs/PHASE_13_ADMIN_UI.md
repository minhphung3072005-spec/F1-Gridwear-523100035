# Phase 13 - Admin UI

## Muc tieu

Phase 13 cung cap khu vuc quan tri responsive tai `/admin`, su dung du lieu that tu backend va bao ve bang JWT + role `ADMIN`.

## Man hinh da trien khai

- Dashboard: KPI doanh thu, don hang, khach hang, san pham, ton kho; bo loc thoi gian; bieu do doanh thu, don hang, trang thai va bang xep hang.
- Products: tim kiem, loc trang thai, phan trang, tao/sua/xoa, xem anh va SKU, them anh bang URL, them variant.
- Categories va Brands: CRUD, tim kiem, phan trang, trang thai hoat dong.
- Inventory: tong quan ton kho, loc theo muc ton, dieu chinh stock va xem lich su giao dich.
- Orders: tim kiem, loc, xem chi tiet va chuyen trang thai theo state machine.
- Customers: tim kiem, thong ke lien quan va khoa/mo tai khoan.
- Reviews: loc, duyet, tu choi, an va xoa.
- Coupons: CRUD, bat/tat, gioi han su dung va thoi gian hieu luc.

## Backend bo sung

- `GET /api/v1/admin/customers`
- `GET /api/v1/admin/customers/:customerId`
- `PATCH /api/v1/admin/customers/:customerId/status`
- `GET /api/v1/admin/reviews`
- `PATCH /api/v1/admin/reviews/:reviewId/status`
- `DELETE /api/v1/admin/reviews/:reviewId`
- CRUD `/api/v1/admin/coupons`
- `POST /api/v1/admin/products/:productId/images`
- `DELETE /api/v1/admin/products/:productId/images/:imageId`

Tat ca route admin moi deu dung `authenticate` va `authorize(UserRole.ADMIN)`. Xoa review/coupon va khoa customer tuan theo soft-delete/revoke session; anh chinh duoc cap nhat trong transaction.

## Cau truc frontend

```text
frontend/src/
|-- components/admin/
|   |-- admin-layout.tsx
|   `-- admin-ui.tsx
|-- pages/admin/
|   |-- dashboard-page.tsx
|   |-- products-page.tsx
|   |-- taxonomy-page.tsx
|   |-- inventory-page.tsx
|   |-- orders-page.tsx
|   |-- customers-page.tsx
|   |-- reviews-page.tsx
|   `-- coupons-page.tsx
|-- services/admin.ts
`-- types/admin.ts
```

## Tai khoan demo

```text
Email: admin@f1store.com
Password: Admin@123
```

Chi su dung tai khoan tren trong moi truong development/demo.

## Kiem tra

- Backend build: dat.
- Frontend production build: dat.
- Backend tests: 43/43 dat.
- QA browser desktop 1440x900: dat.
- QA responsive mobile 390x844: dat.
- 9 route sidebar tai du lieu that, khong co console error.
- Form anh va SKU duoc kiem tra hien thi, khong ghi du lieu QA vao database.

## Chay ung dung

```powershell
cd backend
npm start

cd ../frontend
npm run dev -- --port 3000
```

Mo `http://localhost:3000/login`, dang nhap bang tai khoan admin va truy cap `http://localhost:3000/admin`.
