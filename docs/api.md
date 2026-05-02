# Warehouse MS — API reference

Every route lives under `src/app/api/**` as a Next.js Route Handler.
Conventions and the shared helper module are described first; each endpoint
section then lists method, path, auth, parameters, request shape, response
shape, errors, and an example.

> Pair this with [`database.md`](./database.md). Most endpoints are thin
> CRUD over the schema described there; views and triggers do the heavy
> lifting for read-side endpoints.

---

## Conventions

### Auth

Every route except `/api/auth/**` calls `requireUser()` from `src/lib/api.ts`.
That helper reads the Auth.js JWT session and returns

```ts
{ id: bigint, name: string, email: string, role: string, departmentId: bigint | null }
```

If no session is attached to the request the response is

```http
401 Unauthorized
{ "error": "Not authenticated" }
```

The proxy at `src/proxy.ts` already redirects unauthenticated browser
navigation, but every API route still verifies independently — never trust
the proxy alone for sensitive endpoints.

### Content type

All routes send and receive `application/json`. Server responses always
include a top-level object (never a bare array) so adding fields later is
non-breaking. List endpoints wrap their rows in `{ data, total, limit,
offset }`.

### IDs and decimals

- **`BIGINT` IDs** are serialized as **strings**. JS `Number` can't safely
  hold values past 2⁵³, so the API stays string-typed end to end. Pass IDs
  as strings in URL params and bodies; the helpers convert them back to
  `BigInt` server-side via `parseBigIntId`.
- **`NUMERIC` columns** (`current_stock`, `reorder_level`, `budget`, …) are
  serialized as **numbers**. The 14-digit precision of the schema fits
  inside a JS `Number` without rounding for the magnitudes the app deals
  with.
- **Dates** are ISO 8601 strings (UTC).

### Errors

All errors look like:

```json
{ "error": "Human-readable message" }
```

| Status | When                                                       |
| ------ | ---------------------------------------------------------- |
| 400    | Validation failed, invalid id, missing required FK         |
| 401    | No session                                                 |
| 404    | Resource not found (or report slug unknown)                |
| 409    | Unique constraint conflict (e.g. duplicate email)          |
| 500    | Unhandled — logged server-side as `console.error`          |

The `withApi(handler)` wrapper traps `HttpError(status, message)` thrown
inside a handler and turns it into the JSON shape above; everything else
falls through to a 500.

### Pagination

List endpoints accept `?limit=` (default 50, max 200) and `?offset=`
(default 0). The response includes `total`, `limit`, and `offset` so the
caller can compute pages.

### Soft delete

`DELETE` on items, projects, and stock movements sets `deleted_at = now()`.
The data is still queryable via Prisma if needed; default reads filter it
out. For movements, the soft-delete trigger reverses the stock effect on
`items.current_stock` (see `database.md` §8).

---

## Endpoint index

| Group           | Method | Path                                |
| --------------- | ------ | ----------------------------------- |
| Auth            | POST   | `/api/auth/[...nextauth]`           |
|                 | POST   | `/api/auth/register`                |
| Users           | GET    | `/api/users/me`                     |
|                 | PATCH  | `/api/users/me`                     |
|                 | GET    | `/api/users/me/notifications`       |
|                 | PATCH  | `/api/users/me/notifications`       |
| Lookups         | GET    | `/api/lookups`                      |
| Items           | GET    | `/api/items`                        |
|                 | POST   | `/api/items`                        |
|                 | GET    | `/api/items/[id]`                   |
|                 | PATCH  | `/api/items/[id]`                   |
|                 | DELETE | `/api/items/[id]`                   |
| Projects        | GET    | `/api/projects`                     |
|                 | POST   | `/api/projects`                     |
|                 | GET    | `/api/projects/[id]`                |
|                 | PATCH  | `/api/projects/[id]`                |
|                 | DELETE | `/api/projects/[id]`                |
| Stock movements | GET    | `/api/stock-movements`              |
|                 | POST   | `/api/stock-movements`              |
|                 | GET    | `/api/stock-movements/[id]`         |
|                 | DELETE | `/api/stock-movements/[id]`         |
| Reorder alerts  | GET    | `/api/reorder-alerts`               |
| Dashboard       | GET    | `/api/dashboard`                    |
| Reports         | GET    | `/api/reports/[slug]`               |

