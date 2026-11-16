# PHASE 2 - REST API DESIGN

## 1. Muc Tieu

Tai lieu nay chot hop dong REST API cho F1 Fashion Store truoc khi thiet ke database va viet code. API duoc xay dung cho hai nhom giao dien:

- Storefront danh cho guest va customer.
- Admin dashboard danh cho tai khoan co role `ADMIN`.

Base URL development:

```text
http://localhost:5000/api/v1
```

Moi endpoint trong tai lieu mac dinh co prefix `/api/v1`. Version duoc dat trong URL de co the mo rong API ma khong lam hong frontend cu.

## 2. Kien Truc Backend Da Chot

Backend su dung modular monolith voi cac layer ro rang:

```text
HTTP Request
  -> Global middleware
  -> Module route
  -> Authentication/authorization middleware
  -> Validation middleware
  -> Controller
  -> Service
  -> Prisma repository access
  -> MySQL
  -> Response helper
```

Trach nhiem tung layer:

| Layer | Trach nhiem |
|---|---|
| Route | Khai bao method, path va middleware cua endpoint |
| Validator | Parse va validate params, query, body bang Zod |
| Controller | Nhan du lieu da validate, goi service, chon HTTP status |
| Service | Xu ly business rule va transaction |
| Prisma | Truy van MySQL, khong chua logic HTTP |
| Middleware | Auth, role, rate limit, upload, error handling |

Controller khong truy van Prisma truc tiep. Service khong doc `req` hoac ghi `res`.

## 3. Backend Modules

| Module | Pham vi |
|---|---|
| `auth` | Register, login, refresh, logout, forgot/reset password |
| `users` | Profile, customer management, role/status |
| `addresses` | Dia chi giao hang cua customer |
| `products` | Product catalog, search, filter, product detail |
| `categories` | Danh muc san pham |
| `brands` | Thuong hieu/doi dua F1 |
| `variants` | Bien the size, color, SKU, price, status |
| `inventory` | Ton kho hien tai va lich su bien dong |
| `cart` | Gio hang cua customer |
| `favorites` | Wishlist |
| `coupons` | Ma giam gia va validate coupon |
| `orders` | Checkout, customer order, admin order workflow |
| `payments` | Thong tin thanh toan, webhook trong giai doan mo rong |
| `reviews` | Danh gia san pham va moderation |
| `uploads` | Upload/xoa anh theo quyen admin |
| `dashboard` | KPI, chart va thong ke admin |
| `health` | Kiem tra tinh trang API va database |

## 4. Quy Uoc Chung

### 4.1 Content type

- JSON request: `Content-Type: application/json`.
- Upload anh: `Content-Type: multipart/form-data`.
- Response JSON dung UTF-8.

### 4.2 Authentication header

Endpoint can dang nhap su dung:

```http
Authorization: Bearer <access-token>
```

Refresh token chi duoc gui bang cookie `HttpOnly`, khong truyen trong query string va khong tra trong JSON body.

### 4.3 Success response

Response mot resource:

```json
{
  "success": true,
  "message": "Product fetched successfully",
  "data": {
    "id": "01J..."
  }
}
```

Response danh sach co phan trang:

```json
{
  "success": true,
  "message": "Products fetched successfully",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 12,
      "totalItems": 48,
      "totalPages": 4,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

### 4.4 Error response

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "email",
      "message": "Email is invalid"
    }
  ],
  "requestId": "req_01J..."
}
```

Trong production khong tra stack trace, SQL, token, password hash hoac chi tiet noi bo.

### 4.5 HTTP status

| Status | Su dung |
|---|---|
| `200 OK` | GET/PATCH/PUT thanh cong |
| `201 Created` | Tao resource thanh cong |
| `204 No Content` | Xoa resource hoac logout thanh cong va khong can body |
| `400 Bad Request` | Request sai nghia nghiep vu |
| `401 Unauthorized` | Thieu/sai/het han access token |
| `403 Forbidden` | Da dang nhap nhung khong du quyen |
| `404 Not Found` | Resource khong ton tai hoac khong thuoc user |
| `409 Conflict` | Email, slug, SKU trung; stock conflict; state conflict |
| `422 Unprocessable Entity` | Du lieu dung cu phap nhung vi pham business rule |
| `429 Too Many Requests` | Vuot rate limit |
| `500 Internal Server Error` | Loi khong du kien |

