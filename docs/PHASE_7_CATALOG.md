# PHASE 7 - PRODUCT, CATEGORY AND BRAND

## Scope

Phase 7 implements the public catalog and the first catalog administration layer:

- Public category and brand lists/details.
- Public product list, featured products, product detail and related products.
- Product search, filters, sorting and pagination.
- Admin category and brand CRUD with soft delete.
- Admin product list, detail, create, update, status update and soft delete.
- JWT authentication and `ADMIN` authorization on every admin catalog route.

Variant creation and inventory adjustments remain in Phase 8. Phase 7 reads existing active variants so storefront responses already expose size, color, price and stock.

## Public Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/products` | Product search, filters, sort and pagination |
| GET | `/api/v1/products/featured` | Featured products |
| GET | `/api/v1/products/:slug` | Product, images, active variants and approved reviews |
| GET | `/api/v1/products/:slug/related` | Up to eight related products |
| GET | `/api/v1/categories` | Active categories |
| GET | `/api/v1/categories/:slug` | Active category detail |
| GET | `/api/v1/brands` | Active brands |
| GET | `/api/v1/brands/:slug` | Active brand detail |

Product list query fields:

```text
q, brand, category, sizes, colors, minPrice, maxPrice,
inStock, featured, sortBy, sortOrder, page, limit
```

`brand`, `category`, `sizes` and `colors` accept comma-separated values. Supported sorts are `newest`, `price`, `name`, `popular` and `rating`.

## Admin Endpoints

All endpoints below require a valid access token and role `ADMIN`.

| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/v1/admin/categories` | List or create category |
| PUT/DELETE | `/api/v1/admin/categories/:categoryId` | Replace or soft-delete category |
| GET/POST | `/api/v1/admin/brands` | List or create brand |
| PUT/DELETE | `/api/v1/admin/brands/:brandId` | Replace or soft-delete brand |
| GET/POST | `/api/v1/admin/products` | List or create product |
| GET/PUT/DELETE | `/api/v1/admin/products/:productId` | Detail, replace or soft-delete product |
| PATCH | `/api/v1/admin/products/:productId/status` | Change status and/or featured flag |

## Business Rules

- Slugs are normalized to lowercase ASCII kebab-case by the backend.
- Category, brand and product slugs are unique.
- Product category and brand must both exist and be active.
- `salePrice` must be lower than `basePrice`.
- A newly created product is a draft unless explicitly set otherwise.
- A product cannot become `ACTIVE` without at least one image and one active variant.
- Category or brand deletion is rejected while it has non-deleted products.
- Product deletion is soft delete and also clears the featured flag.
- Public APIs never return draft, inactive or soft-deleted products.
- Product detail returns stock for display, but cart and checkout must validate stock again.

## Response Data

Product cards include effective price, primary image, total stock, variant count, average rating, rating count and sold item count. Decimal values are converted to JSON numbers at the API boundary.

Product detail includes ordered images, active variants with size/color data, the latest approved reviews and an aggregate rating summary across all approved reviews.

Every paginated response contains:

```json
{
  "page": 1,
  "limit": 12,
  "totalItems": 25,
  "totalPages": 3,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

## Files

```text
backend/src/modules/
  categories/
    category.controller.ts
    category.routes.ts
    category.schema.ts
    category.service.ts
  brands/
    brand.controller.ts
    brand.routes.ts
    brand.schema.ts
    brand.service.ts
  products/
    product.controller.ts
    product.routes.ts
    product.schema.ts
    product.schema.test.ts
    product.service.ts
backend/src/utils/
  pagination.ts
  slug.ts
```

## Verification

- Strict TypeScript typecheck: pass.
- Production build: pass.
- Automated tests: 22/22 pass.
- Public catalog search/filter and product detail against MySQL: pass.
- Admin login and catalog authorization: pass.
- Category, brand and draft product create/search/delete lifecycle against MySQL: pass.
- Invalid product publication without image/variant returns HTTP 422: pass.
- Database reset seed rerun after integration tests: pass.

The integration run ended with the documented baseline of 6 users, 25 products, 50 variants, 12 orders, 5 reviews and 64 inventory transactions.
