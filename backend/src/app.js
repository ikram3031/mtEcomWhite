import express from "express";
import path from "path";
import cors from "cors";
import { errorHandler } from "./middlewares/errorHandler.js";
import { authenticateToken, authorizeRoles } from "./middlewares/auth.middleware.js";
import fs from "fs";
import { logger } from "./config/logger.js";
import coreRouter from "./routesIndex.js";
import attributeRouter from "./dashboard/routes/attribute.route.js";
import mediaAuditRouter from "./dashboard/routes/mediaAuditRoute.js";
import developerRouter, { broadcastLogToClients } from "./routes/DeveloperRoute.js";
import { env } from "./config/env.js";

export async function createApp() {
  const app = express();

  app.set("wpTablePrefix", process.env.WP_TABLE_PREFIX || "wp_");
  app.set("trust proxy", true);

  const defaultOrigins = [
    "https://decantrebd.com",
    "https://www.decantrebd.com",
    "https://dashboard.decantrebd.com",
    "http://dashboard.decantrebd.com",
    "https://service.decantrebd.com",
    "https://server.decantrebd.com",
    "https://engulfic.com",
    "https://www.engulfic.com",
    "https://dashboard.engulfic.com",
    "https://server.engulfic.com",
    "https://toyoland.shop",
    "https://www.toyoland.shop",
    "https://dashboard.toyoland.shop",
    "https://server.toyoland.shop",
    "https://kawaiikutir.shop",
    "https://www.kawaiikutir.shop",
    "https://admin.kawaiikutir.shop",
    "https://dashboard.kawaiikutir.shop",
    "https://server.kawaiikutir.shop",
    "http://localhost:8001",
    "http://localhost:8005",
    "http://localhost:3000",
    "http://localhost:5173",
  ];

  const envOrigins = env.ALLOWED_ORIGINS
    ? env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
    : [];

  const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowedExplicit = allowedOrigins.includes("*") || allowedOrigins.includes(origin);
      if (isAllowedExplicit) {
        return callback(null, true);
      }

      const isKnownClientDomain =
        origin.includes("toyoland") ||
        origin.includes("kawaiikutir") ||
        origin.includes("engulfic") ||
        origin.includes("decantre") ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1");

      if (isKnownClientDomain) {
        return callback(null, true);
      }

      logger.warn(`CORS request from origin ${origin} - allowed as dynamic client origin`);
      callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Access-Control-Request-Method",
      "Access-Control-Request-Headers",
    ],
    credentials: true,
    optionsSuccessStatus: 204,
  };

  app.use(cors(corsOptions));
  app.options(/(.*)/, cors(corsOptions));

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
  app.use("/src/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Helper to format transfer byte size
  function formatBytes(bytes) {
    if (!bytes || isNaN(bytes) || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  // Helper to detect request origin source
  function getRequestSource(req) {
    const origin = (req.headers["origin"] || req.headers["referer"] || "").toLowerCase();

    const dashboardKeywords = env.DASHBOARD_DOMAIN_KEYWORDS
      ? env.DASHBOARD_DOMAIN_KEYWORDS.split(",").map((kw) => kw.trim().toLowerCase())
      : ["dashboard"];
    const frontendKeywords = env.FRONTEND_DOMAIN_KEYWORDS
      ? env.FRONTEND_DOMAIN_KEYWORDS.split(",").map((kw) => kw.trim().toLowerCase())
      : ["localhost", "decantrebd.com"];

    const isDashboard = dashboardKeywords.some((kw) => origin.includes(kw)) ||
      (req.originalUrl && req.originalUrl.includes("/dashboard/"));
    if (isDashboard) {
      return "DASHBOARD";
    }

    const isFrontend = frontendKeywords.some((kw) => origin.includes(kw));
    if (isFrontend) {
      return "FRONTEND";
    }

    return "EXTERNAL";
  }

  app.use((req, res, next) => {
    // Ignore internal developer log telemetry endpoints from being logged to prevent feedback loops
    if (req.originalUrl && req.originalUrl.startsWith("/api/v1/developer/logs")) {
      return next();
    }

    const startTime = process.hrtime();

    // Robust IP extraction logic
    const xRealIp = req.headers["x-real-ip"];
    const xForwardedFor = req.headers["x-forwarded-for"];
    const rawIp = xRealIp || (xForwardedFor ? xForwardedFor.split(",")[0].trim() : null) || req.ip || req.socket?.remoteAddress || "Unknown IP";

    // Clean IPv6 prefix if present (e.g. ::ffff:103.145.xx.xx)
    const clientIp = rawIp.replace(/^::ffff:/, "");
    const source = getRequestSource(req);

    const now = new Date().toLocaleTimeString("en-US", { hour12: false });

    res.on("finish", () => {
      const diff = process.hrtime(startTime);
      const timeMs = Math.round(diff[0] * 1000 + diff[1] / 1e6);

      const contentLength = res.get("content-length") || 0;
      const sizeStr = formatBytes(Number(contentLength));

      const status = res.statusCode;
      let statusColor = "\x1b[32m"; // Green 2xx
      let statusIcon = "🟢";
      if (status >= 500) {
        statusColor = "\x1b[31m"; // Red 5xx
        statusIcon = "🔴";
      } else if (status >= 400) {
        statusColor = "\x1b[33m"; // Yellow 4xx
        statusIcon = "⚠️ ";
      } else if (status >= 300) {
        statusColor = "\x1b[36m"; // Cyan 3xx
        statusIcon = "🔵";
      }

      const colors = {
        reset: "\x1b[0m",
        gray: "\x1b[90m",
        cyan: "\x1b[36m",
        purple: "\x1b[35m",
        magenta: "\x1b[35m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        boldWhite: "\x1b[1m\x1b[37m",
        GET: "\x1b[32mGET   \x1b[0m",
        POST: "\x1b[33mPOST  \x1b[0m",
        PUT: "\x1b[34mPUT   \x1b[0m",
        PATCH: "\x1b[35mPATCH \x1b[0m",
        DELETE: "\x1b[31mDELETE\x1b[0m",
      };

      const sourceTag =
        source === "DASHBOARD"
          ? `${colors.purple}[DASHBOARD]${colors.reset}`
          : source === "FRONTEND"
            ? `${colors.green}[FRONTEND ]${colors.reset}`
            : `${colors.yellow}[EXTERNAL ]${colors.reset}`;

      const methodStr = colors[req.method] || (req.method + "      ").slice(0, 6);
      const timePadded = `${timeMs}ms`.padStart(6, " ");
      const sizePadded = sizeStr.padStart(8, " ");
      const statusPadded = `${statusColor}${status}${colors.reset}`;

      // Prevent URL from breaking onto new lines by limiting/truncating ultra-long query strings
      let displayUrl = req.originalUrl;
      if (displayUrl.length > 60) {
        displayUrl = displayUrl.slice(0, 57) + "...";
      }

      console.log(
        `${colors.gray}[${now}]${colors.reset} ` +
        `${statusIcon} ${statusPadded} | ` +
        `${sourceTag} | ` +
        `${colors.yellow}${timePadded}${colors.reset} | ` +
        `${colors.cyan}${sizePadded}${colors.reset} | ` +
        `${colors.gray}[IP: ${clientIp}]${colors.reset} | ` +
        `${methodStr} ${colors.boldWhite}${displayUrl}${colors.reset}`
      );

      // Stream / broadcast to the live logs dashboard client
      try {
        broadcastLogToClients({
          timestamp: now,
          status,
          source,
          duration: timeMs,
          size: sizeStr,
          ip: clientIp,
          method: req.method,
          url: req.originalUrl,
        });
      } catch (err) {
        // Fallback for ESM imports / dev cycles
      }
    });

    next();
  });

  app.get("/", (req, res) => {
    res.json({ "API is live": true });
  });

  app.use("/api/v1", coreRouter);
  app.use("/api/v1", attributeRouter);
  app.use("/api/v1/developer", developerRouter);

  // Admin Media Audit & Cloudflare R2 Synchronization Routes
  app.use("/v1/api/admin/media-audit", mediaAuditRouter);
  app.use("/api/v1/admin/media-audit", mediaAuditRouter);

  app.get("/api/v1/version", authenticateToken, authorizeRoles("Owner", "Admin"), (req, res) => {
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf-8"));
      res.json({ status: "success", version: packageJson.version });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Could not read version" });
    }
  });

  app.use((req, res) => {
    res.status(404).json({ status: "error", message: "Resource not found" });
  });

  app.use(errorHandler);

  return app;
}
