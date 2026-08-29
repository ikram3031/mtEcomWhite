-- Cloudflare D1 Serverless SQL Schema for WL-Ecom Fleet Management

CREATE TABLE IF NOT EXISTS clients (
  client_key TEXT PRIMARY KEY,
  brand_name TEXT NOT NULL,
  domain TEXT,
  vps_ip TEXT,
  api_url TEXT,
  dashboard_url TEXT,
  storefront_url TEXT,
  stock_mode TEXT DEFAULT 'product_wise',
  pricing_mode TEXT DEFAULT 'variable',
  policies_json TEXT,
  system_info_json TEXT,
  status TEXT DEFAULT 'healthy',
  last_heartbeat_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS heartbeat_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_key TEXT NOT NULL,
  vps_ip TEXT,
  db_status TEXT,
  memory_rss_mb REAL,
  memory_heap_mb REAL,
  uptime_seconds INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_key) REFERENCES clients(client_key) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS incident_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_key TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_resolved INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  FOREIGN KEY (client_key) REFERENCES clients(client_key) ON DELETE CASCADE
);

-- Indexes for ultra-fast telemetry lookups and pruning
CREATE INDEX IF NOT EXISTS idx_heartbeats_client_time ON heartbeat_logs(client_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