### 4.6 Error codes

| Code | Y nghia |
|---|---|
| `VALIDATION_ERROR` | Params/query/body khong hop le |
| `AUTHENTICATION_REQUIRED` | Chua dang nhap |
| `ACCESS_TOKEN_EXPIRED` | Access token het han, frontend co the refresh |
| `INVALID_CREDENTIALS` | Email hoac password sai |
| `REFRESH_TOKEN_INVALID` | Refresh token sai, bi thu hoi hoac het han |
| `FORBIDDEN` | Khong co quyen |
| `RESOURCE_NOT_FOUND` | Khong tim thay resource |
| `EMAIL_ALREADY_EXISTS` | Email da ton tai |
| `SLUG_ALREADY_EXISTS` | Slug da ton tai |
| `SKU_ALREADY_EXISTS` | SKU da ton tai |
| `INSUFFICIENT_STOCK` | Ton kho khong du |
| `CART_EMPTY` | Gio hang rong khi checkout |
| `COUPON_INVALID` | Coupon sai hoac khong ap dung duoc |
| `ORDER_STATUS_CONFLICT` | Chuyen trang thai order khong hop le |
| `DUPLICATE_REQUEST` | Idempotency key da duoc xu ly |
| `RATE_LIMIT_EXCEEDED` | Qua nhieu request |
| `INTERNAL_ERROR` | Loi he thong khong du kien |

### 4.7 Pagination, sort va filter

Quy uoc chung cho list endpoint:

```text
?page=1&limit=12&sortBy=createdAt&sortOrder=desc
```

- `page`: so nguyen tu 1, mac dinh 1.
- `limit`: 1-100; storefront mac dinh 12, admin mac dinh 20.
- `sortOrder`: `asc` hoac `desc`.
- Moi endpoint chi cho phep mot danh sach `sortBy` cu the de tranh truy van tuy y.
- Filter nhieu gia tri dung dau phay, vi du `sizes=S,M,L`.

### 4.8 ID, date va money

- ID public dung chuoi CUID/UUID, khong de lo ID tu tang.
- Date tra theo ISO 8601 UTC, vi du `2026-10-05T08:30:00.000Z`.
- Money trong API dung JSON number va database `DECIMAL(12,2)`; backend tinh bang decimal, khong tinh bang floating-point thuan.
- Currency giai doan dau la `VND`.

### 4.9 Soft delete

Product, category, brand, coupon va user uu tien `isActive`/`deletedAt` thay vi xoa cung khi da duoc tham chieu boi order. Endpoint `DELETE` voi cac resource nay thuc hien deactivate/soft delete.

## 5. Public And Customer API

Ky hieu quyen:

- `Public`: khong can token.
- `Customer`: can access token cua user dang hoat dong.
- `Owner`: chi thao tac resource thuoc user hien tai.

### 5.1 Health

| Method | Endpoint | Quyen | Mo ta |
|---|---|---|---|
| GET | `/health` | Public | API health, uptime, version |
| GET | `/health/database` | Admin | Kiem tra ket noi database |

### 5.2 Authentication

| Method | Endpoint | Quyen | Body chinh | Ket qua |
|---|---|---|---|---|
| POST | `/auth/register` | Public | `name`, `email`, `password` | Tao customer va dang nhap |
| POST | `/auth/login` | Public | `email`, `password` | Access token + user; set refresh cookie |
| POST | `/auth/refresh` | Refresh cookie | Khong co | Access token moi; rotate cookie |
| POST | `/auth/logout` | Refresh cookie | Khong co | Revoke refresh session, clear cookie |
| POST | `/auth/logout-all` | Customer | Khong co | Revoke tat ca session cua user |
| GET | `/auth/me` | Customer | Khong co | User hien tai |
| POST | `/auth/forgot-password` | Public | `email` | Luon tra response trung tinh |
| POST | `/auth/reset-password` | Public | `token`, `newPassword` | Dat mat khau moi, revoke session cu |
| PATCH | `/auth/change-password` | Customer | `currentPassword`, `newPassword` | Doi password, revoke session khac |