---

## 1. Authentication

### `POST /api/auth/[...nextauth]`

Auth.js v5 catch-all. Handles `signIn`, `signOut`, `csrf`, `session`,
`callback`, etc. **Don't call this directly** from your own code; use
`signIn("credentials", …)` / `signOut()` from `next-auth/react`. Client
pages already do this — see `src/app/auth/login/page.tsx`.

The Credentials provider runs `argonVerify(user.passwordHash, password)`,
checks the user is `active` and not soft-deleted, and bumps `lastLoginAt`
on success.

### `POST /api/auth/register`

Creates a user, hashes the password with argon2id, defaults the role to
`storekeeper`. Used by `src/app/auth/signup/page.tsx`.

**Auth:** none (public endpoint).

**Body:**

```json
{
  "fullName": "Ada Lovelace",
  "email":    "ada@example.com",
  "password": "minimum-8-chars"
}
```

| Field       | Type   | Rules                |
| ----------- | ------ | -------------------- |
| `fullName`  | string | ≥ 2 characters       |
| `email`     | string | RFC 5322 email       |
| `password`  | string | ≥ 8 characters       |

**Response 200**

```json
{ "id": "12", "email": "ada@example.com", "fullName": "Ada Lovelace" }
```

**Errors**

| Status | Reason                                                          |
| ------ | --------------------------------------------------------------- |
| 400    | Validation failure or invalid JSON                              |
| 409    | An account with that email already exists                       |
| 500    | `Roles are not seeded. Run prisma db seed.` (no `storekeeper`)  |

**Example**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H 'content-type: application/json' \
  -d '{"fullName":"Ada Lovelace","email":"ada@example.com","password":"opensesame"}'
