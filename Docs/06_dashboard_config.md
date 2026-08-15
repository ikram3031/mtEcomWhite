# Dashboard Client-Wise Configuration System

This document describes how the white-label dashboard manages client-specific configuration settings (themes, brand logos, menu permissions, API base URLs, and route access guards) for Decantre, Engulfic, Toyland, and future multi-tenant clients.

---

## 1. Directory and File Structure

All client configurations reside in the `dashboard/src/clientConfig` directory. Folder names start with two-digit identifiers using camelCase naming conventions:

```
dashboard/src/
└── clientConfig/
    ├── 01decantre/
    │   └── config.json       # Decantre configuration
    ├── 02engulfic/
    │   └── config.json       # Engulfic configuration
    ├── 03toyoland/
    │   └── config.json       # Toyoland configuration
    └── index.js              # Dynamically resolves active client config
```

---

## 2. Dynamic Client Resolution

The configuration system resolves the active client using the following order of precedence:

1. **Environment Variable:** Inspects `import.meta.env.VITE_CLIENT` (set during dev/build time).
2. **Dynamic Hostname Matching:** Dynamically matches `window.location.hostname` against registered keys in `clientConfigs` (e.g. `Object.keys(clientConfigs).find(key => hostname.includes(key))`), ensuring scalable multi-tenant client resolution without hardcoded `if-else` blocks.
3. **Default:** Defaults to `'decantre'` (Client ID: `01`).

The resolver is exported from [`src/clientConfig/index.js`](file:///f:/AFull/dashboard/src/clientConfig/index.js):
```javascript
const getClientFromHostname = () => {
  if (typeof window === 'undefined') return 'decantre';
  const hostname = window.location.hostname.toLowerCase();
  const matchedKey = Object.keys(clientConfigs).find((key) => hostname.includes(key));
  return matchedKey || 'decantre';
};

const activeKey = envClient || getClientFromHostname();

export const clientConfig = clientConfigs[activeKey] || decantreConfig;
```

---

## 3. Configuration File Schema (`config.json`)

Each client configuration is written as a JSON file matching the schema below:

```json
{
  "clientId": "03",
  "clientKey": "toyoland",
  "brandName": "Toyoland",
  "apiBaseUrl": "https://server.toyolandbd.com",
  "allowedMenus": [
    "overview",
    "orders",
    "orders.new",
    "orders.list",
    "products",
    "products.new",
    "products.list",
    "products.categories",
    "products.brands",
    "products.attributes",
    "products.coupons",
    "members",
    "reports"
  ],
  "theme": {
    "light": {
      "--primary": "#059669",
      "--ring": "#059669",
      "--sidebar-primary": "#059669"
    },
    "dark": {
      "--primary": "#34d399",
      "--ring": "#34d399",
      "--sidebar-primary": "#34d399"
    }
  }
}
```

### Properties:
* **clientId:** Two-digit numeric ID assigned to the client.
* **clientKey:** Unique, lowercase key representing the client.
* **brandName:** Human-readable client brand name.
* **apiBaseUrl:** Target production backend API URL for the client (e.g. `https://server.toyolandbd.com`, `https://server.engulfic.com`, `https://service.decantrebd.com`). Used directly by `apiClient`.
* **allowedMenus:** List of parent menus and sub-menus that this client has permission to access.
* **theme:** Contains CSS custom properties (`--primary`, `--ring`, etc.) to be injected at runtime for `light` and `dark` modes.

---

## 4. Dynamic API Base URL Resolution

The API client ([`src/lib/api-client.js`](file:///f:/AFull/dashboard/src/lib/api-client.js)) determines the active API endpoint directly from `clientConfig.apiBaseUrl`:

```javascript
const baseURL =
  import.meta.env?.VITE_API_BASE_URL ||
  (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_BASE_URL : undefined) ||
  clientConfig?.apiBaseUrl ||
  'https://service.decantrebd.com';
```

- **Zero Hardcoded If-Else Blocks:** Eliminates hardcoded hostname checks for individual clients. Adding a new client automatically configures its API endpoint.
- **Local Development:** When running the dashboard locally (e.g. `npm run dev:toyoland`), `apiClient` connects directly to the client's live backend API (`https://server.toyolandbd.com`) without requiring local backend instances.

---

## 5. Theme Integration System

Tailwind CSS v4 maps theme colors directly to CSS variables (e.g. `--color-primary: var(--primary)`). 
The [`clientThemeProvider.jsx`](file:///f:/AFull/dashboard/src/components/core/clientThemeProvider.jsx) reads the configuration `theme` key and dynamically injects them into a `<style>` block in the document header at runtime:

```javascript
// Example Injection
:root {
  --primary: #059669 !important;
  --ring: #059669 !important;
}
.dark {
  --primary: #34d399 !important;
}
```

This dynamically adjusts the entire color scheme without requiring separate compiled CSS stylesheets for each client.

> [!TIP]
> **Overriding Additional CSS variables:**
> The `clientThemeProvider` dynamically loops over all keys defined in the client's `theme.light` and `theme.dark` configurations. You can override *any* custom properties defined inside `index.css` (such as `--background`, `--foreground`, `--card`, `--muted`, `--accent`, etc.) by simply adding them to the client's `config.json`.

---

## 6. Menu Permissions & Route Guarding

### UI Sidebar Filtering
The [`appSidebar.jsx`](file:///f:/AFull/dashboard/src/components/core/dashboard/appSidebar.jsx) uses a `hasAccess` helper function to filter rendered menu items:
```javascript
const allowedMenus = clientConfig.allowedMenus || [];
const hasAccess = (key) => allowedMenus.includes(key);
```
If a key is not present in `allowedMenus`, the sidebar item and its submenus will not render.

### Route Guarding (Address Bar URL Protection)
To prevent users from typing off-limit paths directly in the browser address bar (e.g., `/dashboard/billing`), we wrap layout outlets in the [`clientRouteGuard.jsx`](file:///f:/AFull/dashboard/src/components/core/clientRouteGuard.jsx) component. It checks the active path, extracts the required permission, and redirects users to `/dashboard` if access is denied.

---

## 7. How to Run/Build for a Specific Client

Create a `.env.[client]` file in the root of the `dashboard` directory specifying the target client:
```env
# .env.engulfic
VITE_CLIENT=engulfic
```

Run target scripts defined in `package.json`:

```bash
# Run Decantre Dev environment
npm run dev:decantre

# Build Engulfic dashboard for deployment
npm run build:engulfic

# Run Toyland Dev environment
npm run dev:toyoland
```
