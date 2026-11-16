# PHASE 11 - ADMIN DASHBOARD

## Goal

Phase 11 provides the reporting API required by the future `/admin` dashboard UI. It exposes six KPI values and the five datasets requested in the project prompt while keeping all routes restricted to `ADMIN` accounts.

Revenue includes only `DELIVERED` orders and excludes orders whose payment status is `REFUNDED`.

## Endpoints

| Method | Endpoint | Query | Description |
|---|---|---|---|
| GET | `/api/v1/admin/dashboard/summary` | `from`, `to` | Revenue, orders, customers, products and stock KPIs |
| GET | `/api/v1/admin/dashboard/revenue` | `from`, `to`, `groupBy=day\|month` | Revenue and order-count timeline |
| GET | `/api/v1/admin/dashboard/orders` | `from`, `to` | Distribution across all order statuses |
| GET | `/api/v1/admin/dashboard/top-products` | `from`, `to`, `limit` | Best-selling products |
| GET | `/api/v1/admin/dashboard/top-categories` | `from`, `to`, `limit` | Best-selling categories |

The default range is the latest 30 days. A custom range cannot exceed two years. Ranking limits default to 10 and may be from 1 to 50.

The frontend presets map directly to `from` and `to`:

- Today.
- Latest 7 days.
- Latest 30 days.
- Current month.
- Current year.

## Summary

The summary response contains:

```json
{
  "range": {
    "from": "2026-09-12T00:00:00.000Z",
    "to": "2026-10-11T23:59:59.999Z"
  },
  "totalRevenue": 21443000,
  "totalOrders": 13,
  "totalCustomers": 5,
  "newCustomers": 5,
  "totalProducts": 25,
  "outOfStockProducts": 0,
  "lowStockProducts": 0
}
```

`totalCustomers` and `totalProducts` are current active totals. `newCustomers`, `totalOrders` and `totalRevenue` respect the selected range. Stock KPIs count active products, not individual variants.

## Charts

The timeline endpoint returns both revenue and order counts:

```json
{
  "period": "2026-10-01",
  "revenue": 4770000,
  "orders": 2
}
```

Missing days or months are emitted with zero values, so chart components do not need to fill gaps themselves.

Order distribution always returns all five statuses (`PENDING`, `CONFIRMED`, `SHIPPING`, `DELIVERED`, `CANCELLED`), including statuses whose count is zero.

Top product and category rankings contain `rank`, sold `quantity` and delivered `revenue`. Product names remain available from the immutable order-item snapshot even if a catalog product is later removed.

## Files

```text
backend/src/modules/dashboard/
  dashboard.controller.ts
  dashboard.routes.ts
  dashboard.schema.ts
  dashboard.schema.test.ts
  dashboard.service.ts

backend/scripts/phase11-smoke.ts
```

## Verification

- Strict TypeScript typecheck: pass.
- Automated tests: 42/42 pass.
- Admin summary against MySQL seed data: pass.
- Revenue and order timeline with 30 zero-filled daily points: pass.
- Five-state order distribution: pass.
- Top 3 products and categories: pass.
- Customer access returns `403 FORBIDDEN`: pass.
- MySQL integration result at verification time: revenue 21,443,000; orders 13; customers 5; products 25.
