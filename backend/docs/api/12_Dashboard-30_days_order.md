# Dashboard API — Daily Orders

Endpoint: `GET /api/v1/dashboard/orders/daily`

Summary
- Returns daily order counts for a recent date range (default last 30 days). Useful for dashboard charts and quick metrics.

Query parameters
- `days` (optional): integer number of days to return, default `30`. Minimum `1`.

Response
- Success response (HTTP 200) returns JSON with `status` and `data` fields.

Example response

```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "success",
  "data": [
    { "date": "2026-07-02", "count": 0 },
    { "date": "2026-07-03", "count": 2 },
    { "date": "2026-07-04", "count": 5 },
    ...
  ]
}
```

Notes
- Dates are returned in `YYYY-MM-DD` format (UTC, start of day). The array length equals the requested `days` and is ordered from oldest → newest.
- Missing days are filled with `count: 0` so charts do not need to fill gaps client-side.
- The endpoint is implemented in `backend/src/controllers/DashboardController.js` and mounted at `/api/v1/dashboard/orders/daily`.

Implementation details
- The backend uses a MongoDB aggregation that groups `orders` by the `createdAt` date string and sums counts per day. After aggregation the controller fills in any missing days in the requested window.

Client usage (frontend)
- Hook: `dashboard/hooks/use-order-counts.ts`

Example (curl)

```bash
curl "http://localhost:3000/api/v1/dashboard/orders/daily?days=30"
```

Example (frontend fetch)

```ts
import { apiClient } from '@/lib/api-client';

async function fetchDailyOrders(days = 30) {
  const res = await apiClient.get('/api/v1/dashboard/orders/daily', { params: { days } });
  return res.data?.data ?? [];
}
```

Errors
- On server error the endpoint will forward the error to the standard error handler and return a 5xx status.

Security & Authorization
- Current implementation registers the route without role-based guards in `backend/src/app.js`. If this endpoint should be protected, add an authorization middleware (e.g. `authorizeRoles`) to the route in `backend/src/routes/DashboardRoute.js`.

Change log
- 2026-07-31: Added `dailyOrders` aggregation endpoint and documentation.