`register`, `login`, `forgot-password` va `reset-password` co rate limit rieng.

### 5.3 Profile And Addresses

| Method | Endpoint | Quyen | Mo ta |
|---|---|---|---|
| GET | `/users/me` | Customer | Lay profile |
| PATCH | `/users/me` | Customer | Sua `name`, `phone`, `avatarUrl` |
| DELETE | `/users/me` | Customer | Vo hieu hoa tai khoan sau khi xac nhan password |
| GET | `/addresses` | Customer | Danh sach dia chi cua user |
| POST | `/addresses` | Customer | Tao dia chi |
| PATCH | `/addresses/:addressId` | Owner | Sua dia chi |
| DELETE | `/addresses/:addressId` | Owner | Xoa dia chi |
| PATCH | `/addresses/:addressId/default` | Owner | Dat dia chi mac dinh |

Dia chi gom `recipientName`, `phone`, `line1`, `line2?`, `ward`, `district`, `province`, `postalCode?`, `isDefault`.

### 5.4 Catalog

| Method | Endpoint | Quyen | Mo ta |
|---|---|---|---|
| GET | `/products` | Public | Search, filter, sort, pagination |
| GET | `/products/featured` | Public | San pham noi bat |
| GET | `/products/:slug` | Public | Chi tiet product, image va variant active |
| GET | `/products/:slug/related` | Public | San pham lien quan |
| GET | `/categories` | Public | Category active |
| GET | `/categories/:slug` | Public | Category detail |
| GET | `/brands` | Public | Brand active |
| GET | `/brands/:slug` | Public | Brand detail |
| GET | `/search/suggestions` | Public | Goi y theo keyword da debounce |

Query cua `GET /products`:

| Query | Kieu | Mo ta |
|---|---|---|
| `q` | string | Tim theo product name, SKU, brand, category |
| `brand` | comma-separated slug | Mot hoac nhieu brand |
| `category` | comma-separated slug | Mot hoac nhieu category |
| `sizes` | comma-separated string | Size active con hang |
| `colors` | comma-separated slug | Mau active |
| `minPrice` | number | Gia toi thieu |
| `maxPrice` | number | Gia toi da |
| `inStock` | boolean | Chi lay product co variant con hang |
| `featured` | boolean | San pham noi bat |
| `sortBy` | enum | `newest`, `price`, `name`, `popular` |
| `sortOrder` | enum | `asc`, `desc` |
| `page`, `limit` | integer | Phan trang |

Product detail tra ve `variants` duoc nhom ro theo `color` va `size`; stock la gia tri tham khao tai thoi diem doc. Backend van kiem tra lai stock khi add cart va checkout.

### 5.5 Cart

Giai doan dau cart server-side chi danh cho customer. Guest cart duoc luu local va merge sau login bang endpoint `merge`.

| Method | Endpoint | Quyen | Body | Mo ta |
|---|---|---|---|---|
| GET | `/cart` | Customer | - | Lay cart va tong tien tam tinh |
| POST | `/cart/items` | Customer | `variantId`, `quantity` | Them item hoac tang quantity |
| PATCH | `/cart/items/:itemId` | Owner | `quantity` | Cap nhat quantity |
| DELETE | `/cart/items/:itemId` | Owner | - | Xoa item |
| DELETE | `/cart/items` | Customer | - | Xoa toan bo cart |
| POST | `/cart/merge` | Customer | `items[]` | Merge guest cart vao server cart |

Add/update/merge phai validate variant active, product active, `quantity >= 1` va quantity khong vuot stock hien tai.

### 5.6 Favorites

| Method | Endpoint | Quyen | Mo ta |
|---|---|---|---|
| GET | `/favorites` | Customer | Danh sach favorite co phan trang |
| POST | `/favorites/:productId` | Customer | Them favorite, idempotent |
| DELETE | `/favorites/:productId` | Customer | Xoa favorite, idempotent |

### 5.7 Coupon Validation

| Method | Endpoint | Quyen | Body | Mo ta |
|---|---|---|---|---|
| POST | `/coupons/validate` | Customer | `code`, `items[]?` | Preview discount theo cart hien tai |