```

---

## 2. Users

### `GET /api/users/me`

Current user's profile, joined with role / department / default site.

**Auth:** required.

**Response 200**

```json
{
  "id": "1",
  "email": "ada@example.com",
  "fullName": "Ada Lovelace",
  "phone": "+233 24 555 0001",
  "bio": null,
  "avatarUrl": null,
  "status": "active",
  "role":        { "code": "storekeeper",       "label": "Storekeeper" },
  "department":  { "id": "2", "code": "civil",   "label": "Civil" },
  "defaultSite": { "id": "1", "code": "site_a", "label": "Site A" },
  "isVerified": false
}
```

### `PATCH /api/users/me`

Update profile fields. **Role and email aren't editable here** — those
require an admin endpoint we haven't built yet.

**Body** (all keys optional):

```json
{
  "fullName": "Ada Lovelace",
  "phone": "+233 24 555 0001",
  "bio": null,
  "avatarUrl": null,
  "departmentId": "2",
  "defaultSiteId": "1"
}
```

| Field           | Type             | Notes                              |
| --------------- | ---------------- | ---------------------------------- |
| `fullName`      | string           | ≥ 2 chars                          |
| `phone`         | string \| null   | ≤ 40 chars                         |
| `bio`           | string \| null   | ≤ 1000 chars                       |
| `avatarUrl`     | URL \| null      | RFC 3986                           |
| `departmentId`  | string \| null   | BIGINT id, or `null` to clear      |
| `defaultSiteId` | string \| null   | BIGINT id, or `null` to clear      |

Pass `null` to clear a nullable field; omit the key to leave it untouched.

**Response 200** — the updated user (same shape as `GET /api/users/me`).

### `GET /api/users/me/notifications`

The current user's notification toggles. Always returns the full
canonical list, falling back to defaults for keys the user has never
touched.

**Response 200**

```json
[
  { "key": "low_stock_alert",      "label": "Low stock alerts",     "description": "...", "enabled": true  },
  { "key": "stock_in_received",    "label": "New stock-in received","description": "...", "enabled": true  },
  { "key": "stock_out_dispatched", "label": "Stock-out dispatched", "description": "...", "enabled": false },
  { "key": "weekly_summary_email", "label": "Weekly summary email", "description": "...", "enabled": true  }
]
```

### `PATCH /api/users/me/notifications`

Upsert a single preference. Used by the Settings page's toggle switches.

**Body**

```json
{ "key": "stock_out_dispatched", "enabled": true }
```

| Field     | Type    | Notes              |
| --------- | ------- | ------------------ |
| `key`     | string  | 1-64 chars         |
| `enabled` | boolean | required           |

**Response 200**

```json
{ "key": "stock_out_dispatched", "enabled": true }
```

---

## 3. Lookups

### `GET /api/lookups`

One round-trip for **every dropdown** in the modals. Returns active
suppliers (filtered server-side) and the full list of every other
reference table.

**Auth:** required.

**Response 200**

```json
{
  "categories":      [ { "id": "1", "code": "structural", "label": "Structural", "isMaintenance": false, "parentId": null } ],
  "units":           [ { "id": "1", "code": "bags",       "label": "Bags",       "symbol": null } ],
  "suppliers":       [ { "id": "1", "name": "GHACEM Ltd", "isActive": true } ],
  "manufacturers":   [ { "id": "1", "name": "Cummins" } ],
  "departments":     [ { "id": "1", "code": "civil",      "label": "Civil" } ],
  "regions":         [ { "id": "1", "code": "ashanti",    "label": "Ashanti" } ],
  "sites":           [ { "id": "1", "code": "site_a",     "label": "Site A", "regionId": "1" } ],
  "storageLocations":[ { "id": "1", "code": "main_warehouse", "label": "Main Warehouse" } ],
  "roles":           [ { "id": "1", "code": "storekeeper", "label": "Storekeeper", "isAdmin": false } ]
}
```

> Caching tip: the contents change rarely. Cache client-side for the
> session lifetime.

---

## 4. Items (inventory registry)

### `GET /api/items`

List inventory items with the same UI status pills the registry table
shows.

**Auth:** required.

**Query**

| Param      | Type                                       | Default |
| ---------- | ------------------------------------------ | ------- |
| `q`        | string — searches `name` and `rfq`         | –       |
| `category` | category `code` (e.g. `structural`)        | –       |
| `status`   | `in_stock` \| `low` \| `critical` \| `out` | –       |
| `limit`    | 1-200                                      | 50      |
| `offset`   | ≥ 0                                        | 0       |

**Response 200**

```json
{
  "data": [
    {
      "id": "1",
      "rfq": "RFQ-001",
      "name": "Cement 50kg",
      "category":     { "id": "1", "code": "structural", "label": "Structural" },
      "unit":         { "id": "1", "code": "bags",       "label": "Bags" },
      "supplier":     { "id": "1", "name": "GHACEM Ltd"  },
      "currentStock": 450,
      "reorderLevel": 200,
      "minStock":     150,
      "maxStock":     1000,
      "status":       "in_stock",
      "isMaintenancePart": false,
      "description":  null
    }
  ],
  "total": 5,
  "limit": 50,
  "offset": 0
}
```

### `POST /api/items`

Create a new item.

**Body**

```json
{
  "rfq": "RFQ-006",
  "name": "Sand (trip)",
  "categoryCode": "structural",
  "unitCode": "trips",
  "defaultSupplierName": "BuildMix Ltd",
  "manufacturerName": null,
  "isMaintenancePart": false,
  "reorderLevel": 5,
  "minStock": 2,
  "maxStock": 50,
  "description": null
}
```

| Field                 | Type            | Notes                                                |
| --------------------- | --------------- | ---------------------------------------------------- |
| `rfq`                 | string          | unique, 1-64 chars                                   |
| `name`                | string          | 1-200 chars                                          |
| `categoryCode`        | string          | must exist in `categories.code`                      |
| `unitCode`            | string          | must exist in `units.code`                           |
| `defaultSupplierName` | string \| null  | optional; matched against `suppliers.name`           |
| `manufacturerName`    | string \| null  | optional                                             |
| `isMaintenancePart`   | bool            | default `false`                                      |
| `reorderLevel`        | number ≥ 0      | default 0                                            |
| `minStock`            | number ≥ 0      | default 0                                            |
| `maxStock`            | number ≥ 0      | default 0; CHECK `max ≥ reorder ≥ min`               |
| `description`         | string \| null  | ≤ 2000 chars                                         |

**Response 201** — the created `Item` row.

### `GET /api/items/[id]`

Single item including its category, unit, supplier, and manufacturer.
404 if soft-deleted or unknown.

### `PATCH /api/items/[id]`

Partial update. All fields from `POST` are optional. Pass codes/names
exactly as in the lookups.

### `DELETE /api/items/[id]`

Soft-delete. Sets `deletedAt = now()`. Returns `{ "id": "<id>" }`.
The item disappears from `GET /api/items` but its history in
`stock_movement_items` stays intact.

---

## 5. Projects

### `GET /api/projects`

Project list with **aggregated consumption** (`qtyConsumed`,
`lastActivity`) computed from outbound movements against each project.

**Auth:** required.

**Query**

| Param    | Type                                      | Default |
| -------- | ----------------------------------------- | ------- |
| `q`      | string — searches `name`, `wbs`, `location` | –     |
| `status` | `active` \| `on_hold` \| `completed`      | –       |
| `limit`  | 1-200                                     | 50      |
| `offset` | ≥ 0                                       | 0       |

**Response 200**

```json
{
  "data": [
    {
      "id": "1",
      "wbs": "A",
      "name": "Asylum Down",
      "location": "Accra",
      "region":  { "id": "1", "code": "greater_accra", "label": "Greater Accra" },
      "manager": { "id": "1", "fullName": "Eng. Boateng", "email": "boateng@example.com" },
      "status": "active",
      "startDate": "2026-01-12T00:00:00.000Z",
      "estimatedEndDate": "2026-09-30T00:00:00.000Z",
      "budget": 250000,
      "qtyConsumed": 12500,
      "lastActivity": "2026-04-20T00:00:00.000Z"
    }
  ],
  "total": 13,
  "limit": 50,
  "offset": 0
}
```

### `POST /api/projects`

**Body**

```json
{
  "wbs": "12",
  "name": "Bantama Phase 4",
  "location": "Kumasi",
  "regionCode": "ashanti",
  "managerEmail": "boateng@example.com",
  "status": "active",
  "startDate": "2026-05-01",
  "estimatedEndDate": "2026-12-31",
  "budget": 350000,
  "description": null
}
```

| Field              | Type                       | Notes                                  |
| ------------------ | -------------------------- | -------------------------------------- |
| `wbs`              | string                     | unique, 1-32 chars                     |
| `name`             | string                     | 1-200 chars                            |
| `location`         | string                     | 1-200 chars                            |
| `regionCode`       | string \| null             | must exist in `regions.code`           |
| `managerEmail`     | string \| null             | must exist in `users.email`            |
| `status`           | enum                       | default `active`                       |
| `startDate`        | ISO date string \| null    | parsed via `new Date(...)`             |
| `estimatedEndDate` | ISO date string \| null    | parsed via `new Date(...)`             |
| `budget`           | number ≥ 0 \| null         |                                        |
| `description`     | string \| null              | ≤ 2000 chars                           |

**Response 201** — the created project.

### `GET /api/projects/[id]`

Backs the **`project-details` modal**. Returns metadata + top materials +
recent MRNs in one call.

**Response 200**

```json
{
  "project": {
    "id": "1",
    "wbs": "A",
    "name": "Asylum Down",
    "...": "...",
    "region": { "id": "...", "code": "...", "label": "..." },
    "manager": { "id": "...", "fullName": "...", "email": "..." }
  },
  "topMaterials": [
    { "itemId": "1", "name": "Cement 50kg", "unit": "Bags", "qty": 1280 }
  ],
  "recentMrns": [
    {
      "id": "100",
      "refNo": "MRN-2026-001",
      "date": "2026-04-18T00:00:00.000Z",
      "issuedTo": { "id": "5", "fullName": "Kwame Asante" },
      "lines": [{ "item": "Cement 50kg", "qty": 100, "unit": "Bags" }]
    }
  ]
}
```

### `PATCH /api/projects/[id]`

Partial update. Same field rules as `POST`. Pass `null` on
`regionCode` / `managerEmail` to clear; omit to keep.

### `DELETE /api/projects/[id]`

Soft-delete. Returns `{ "id": "<id>" }`.

---

## 6. Stock movements (the unified ledger)

This is the single ledger for **operations stock-in (GRN)**, **operations
stock-out (MRN)**, and **maintenance** movements. The `kind`/`direction`
combo determines which fields are required (see the `CHECK` in
`database.md` §7).

### `GET /api/stock-movements`

**Auth:** required.

**Query**

| Param       | Type                          | Default |
| ----------- | ----------------------------- | ------- |
| `kind`      | `operations` \| `maintenance` | –       |
| `direction` | `in` \| `out`                 | –       |
| `projectId` | BIGINT id (string)            | –       |
| `q`         | string — searches `refNo`     | –       |
| `limit`     | 1-200                         | 50      |
| `offset`    | ≥ 0                           | 0       |

**Response 200**

```json
{
  "data": [
    {
      "id": "100",
      "refNo": "GRN-26-001",
      "direction": "in",
      "kind": "operations",
      "movementDate": "2026-04-15T00:00:00.000Z",
      "rfq": "RFQ-2026-012",
      "notes": null,

      "supplier":   { "id": "1", "name": "GHACEM Ltd", "...": "..." },
      "project":    null,
      "department": { "id": "1", "code": "engineering", "label": "Engineering" },
      "activity":   null,

      "site":       null,
      "technician": null,
      "application": null,
      "manufacturer": null,
      "storageLocation": null,

      "receivedBy":   { "id": "5", "fullName": "John Mensah" },
      "issuedTo":     null,
      "authorisedBy": null,

      "lines": [
        {
          "id": "200",
          "itemId": "1",
          "itemName": "Cement 50kg",
          "itemRfq":  "RFQ-001",
          "qty": 200,
          "unit": "Bags",
          "unitCode": "bags",
          "condition": "good",
          "note": null
        }
      ]
    }
  ],
  "total": 27,
  "limit": 50,
  "offset": 0
}
```

### `POST /api/stock-movements`

Creates the header **and** its line items in one Prisma `create`. The DB
trigger `trg_movement_items_stock` then bumps `items.current_stock` for
each line.

**Body**

```json
{
  "refNo": "GRN-26-009",
  "direction": "in",
  "kind": "operations",
  "movementDate": "2026-05-02",
  "rfq": "RFQ-2026-019",
  "notes": null,

  "supplierName": "GHACEM Ltd",
  "receivedByEmail": "john@example.com",

  "projectWbs": null,
  "departmentCode": "engineering",
  "activity": null,
  "issuedToEmail": null,
  "authorisedByEmail": null,

  "siteCode": null,
  "technicianEmail": null,
  "application": null,
  "manufacturerName": null,
  "storageLocationCode": null,

  "lines": [
    { "itemRfq": "RFQ-001", "qty": 100, "unitCode": "bags", "condition": "good" }
  ]
}
```

**Required fields by flavor**

| Flavor                         | Required (besides ref/date/lines)  |
| ------------------------------ | ---------------------------------- |
| `operations` + `in`            | `supplierName`                     |
| `operations` + `out` (MRN)     | `projectWbs`                       |
| `maintenance` + `in` or `out`  | `siteCode`                         |

The server returns `400` if the matching flavor's required field is
missing — mirrors the `stock_movements_kind_payload_chk` constraint.

**Response 201** — the created header + lines.

### `GET /api/stock-movements/[id]`

Same shape as a single row from `GET /api/stock-movements`.

### `DELETE /api/stock-movements/[id]`

Soft-delete. The `trg_movement_soft_delete` trigger reverses the stock
effect — un-receiving a GRN drops `current_stock`, un-issuing an MRN
adds it back.

---

## 7. Reorder alerts

### `GET /api/reorder-alerts`

Backed by `v_reorder_alerts` (see `database.md` §9.2).

**Auth:** required.

**Query**

| Param       | Type                         |
| ----------- | ---------------------------- |
| `severity`  | `critical` \| `low` \| `watch` |

**Response 200**

```json
{
  "alerts": [
    {
      "itemId": "5",
      "name": "Electrical Cable 2.5mm",
      "category": "Electrical",
      "current": 25,
      "reorder": 100,
      "shortfall": 75,
      "suggested": 200,
      "supplier": "Volta Supplies",
      "severity": "critical"
    }
  ],
  "summary": [
    { "severity": "critical", "count": 1 },
    { "severity": "low",      "count": 2 },
    { "severity": "watch",    "count": 1 }
  ]
}
```

`shortfall` is `reorder - current` clamped to ≥ 0; `suggested` is
`max(reorder × 2, max_stock)`.

---

## 8. Dashboard

### `GET /api/dashboard`

KPIs + last-7-days bar chart.

**Auth:** required.

**Response 200**

```json
{
  "kpis": {
    "totalInStock": 2456,
    "itemsBelowReorder": 23,
    "todayStockIn": 145,
    "todayStockOut": 98
  },
  "weekDays": [
    { "day": "Wed", "in": 90,  "out": 130 },
    { "day": "Thu", "in": 175, "out": 100 },
    { "day": "Fri", "in": 120, "out": 145 },
    { "day": "Sat", "in": 60,  "out": 40  },
    { "day": "Sun", "in": 145, "out": 98  },
    { "day": "Mon", "in": 110, "out": 80  },
    { "day": "Tue", "in": 145, "out": 95  }
  ]
}
```

`weekDays` always has 7 rows, in chronological order, generated via
`generate_series(CURRENT_DATE - 6, CURRENT_DATE)`. Days with no
movements appear with zeros.

---

## 9. Reports

### `GET /api/reports/[slug]`

Backs the **`report-viewer` modal**. The `slug` selects which view to
query and which filters apply.

**Auth:** required.

**Slugs**

| Slug                       | View / source                | Filters (query params)                                 |
| -------------------------- | ---------------------------- | ------------------------------------------------------ |
| `stock-on-hand`            | `v_items_with_status`        | `category` (label string)                              |
| `stock-movement-history`   | `v_stock_movement_history`   | `from`, `to` (ISO date), `kind`                        |
| `project-consumption`      | `v_project_consumption`      | –                                                      |
| `slow-moving`              | `v_slow_moving_items`        | `days` (default 30)                                    |
| `maintenance-usage`        | `v_stock_movement_history` filtered to `kind='maintenance'` | `site` (label), `direction` |

Unknown slugs return `404`.

**Response 200**

```json
{
  "title": "Stock on hand",
  "rows":  [ /* shape varies per slug */ ]
}
```

#### `stock-on-hand` rows

```json
{ "rfq": "RFQ-001", "name": "Cement 50kg", "category": "Structural", "current": 450, "unit": "Bags", "status": "in_stock" }
```

#### `stock-movement-history` rows

```json
{ "date": "2026-04-15T00:00:00.000Z", "direction": "in", "refNo": "GRN-26-001", "item": "Cement 50kg", "qty": 200, "unit": "Bags", "counterparty": "GHACEM Ltd" }
```

`counterparty` is the supplier on `in` rows and the project name on `out`
rows.

#### `project-consumption` rows

```json
{ "wbs": "A", "name": "Asylum Down", "location": "Accra", "itemsIssued": 45, "qtyConsumed": 12500, "lastActivity": "2026-04-20T00:00:00.000Z" }
```

#### `slow-moving` rows

```json
{ "rfq": "RFQ-005", "name": "Electrical Cable 2.5mm", "category": "Electrical", "current": 25, "lastIssued": "2026-03-01T00:00:00.000Z", "daysIdle": 62 }
```

#### `maintenance-usage` rows

```json
{ "refNo": "MAINT-IN-001", "date": "2026-04-15T00:00:00.000Z", "direction": "in", "item": "Generator Belt", "qty": 2, "unit": "Pieces", "site": "Site A", "technician": "Francis Owusu" }
```

`stock-movement-history` is hard-capped at 500 rows server-side; for
larger windows tighten `from` / `to`.

---

## Mapping to UI surfaces

| UI surface                                     | Routes called                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------------ |
| `auth/login` form                              | `signIn("credentials", …)` → `/api/auth/[...nextauth]`                          |
| `auth/signup` form                             | `POST /api/auth/register`, then `signIn(...)`                                   |
| Sidebar (logged-in user block)                 | Reads from `auth()` directly — no API call                                      |
| Dashboard page                                 | `GET /api/dashboard`                                                            |
| `inventory` page + status filter               | `GET /api/items?q=&category=&status=`                                           |
| `add-item` modal                               | `POST /api/items` (lookups via `GET /api/lookups`)                              |
| `edit-item` modal                              | `PATCH /api/items/[id]`                                                         |
| `delete-item` confirmation                     | `DELETE /api/items/[id]`                                                        |
| `projects` table                               | `GET /api/projects`                                                             |
| `add-project` modal                            | `POST /api/projects`                                                            |
| `project-details` modal                        | `GET /api/projects/[id]`                                                        |
| `edit-project` modal                           | `PATCH /api/projects/[id]`                                                      |
| Delete project confirmation                    | `DELETE /api/projects/[id]`                                                     |
| `stock-in` table + `add-stock-in` modal        | `GET/POST /api/stock-movements?kind=operations&direction=in`                    |
| `stock-out` table + `add-stock-out` modal      | `GET/POST /api/stock-movements?kind=operations&direction=out`                   |
| `maintenance` unified ledger                   | `GET /api/stock-movements?kind=maintenance` (+ direction filter)                |
| Delete movement confirmation (any of the above)| `DELETE /api/stock-movements/[id]`                                              |
| `reorder-alerts` page                          | `GET /api/reorder-alerts`                                                       |
| `report-viewer` modal                          | `GET /api/reports/[slug]?...`                                                   |
| Settings → Profile tab                         | `GET/PATCH /api/users/me`                                                       |
| Settings → Notifications tab                   | `GET /api/users/me/notifications`, `PATCH` per toggle                           |

---

## Working examples

```bash
# Sign up
curl -X POST http://localhost:3000/api/auth/register \
  -H 'content-type: application/json' \
  -d '{"fullName":"Ada Lovelace","email":"ada@example.com","password":"opensesame"}'

