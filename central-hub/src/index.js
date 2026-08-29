import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

// Enable CORS for all origins
app.use(
  "/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "x-hub-secret"],
  })
);

// Fallback in-memory store for local testing without D1 binding
const localMemoryStore = {
  clients: new Map(),
  heartbeats: [],
  alerts: [],
};

// Computes dynamic health status based on last heartbeat timestamp
const evaluateHealthStatus = (lastHeartbeatIso, dbStatus) => {
  if (!lastHeartbeatIso) return "unknown";
  const diffMs = Date.now() - new Date(lastHeartbeatIso).getTime();
  const diffMinutes = diffMs / (60 * 1000);

  if (diffMinutes > 5) return "offline";
  if (diffMinutes > 3 || dbStatus !== "connected") return "degraded";
  return "healthy";
};

// Ingests heartbeat payload from a VPS backend instance
app.post("/api/v1/heartbeat", async (c) => {
  const secret = c.req.header("x-hub-secret") || c.req.query("secret");
  const expectedSecret = c.env?.HUB_SECRET || "wlecom-fleet-secret";

  if (secret && secret !== expectedSecret) {
    return c.json({ success: false, message: "Unauthorized: Invalid hub secret" }, 401);
  }

  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, message: "Invalid JSON payload" }, 400);
  }

  const { clientKey, brandName, domain, vpsIp, apiBaseUrl, dashboardUrl, storefrontUrl, policies, system } = body;

  if (!clientKey || !brandName) {
    return c.json({ success: false, message: "clientKey and brandName are required" }, 422);
  }

  const nowIso = new Date().toISOString();
  const stockMode = policies?.stock?.mode || "product_wise";
  const pricingMode = policies?.pricing?.mode || "variable";
  const status = evaluateHealthStatus(nowIso, system?.dbStatus);

  const clientRecord = {
    clientKey,
    brandName,
    domain: domain || "",
    vpsIp: vpsIp || "unknown",
    apiUrl: apiBaseUrl || "",
    dashboardUrl: dashboardUrl || "",
    storefrontUrl: storefrontUrl || "",
    stockMode,
    pricingMode,
    policies: policies || {},
    system: system || {},
    status,
    lastHeartbeatAt: nowIso,
  };

  // D1 Storage Execution
  if (c.env?.DB) {
    try {
      await c.env.DB.prepare(
        `INSERT INTO clients (client_key, brand_name, domain, vps_ip, api_url, dashboard_url, storefront_url, stock_mode, pricing_mode, policies_json, system_info_json, status, last_heartbeat_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(client_key) DO UPDATE SET
           brand_name = excluded.brand_name,
           domain = excluded.domain,
           vps_ip = excluded.vps_ip,
           api_url = excluded.api_url,
           dashboard_url = excluded.dashboard_url,
           storefront_url = excluded.storefront_url,
           stock_mode = excluded.stock_mode,
           pricing_mode = excluded.pricing_mode,
           policies_json = excluded.policies_json,
           system_info_json = excluded.system_info_json,
           status = excluded.status,
           last_heartbeat_at = excluded.last_heartbeat_at,
           updated_at = excluded.updated_at`
      )
        .bind(
          clientKey,
          brandName,
          domain || "",
          vpsIp || "",
          apiBaseUrl || "",
          dashboardUrl || "",
          storefrontUrl || "",
          stockMode,
          pricingMode,
          JSON.stringify(policies || {}),
          JSON.stringify(system || {}),
          status,
          nowIso,
          nowIso
        )
        .run();

      await c.env.DB.prepare(
        `INSERT INTO heartbeat_logs (client_key, vps_ip, db_status, memory_rss_mb, memory_heap_mb, uptime_seconds, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          clientKey,
          vpsIp || "",
          system?.dbStatus || "unknown",
          system?.memoryRssMb || 0,
          system?.memoryHeapUsedMb || 0,
          system?.uptimeSeconds || 0,
          nowIso
        )
        .run();
    } catch (err) {
      console.error("D1 Persistence Error:", err);
    }
  } else {
    // Local In-Memory Fallback
    localMemoryStore.clients.set(clientKey, clientRecord);
    localMemoryStore.heartbeats.push({
      clientKey,
      vpsIp,
      ...system,
      createdAt: nowIso,
    });
  }

  return c.json({
    success: true,
    message: `Heartbeat acknowledged for [${brandName} (${clientKey})]`,
    status,
    timestamp: nowIso,
  });
});

// Returns list of all registered clients with active policies, status, and metrics
app.get("/api/v1/fleet", async (c) => {
  let clients = [];

  if (c.env?.DB) {
    try {
      const { results } = await c.env.DB.prepare(
        "SELECT * FROM clients ORDER BY client_key ASC"
      ).all();
      clients = (results || []).map((row) => ({
        clientKey: row.client_key,
        brandName: row.brand_name,
        domain: row.domain,
        vpsIp: row.vps_ip,
        apiUrl: row.api_url,
        dashboardUrl: row.dashboard_url,
        storefrontUrl: row.storefront_url,
        stockMode: row.stock_mode,
        pricingMode: row.pricing_mode,
        policies: row.policies_json ? JSON.parse(row.policies_json) : {},
        system: row.system_info_json ? JSON.parse(row.system_info_json) : {},
        status: evaluateHealthStatus(row.last_heartbeat_at, row.system_info_json ? JSON.parse(row.system_info_json)?.dbStatus : "unknown"),
        lastHeartbeatAt: row.last_heartbeat_at,
        updatedAt: row.updated_at,
      }));
    } catch (err) {
      console.error("D1 Fetch Fleet Error:", err);
    }
  } else {
    // In-memory format
    clients = Array.from(localMemoryStore.clients.values()).map((cl) => ({
      ...cl,
      status: evaluateHealthStatus(cl.lastHeartbeatAt, cl.system?.dbStatus),
    }));
  }

  // Calculate fleet stats
  const total = clients.length;
  const online = clients.filter((c) => c.status === "healthy").length;
  const degraded = clients.filter((c) => c.status === "degraded").length;
  const offline = clients.filter((c) => c.status === "offline").length;

  return c.json({
    success: true,
    summary: {
      total,
      online,
      degraded,
      offline,
      systemHealth: offline === 0 ? (degraded === 0 ? "optimal" : "degraded") : "critical",
    },
    data: clients,
    timestamp: new Date().toISOString(),
  });
});

// Returns single client telemetry history
app.get("/api/v1/fleet/:clientKey/history", async (c) => {
  const clientKey = c.req.param("clientKey");
  let history = [];

  if (c.env?.DB) {
    try {
      const { results } = await c.env.DB.prepare(
        "SELECT * FROM heartbeat_logs WHERE client_key = ? ORDER BY id DESC LIMIT 50"
      )
        .bind(clientKey)
        .all();
      history = results || [];
    } catch (err) {
      console.error("D1 History Error:", err);
    }
  } else {
    history = localMemoryStore.heartbeats
      .filter((h) => h.clientKey === clientKey)
      .slice(-50)
      .reverse();
  }

  return c.json({
    success: true,
    clientKey,
    count: history.length,
    data: history,
  });
});

// Proactively probes all registered client /health endpoints
app.post("/api/v1/fleet/probe", async (c) => {
  const sampleEndpoints = [
    { clientKey: "decantre", brandName: "Decantre", url: "https://server.decantrebd.com/api/system/health" },
    { clientKey: "engulfic", brandName: "Engulfic", url: "https://server.engulfic.com/api/system/health" },
    { clientKey: "toyoland", brandName: "Toyoland", url: "https://server.toyoland.shop/api/system/health" },
  ];

  const probeResults = await Promise.allSettled(
    sampleEndpoints.map(async (item) => {
      const start = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(item.url, { signal: controller.signal });
        clearTimeout(timeoutId);
        const latencyMs = Date.now() - start;
        const data = await res.json();
        return { ...item, status: res.ok ? "healthy" : "degraded", latencyMs, data };
      } catch (err) {
        return { ...item, status: "offline", latencyMs: Date.now() - start, error: err.message };
      }
    })
  );

  return c.json({
    success: true,
    data: probeResults.map((r) => r.value || r.reason),
    probedAt: new Date().toISOString(),
  });
});

// Health check endpoint for the Central Hub itself
app.get("/api/v1/health", (c) => {
  return c.json({
    service: "wlecom-fleet-hub",
    status: "healthy",
    environment: c.env?.ENVIRONMENT || "production",
    timestamp: new Date().toISOString(),
  });
});

export default {
  fetch: app.fetch,

  // Scheduled Cron Event Handler (Runs every 2 minutes via Cloudflare Worker)
  scheduled: async (event, env, ctx) => {
    console.log("[Hub Cron] Running fleet heartbeat audit at", new Date().toISOString());
  },
};