Ket qua preview khong dam bao coupon se hop le luc checkout. Checkout luon validate lai trong backend transaction.

### 5.8 Orders And Checkout

| Method | Endpoint | Quyen | Body/Query | Mo ta |
|---|---|---|---|---|
| POST | `/orders` | Customer | Checkout payload | Tao order tu cart |
| GET | `/orders` | Customer | status, page, limit | Don cua user hien tai |
| GET | `/orders/:orderId` | Owner | - | Chi tiet order cua user |
| POST | `/orders/:orderId/cancel` | Owner | `reason` | Huy order neu status cho phep |

`POST /orders` bat buoc co header:

```http
Idempotency-Key: <uuid-generated-by-client>
```

Checkout payload:

```json
{
  "shippingAddressId": "addr_01J...",
  "couponCode": "RACE10",
  "paymentMethod": "COD",
  "note": "Giao gio hanh chinh"
}
```

Backend lay item tu cart cua user, khong tin gia, subtotal, discount hoac stock do frontend gui. Shipping address duoc snapshot vao order.

Customer duoc cancel khi order o `PENDING` hoac `CONFIRMED`. Cancel thanh cong phai hoan stock dung mot lan.

### 5.9 Reviews

| Method | Endpoint | Quyen | Mo ta |
|---|---|---|---|
| GET | `/products/:slug` | Public | Product detail kem 20 review approved moi nhat |
| POST | `/reviews` | Customer | Tao review tu `orderItemId` da delivered |

Body tao: `orderItemId`, `rating` tu 1 den 5, `title?`, `content?`. Mot user chi co mot review cho moi product; review moi o trang thai `PENDING`.

## 6. Admin API

Tat ca endpoint `/admin/*` bat buoc qua `authenticate` va `authorize("ADMIN")`. Quyen duoc doc tu user hien tai trong database; frontend khong phai nguon tin cay cho role.

### 6.1 Dashboard

| Method | Endpoint | Query | Mo ta |
|---|---|---|---|
| GET | `/admin/dashboard/summary` | `from`, `to` | Revenue, orders, users, products, low stock |
| GET | `/admin/dashboard/revenue` | `from`, `to`, `groupBy=day|month` | Du lieu chart doanh thu |
| GET | `/admin/dashboard/orders` | `from`, `to` | Phan bo order status |
| GET | `/admin/dashboard/top-products` | `from`, `to`, `limit` | Product ban chay |

Revenue chi tinh order `DELIVERED` va tru order da refund neu sau nay co refund.

### 6.2 Products

| Method | Endpoint | Mo ta |
|---|---|---|
| GET | `/admin/products` | List ke ca inactive, search/filter/pagination |
| GET | `/admin/products/:productId` | Chi tiet phuc vu form edit |
| POST | `/admin/products` | Tao product |
| PUT | `/admin/products/:productId` | Thay the cac field editable |
| PATCH | `/admin/products/:productId/status` | Active/inactive/featured |
| DELETE | `/admin/products/:productId` | Soft delete |
| POST | `/admin/products/:productId/images` | Gan anh bang URL, co the chon anh chinh |
| DELETE | `/admin/products/:productId/images/:imageId` | Xoa lien ket image |

Tao product chua bat buoc co variant ngay, nhung product chi duoc publish khi co it nhat mot variant active va mot image.

### 6.3 Variants

| Method | Endpoint | Mo ta |
|---|---|---|
| GET | `/admin/products/:productId/variants` | List variant cua product |
| POST | `/admin/products/:productId/variants` | Tao mot variant |
| POST | `/admin/products/:productId/variants/bulk` | Tao ma tran size/mau co kiem tra duplicate |
| PUT | `/admin/variants/:variantId` | Sua SKU, size, color, price, status |
| DELETE | `/admin/variants/:variantId` | Deactivate variant |

Khong cap nhat stock trong endpoint variant. Moi thay doi stock phai di qua inventory module de co audit log.

### 6.4 Categories And Brands

