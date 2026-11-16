# PHASE 12 - FRONTEND STORE

## Goal

Phase 12 delivers the complete customer storefront for F1 Gridwear. It is a responsive React application connected to the REST API from Phases 6-11 and ready for project demonstration on desktop, tablet and mobile.

## Technology

- React 19 + TypeScript + Vite.
- React Router for client-side routing.
- TanStack Query for API cache and mutations.
- Zustand for guest cart and local wishlist state.
- React Hook Form + Zod for forms and validation.
- Lucide React for interface icons.
- Sonner for accessible toast notifications.
- Custom responsive CSS design system.

Vite runs on port `3000` and proxies `/api` to the Express API at `127.0.0.1:5000`. This keeps refresh cookies first-party in development and matches the backend CORS configuration.

## Customer Routes

| Route | Experience |
|---|---|
| `/` | Campaign hero, service benefits, categories, featured, new and best-selling products |
| `/products` | Search, filter, sort and paginate the product catalog |
| `/products/:slug` | Gallery, price, variants, exact stock, quantity, reviews and related products |
| `/cart` | Guest or authenticated cart with quantity and stock controls |
| `/checkout` | Saved/new address, coupon preview, COD and order summary |
| `/login` | Login and automatic guest-cart merge |
| `/register` | Validated customer registration |
| `/wishlist` | Browser-persisted saved products |
| `/orders` | Filterable customer order history |
| `/orders/:orderId` | Status timeline, snapshots, totals and valid cancellation |

Checkout and order routes are protected. Unauthenticated visitors are redirected to login and returned to their intended page afterward.

## Storefront Features

### Catalog

- Search by product, brand, category or SKU through backend search.
- Filter by category, brand, size, color, price and stock.
- Sort by newest, popularity, rating, price or name.
- Desktop sidebar and mobile filter drawer.
- Product cards expose sale price, discount, rating and availability.

### Variant Selection

The detail page resolves the exact color and size combination. Disabled sizes represent missing or zero-stock variants. Quantity cannot exceed the selected variant's current stock. The Ferrari demo correctly displays:

```text
Racing Red / M
SKU FER-TEE-001-RACING-RED-M
Stock 10
```

### Cart

- Guest cart is persisted in `localStorage`.
- Logged-in cart is read and updated through the backend.
- Guest items are atomically merged after login or registration.
- Header count, line totals, shipping preview and stock warnings stay synchronized.
- Backend remains the final authority for price and inventory.

### Authentication

- Access tokens are held by the frontend auth store and persisted for reloads.
- Refresh tokens remain in the backend-issued HttpOnly cookie.
- The API client attempts one refresh after an unauthorized response.
- Logout clears both server session cookie and local access state.

### Checkout

- Select an existing address or create one inline.
- Validate coupons against the current server cart.
- Generate a new UUID `Idempotency-Key` for order creation.
- Submit only address, coupon, COD and note; prices are never trusted from the browser.
- Redirect to the created order and show confirmation state.

## Visual Direction

The visual system uses black, white and neutral gray with restrained racing red accents. The layout is workmanlike on dense catalog and checkout surfaces while the homepage uses a full-width editorial motorsport campaign image. Cards use square corners or small radii, controls have stable dimensions, and every mobile view avoids horizontal overflow.

The original hero image was generated for this project and saved at:

```text
frontend/public/assets/gridwear-hero.png
```

## Structure

```text
frontend/
  public/assets/
  src/
    components/
    hooks/
    lib/
    pages/
    services/
    stores/
    types/
    App.tsx
    main.tsx
    styles.css
  .env.example
  index.html
  package.json
  vite.config.ts
```

## Run

```bash
cd backend
npm start

cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

Development customer account:

```text
minhanh@example.com
Customer@123
```

## Verification

- Frontend strict TypeScript typecheck: pass.
- Production Vite build: pass.
- Dependency audit: zero known vulnerabilities.
- Live backend catalog data: pass.
- Desktop QA at 1440x900: pass.
- Mobile QA at 390x844: pass; no horizontal overflow.
- Ferrari Red/M variant selection and stock 10: pass.
- Guest cart persistence and header count: pass.
- Customer login and atomic guest-cart merge: pass.
- Authenticated checkout page with default address and COD summary: pass.
- Route-level lazy loading: enabled.