# After signing in via the UI, your browser holds the session cookie.
# To call APIs from curl, copy the Cookie header from devtools, e.g.:
COOKIE='authjs.session-token=...'

# Inventory list (low stock only)
curl -H "Cookie: $COOKIE" 'http://localhost:3000/api/items?status=low'

# Create an item
curl -X POST -H "Cookie: $COOKIE" -H 'content-type: application/json' \
  -d '{"rfq":"RFQ-006","name":"Sand (trip)","categoryCode":"structural","unitCode":"trips","reorderLevel":5,"maxStock":50}' \
  http://localhost:3000/api/items

# Record a GRN (operations stock-in)
curl -X POST -H "Cookie: $COOKIE" -H 'content-type: application/json' \
  -d '{
        "refNo":"GRN-26-009",
        "direction":"in","kind":"operations",
        "movementDate":"2026-05-02",
        "supplierName":"GHACEM Ltd",
        "departmentCode":"engineering",
        "lines":[{"itemRfq":"RFQ-001","qty":100,"unitCode":"bags"}]
      }' \
  http://localhost:3000/api/stock-movements

# Soft-delete that GRN (the trigger reverses the stock cache)
curl -X DELETE -H "Cookie: $COOKIE" http://localhost:3000/api/stock-movements/100

# Slow-moving stock report (>= 60 days idle)
curl -H "Cookie: $COOKIE" 'http://localhost:3000/api/reports/slow-moving?days=60'
```

---

## Future work

- **Admin endpoints** — bulk role/permission management, password reset
  initiation, user list with status filters.
- **Audit log** read endpoint — exposes the `audit_log` table; needs an
  RBAC story first.
- **Real-time** — `LISTEN/NOTIFY` on `stock_movements` for live UI
  updates of the dashboard and reorder-alerts pages.
- **CSRF** — same-site session cookies + origin checks are already
  enforced by Auth.js; if state-mutating endpoints ever move outside the
  cookie-protected origin (e.g. mobile app), add token-based CSRF.
- **Rate limiting** — none yet. Add at the proxy layer when third-party
  integrations land.