| Method | Endpoint | Mo ta |
|---|---|---|
| GET | `/admin/categories` | List ke ca inactive |
| POST | `/admin/categories` | Tao category |
| PUT | `/admin/categories/:categoryId` | Sua category |
| DELETE | `/admin/categories/:categoryId` | Soft delete neu khong anh huong product |
| GET | `/admin/brands` | List ke ca inactive |
| POST | `/admin/brands` | Tao brand |
| PUT | `/admin/brands/:brandId` | Sua brand |
| DELETE | `/admin/brands/:brandId` | Soft delete |

Slug duoc backend normalize va kiem tra unique. Neu admin nhap slug thi van phai validate lai.

### 6.5 Inventory

| Method | Endpoint | Body/Query | Mo ta |
|---|---|---|---|
| GET | `/admin/inventory` | q, brand, category, status, page | Ton kho theo variant |
| GET | `/admin/inventory/:variantId/transactions` | type, from, to, page | Lich su bien dong |
| PATCH | `/admin/inventory/:variantId` | `mode`, `quantity`, `reason` | Dieu chinh ton |
| POST | `/admin/inventory/imports` | `items[]`, `reference?`, `reason` | Nhap hang nhieu variant |

`mode` gom:

- `SET`: dat stock thanh gia tri moi.
- `INCREMENT`: cong them stock.
- `DECREMENT`: tru stock, chi thanh cong neu stock con du.

Moi request tao `InventoryTransaction`; `reason` bat buoc cho thao tac thu cong. API khong bao gio cho stock am.

### 6.6 Orders

| Method | Endpoint | Body/Query | Mo ta |
|---|---|---|---|
| GET | `/admin/orders` | q, status, paymentStatus, from, to, page | List order |
| GET | `/admin/orders/:orderId` | - | Chi tiet va status history |
| PATCH | `/admin/orders/:orderId/status` | `status`, `note?` | Chuyen trang thai hop le |
| PATCH | `/admin/orders/:orderId/payment-status` | `paymentStatus`, `reference?` | Cap nhat thanh toan co audit |

Khong cho nhay trang thai tuy y. Transition duoc quy dinh trong `ORDER_INVENTORY_FLOW.md`.

### 6.7 Customers

| Method | Endpoint | Mo ta |
|---|---|---|
| GET | `/admin/customers` | Search/filter/pagination customer |
| GET | `/admin/customers/:customerId` | Profile, tong order, tong chi tieu |
| PATCH | `/admin/customers/:customerId/status` | Active/block customer |

Admin khong duoc xem password hash, refresh token hoac reset token.

### 6.8 Reviews

| Method | Endpoint | Mo ta |
|---|---|---|
| GET | `/admin/reviews` | List theo status/rating/product |
| PATCH | `/admin/reviews/:reviewId/status` | Approve/reject/hide |
| DELETE | `/admin/reviews/:reviewId` | Soft delete noi dung vi pham |

### 6.9 Coupons

| Method | Endpoint | Mo ta |
|---|---|---|
| GET | `/admin/coupons` | List/search/filter/pagination |
| POST | `/admin/coupons` | Tao coupon |
| PUT | `/admin/coupons/:couponId` | Sua coupon |
| PATCH | `/admin/coupons/:couponId/status` | Active/inactive |
| DELETE | `/admin/coupons/:couponId` | Soft delete |

Coupon gom `code`, `type`, `value`, `minOrderValue`, `maxDiscount?`, `startAt`, `endAt`, `usageLimit?`, `perUserLimit?`, `isActive`.

### 6.10 Uploads (huong mo rong)

| Method | Endpoint | Content type | Mo ta |
|---|---|---|---|
| POST | `/admin/uploads/images` | multipart/form-data | Du kien upload 1-10 anh |
| DELETE | `/admin/uploads/images/:assetId` | JSON | Du kien xoa asset chua duoc dung |

Response upload:

```json
{
  "success": true,
  "message": "Images uploaded successfully",
  "data": {
    "items": [
      {
        "assetId": "f1-store/products/abc",
        "url": "https://cdn.example.com/image.webp",
        "width": 1200,
        "height": 1200,
        "format": "webp",
        "bytes": 145320
      }
    ]
  }
}
```

## 7. Upload Strategy

### 7.1 Development

