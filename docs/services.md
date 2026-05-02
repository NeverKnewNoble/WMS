# Warehouse MS — Service layer

The service layer in `src/services/**` is the only place the client talks
to the API. Pages call typed functions like `listItems(...)` and
`createMovement(...)`; the services handle the fetch, parse errors into a
typed `ApiError`, raise a toast, and rethrow so the caller can branch on
status.

> Pair this with [`api.md`](./api.md) (request / response shapes) and
> [`database.md`](./database.md) (relational model). Types live in
> `src/types/**` and are imported by both the services and the pages.

---

## Layout

```
src/services/
├── http.ts              ← fetch wrapper + ApiError + qs() builder
├── toast.ts             ← sonner integration + failWithToast()
├── use-service.ts       ← client React hook { data, loading, error, refetch }
├── auth.ts              ← registerAndSignIn, signIn, signOut
├── users.ts             ← getMe, updateMe, notification prefs
├── lookups.ts           ← getLookups (every dropdown in one call)
├── items.ts             ← listItems / getItem / create / update / delete
├── projects.ts          ← listProjects / getProject / create / update / delete
├── stock-movements.ts   ← listMovements / getMovement / createMovement / deleteMovement
├── reorder-alerts.ts    ← getReorderAlerts
├── dashboard.ts         ← getDashboard
└── reports.ts           ← getStockOnHandReport / … / getReport (generic dispatcher)
```

All types referenced by these files are imported from `@/types/**`. None
are declared inline — that means a page can `import type { ApiItem }
from "@/types/items"` without dragging the service file into its bundle.

---

## Conventions

### 1. Every service returns the parsed JSON, fully typed

```ts
const items = await listItems({ status: "low" });
//      ^? ItemsListResponse  =  { data: ApiItem[]; total: number; ... }
```

`ApiError` is thrown on non-2xx, rejected JSON, or network failure.

### 2. Every catch block calls `failWithToast(err, fallback)`

```ts
export async function listItems(query: ListItemsQuery = {}) {
  try {
    return await http.get<ItemsListResponse>(`/api/items${qs(query)}`);
  } catch (err) {
    failWithToast(err, "Could not load items");  // shows a sonner toast + rethrows
  }
}
```

`failWithToast` returns `never`, so the function's declared return type is
preserved (TypeScript knows the catch branch can't continue).

### 3. IDs are strings on the wire

The API serializes `BIGINT` as `string` (so we don't lose precision on
values past 2⁵³). Service functions accept and return string IDs:

```ts
await deleteItem("42");   // ok
await deleteItem(42);     // ❌ type error
```

### 4. Pages never call `fetch`

Pages call services. Services call `http.get / post / patch / delete`,
which under the hood is `fetch` with `credentials: "same-origin"` and
JSON content-type. If you find yourself reaching for `fetch` in a page,
add a service function instead.

---

## `http.ts` — the base wrapper

```ts
import { http, qs, ApiError } from "@/services/http";
```

| Export    | Signature                                              |
| --------- | ------------------------------------------------------ |
| `http.get`     | `<T>(path, init?) => Promise<T>`                  |
| `http.post`    | `<T>(path, body, init?) => Promise<T>`            |
| `http.patch`   | `<T>(path, body, init?) => Promise<T>`            |
| `http.delete`  | `<T>(path, init?) => Promise<T>`                  |
| `qs(params)`   | object → `?a=1&b=2` (skips null/undefined/empty)  |
| `ApiError`     | `class { status: number; message: string; body }` |
| `rethrow`      | helper that wraps an unknown into `ApiError` and throws |

`http.*` swallows responses with no body (204 No Content) as `undefined`
and parses everything else as JSON. On non-2xx, the wrapper:

1. Reads the response body as text.
2. Tries to JSON-parse it.
3. Pulls `{ error }` if present, else falls back to `Request failed with <status>`.
4. Throws `new ApiError(status, message, parsedBody)`.

You usually don't need to import `ApiError` in a service — but in pages
you'll often check it:

```ts
import { ApiError } from "@/services/http";

try { await deleteItem(id); }
catch (err) {
  if (err instanceof ApiError && err.status === 401) router.push("/auth/login");
}
```

---

## `toast.ts` — error and success feedback

The service layer integrates with [sonner](https://sonner.emilkowal.ski).
A `<Toaster />` is mounted globally in `src/app/layout.tsx`, so any
service call from a client component can pop a toast.

```ts
import {
  showApiErrorToast,
  failWithToast,
  showSuccessToast,
} from "@/services/toast";
```

| Function                                | Purpose                                     |
| --------------------------------------- | ------------------------------------------- |
| `failWithToast(err, fallback): never`   | Used inside every service catch block.      |
| `showApiErrorToast(err, fallback)`      | Same toast, but doesn't throw.              |
| `showSuccessToast(msg, description?)`   | Positive feedback after a mutation.         |

**Toast content** — title is the friendly fallback ("Could not load
items"); description is the underlying error message ("Not authenticated",
"Validation failed", …). When the two are identical, the description is
omitted to avoid the "X / X" look.

**SSR safety** — every helper guards on `typeof window === "undefined"`
and no-ops on the server. So a service used inside a Server Component
won't crash; it just won't toast (server actions can surface errors via
their normal channels).

---

## `use-service.ts` — the client data hook

```ts
import { useService } from "@/services/use-service";
import { listItems } from "@/services/items";

export default function Page() {
  const { data, loading, error, refetch } = useService(() => listItems(), []);
  // ...
}
```

The hook:

- Sets `loading` to `true` and clears `error` on every run.
- Calls `loader()` once on mount — and again whenever `deps` change.
- Cancels stale results: if you `refetch()` before the previous request
  settles, only the latest one lands in state.
- Doesn't show its own toast — the service already did. `error` is
  surfaced as an `ApiError` so the caller can render an inline message
  if it wants.

`refetch` is the standard "optimistic-after-mutation" tool:

```ts
async function handleDelete(id: string) {
  await deleteItem(id);          // service throws on failure (toast already shown)
  showSuccessToast("Item deleted");
  refetch();                     // pulls a fresh list
}
```

---

## Endpoint summary

Each service function maps 1:1 to an endpoint in `api.md`. Click through
to that doc for full request/response payloads.

### Auth — `services/auth.ts`

| Function                            | Endpoint                                   |
| ----------------------------------- | ------------------------------------------ |
| `registerAndSignIn(payload)`        | `POST /api/auth/register` + `signIn(...)`  |
| `signInWithCredentials(email, pw)`  | `signIn("credentials", …)`                 |
| `signOut()`                         | `signOut({ callbackUrl: "/auth/login" })`  |

### Users — `services/users.ts`

| Function                                       | Endpoint                                  |
| ---------------------------------------------- | ----------------------------------------- |
| `getMe()`                                      | `GET /api/users/me`                       |
| `updateMe(payload)`                            | `PATCH /api/users/me`                     |
| `getNotificationPreferences()`                 | `GET /api/users/me/notifications`         |
| `setNotificationPreference(key, enabled)`      | `PATCH /api/users/me/notifications`       |

### Lookups — `services/lookups.ts`

| Function       | Endpoint            |
| -------------- | ------------------- |
| `getLookups()` | `GET /api/lookups`  |

### Items — `services/items.ts`

| Function                          | Endpoint                  |
| --------------------------------- | ------------------------- |
| `listItems(query?)`               | `GET /api/items`          |
| `getItem(id)`                     | `GET /api/items/[id]`     |
| `createItem(payload)`             | `POST /api/items`         |
| `updateItem(id, payload)`         | `PATCH /api/items/[id]`   |
| `deleteItem(id)`                  | `DELETE /api/items/[id]`  |

### Projects — `services/projects.ts`

| Function                          | Endpoint                       |
| --------------------------------- | ------------------------------ |
| `listProjects(query?)`            | `GET /api/projects`            |
| `getProject(id)`                  | `GET /api/projects/[id]`       |
| `createProject(payload)`          | `POST /api/projects`           |
| `updateProject(id, payload)`      | `PATCH /api/projects/[id]`     |
| `deleteProject(id)`               | `DELETE /api/projects/[id]`    |

### Stock movements — `services/stock-movements.ts`

| Function                       | Endpoint                            |
| ------------------------------ | ----------------------------------- |
| `listMovements(query?)`        | `GET /api/stock-movements`          |
| `getMovement(id)`              | `GET /api/stock-movements/[id]`     |
| `createMovement(payload)`      | `POST /api/stock-movements`         |
| `deleteMovement(id)`           | `DELETE /api/stock-movements/[id]`  |

`createMovement` runs a small client-side validator (`validateMovementShape`)
that mirrors the server's `kind`/`direction` CHECK constraint. It throws
`ApiError(400, "...")` before any network call when:

- `lines` is empty
- `kind=operations & direction=in` and `supplierName` is missing
- `kind=operations & direction=out` and `projectWbs` is missing
- `kind=maintenance` and `siteCode` is missing

The toast uses the same `ApiError`, so the user sees a meaningful message
instantly instead of waiting for the server round-trip.

### Reorder alerts — `services/reorder-alerts.ts`

| Function                                | Endpoint                  |
| --------------------------------------- | ------------------------- |
| `getReorderAlerts({ severity? })`       | `GET /api/reorder-alerts` |

### Dashboard — `services/dashboard.ts`

| Function           | Endpoint               |
| ------------------ | ---------------------- |
| `getDashboard()`   | `GET /api/dashboard`   |

### Reports — `services/reports.ts`

| Function                                                  | Endpoint                              |
| --------------------------------------------------------- | ------------------------------------- |
| `getStockOnHandReport(filters?)`                          | `GET /api/reports/stock-on-hand`      |
| `getStockMovementHistoryReport(filters?)`                 | `GET /api/reports/stock-movement-history` |
| `getProjectConsumptionReport()`                           | `GET /api/reports/project-consumption` |
| `getSlowMovingReport(filters?)`                           | `GET /api/reports/slow-moving`        |
| `getMaintenanceUsageReport(filters?)`                     | `GET /api/reports/maintenance-usage`  |
| `getReport<S>(slug, filters?)`                            | `GET /api/reports/[slug]`             |

The generic `getReport<S extends ReportSlug>(slug, filters)` is what the
**Report viewer modal** uses — the `ReportRow<S>` and `ReportFilters<S>`
conditional types in `@/types/reports` give callers a typed `rows` array
and full filter autocomplete:

```ts
// rows is typed as SlowMovingRow[]
const { rows } = await getReport("slow-moving", { days: 60 });

// ❌ type error: "category" is not a SlowMovingFilters key
await getReport("slow-moving", { category: "Structural" });
```

---

## Recipes

### Read-only page (the most common pattern)

```tsx
"use client";
import { listItems }    from "@/services/items";
import { useService }   from "@/services/use-service";

export default function InventoryPage() {
  const { data, loading } = useService(() => listItems(), []);
  const items = data?.data ?? [];

  if (loading && items.length === 0) return <p>Loading…</p>;
  if (items.length === 0)            return <p>No items yet.</p>;

  return <table>{/* render items */}</table>;
}
```

### Mutation with refresh

```tsx
const { data, refetch } = useService(() => listItems(), []);

async function handleDelete(id: string) {
  try {
    await deleteItem(id);
    showSuccessToast("Item deleted");
    refetch();              // <-- refresh the list
  } catch {
    // service already showed an error toast — keep the dialog open
  }
}
```

### Branching on HTTP status

```ts
import { ApiError } from "@/services/http";

try {
  await updateMe({ fullName: "Ada Lovelace" });
} catch (err) {
  if (err instanceof ApiError && err.status === 409) {
    // Conflict — e.g. email already taken on a future endpoint
  }
}
```

### Driving a search box (deps-based refetch)

```tsx
const [q, setQ] = useState("");
const { data, loading } = useService(() => listItems({ q }), [q]);
```

The hook tears down the in-flight request and starts a new one whenever
`q` changes; the `requestId` ref discards stale results.

---

## Adding a new service

1. **Schema first.** Add the model + migration to `prisma/schema.prisma`
   and `prisma/migrations/`. Add view/trigger SQL to the supplementary
   migration if the API needs them.
2. **Route handler.** Drop a new file under `src/app/api/<thing>/route.ts`
   following the patterns in `api.md`. Use `withApi(...)` so unhandled
   errors become JSON.
3. **Types.** Declare request / response / payload types in
   `src/types/<thing>.ts`. Reuse `lookups.ts` types where possible
   (categories, units, suppliers, …).
4. **Service.** Add `src/services/<thing>.ts` with one async function
   per route. Each function is a 5-line `try { await http.* }` /
   `catch (err) { failWithToast(err, "<friendly message>") }` block.
5. **Doc.** Add a section to `api.md` and a row to the endpoint summary
   table in this file.

---

## Open questions / future work

- **Optimistic updates.** `useService` is pull-only today. For
  high-frequency mutations (toggle switches in Settings, etc.) we may
  add an `optimistic` argument that mutates `data` locally, then
  reconciles with the server response.
- **Caching across pages.** No SWR / React-Query layer yet; every
  navigation refetches. Likely fine until the app gets pages that share
  the same list (e.g. `lookups` is fetched anew per modal).
- **Streaming reports.** The 500-row cap on `stock-movement-history` is
  enough for the modal but not for an export. When the Excel/PDF
  buttons get wired, we'll add a streaming variant.
- **Polling.** `useService` doesn't poll. The dashboard could benefit —
  add an `interval` prop or a simple `setInterval(refetch, …)` from the
  caller.