- Multer nhan file vao memory voi gioi han kich thuoc.
- Provider `local` luu vao `backend/uploads/` de demo offline.
- Express chi serve static thu muc upload trong development.
- URL va provider asset ID van duoc luu theo mot interface chung.

### 7.2 Production

- Dung Cloudinary qua server-side SDK.
- Chi admin duoc upload.
- Cho phep JPEG, PNG, WebP; tu choi executable va MIME khong hop le.
- Toi da 5 MB/file, 10 file/request.
- Chuyen sang WebP/AVIF khi phu hop, gioi han 1600x1600, giu ti le.
- Luu `publicId`, `secureUrl`, `width`, `height`, `format`, `bytes`.
- Xoa asset chi khi khong con product image tham chieu.

`UploadProvider` la interface co `uploadImage()` va `deleteImage()`. Chon provider bang `UPLOAD_PROVIDER=local|cloudinary`, giup service product khong phu thuoc truc tiep Cloudinary.

## 8. Validation Rules Chinh

| Field | Rule |
|---|---|
| email | Normalize lowercase, dung format, toi da 254 ky tu |
| password | 8-72 ky tu, co chu va so; bcrypt co gioi han input |
| name | 2-100 ky tu, trim |
| slug | lowercase kebab-case, unique |
| SKU | 2-64 ky tu, uppercase normalize, unique |
| price | `>= 0`, toi da 2 chu so thap phan |
| stock | So nguyen `>= 0` |
| quantity | So nguyen `>= 1`, co gioi han moi item |
| rating | So nguyen 1-5 |
| coupon code | Uppercase normalize, unique |
| page/limit | Co gioi han de tranh query qua lon |

Unknown field trong body bi loai bo hoac tu choi theo Zod strict schema. Backend khong spread request body truc tiep vao Prisma.

## 9. Security Middleware Order

Thu tu middleware global du kien:

```text
requestId
-> trust proxy configuration
-> Helmet
-> CORS allowlist + credentials
-> JSON/urlencoded body size limit
-> cookie parser
-> global rate limit
-> request logger with redaction
-> routes
-> notFound handler
-> centralized error handler
```

Route nhay cam them rate limit, authentication, authorization, upload limit va validation theo dung thu tu.

## 10. Source Structure Cho Phase Sau

```text
backend/src/
  config/
    env.ts
    prisma.ts
    cors.ts
  middleware/
    authenticate.ts
    authorize.ts
    error.middleware.ts
    rate-limit.middleware.ts
    validate.middleware.ts
    request-id.middleware.ts
  modules/
    auth/
      auth.controller.ts
      auth.service.ts
      auth.routes.ts
      auth.schema.ts
      auth.types.ts
    users/
    addresses/
    products/
    categories/
    brands/
    variants/
    inventory/
    cart/
    favorites/
    coupons/
    orders/
    payments/
    reviews/
    uploads/
    dashboard/
  routes/
    index.ts
  shared/
    errors/
    types/
    constants/
  utils/
    api-response.ts
    async-handler.ts
    jwt.ts
    password.ts
    pagination.ts
    decimal.ts
  app.ts
  server.ts
```

## 11. OpenAPI Strategy

- OpenAPI 3.1 la nguon tai lieu API chinh.
- Swagger UI duoc mount tai `/api-docs` trong development.
- Schema response va error dung lai qua `components/schemas`.
- Bearer auth duoc khai bao bang `securitySchemes`.
- Refresh cookie duoc mo ta rieng trong auth endpoints.
- Moi module co file OpenAPI fragment hoac annotation gan route; build step gop thanh mot spec.
- Postman collection co the generate tu OpenAPI, tranh duy tri hai hop dong khac nhau.

## 12. Definition Of Done Cho API Design

- Tat ca nghiep vu trong Phase 1 co endpoint va quyen truy cap ro rang.
- Response, error, pagination, date, money va soft delete da thong nhat.
- Admin API deu nam duoi `/admin` va bat buoc JWT + role.
- Stock chi thay doi qua inventory service.
- Checkout khong nhan gia tu frontend va co idempotency key.
- Upload co provider abstraction, validation va gioi han file.
- Cac flow nhay cam duoc mo ta chi tiet trong hai tai lieu con lai cua Phase 2.
