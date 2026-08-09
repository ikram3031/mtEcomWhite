import express from "express";
import path from "path";
import cors from "cors";
import { errorHandler } from "./core/middlewares/errorHandler.js";
import { authenticateToken, authorizeRoles } from "./core/middlewares/auth.middleware.js";
import fs from "fs";
import { logger } from "./config/logger.js";
import coreRouter from "./core/routesIndex.js";
import attributeRouter from "./dashboard/routes/attribute.route.js";

export async function createApp() {
  const app = express();

  app.set("wpTablePrefix", process.env.WP_TABLE_PREFIX || "wp_");
  app.set("trust proxy", true);
  const corsOptions = {
    origin: [
      "http://decantrebd.com",
      "https://decantrebd.com",
      "http://www.decantrebd.com",
      "https://www.decantrebd.com",
      "http://dashboard.decantrebd.com",
      "https://dashboard.decantrebd.com",
      "http://localhost:8001",
      "http://localhost:8005",
      "https://localhost:8005",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
    credentials: false,
    optionsSuccessStatus: 204,
  };

  app.use(cors(corsOptions));
  app.options(/(.*)/, cors(corsOptions));

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
  app.use(
    "/src/uploads",
    express.static(path.join(process.cwd(), "src", "uploads")),
  );

  // Helper to format transfer byte size
  function formatBytes(bytes) {
    if (!bytes || isNaN(bytes) || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  app.use((req, res, next) => {
    const startTime = process.hrtime();
    
    // Robust IP extraction logic
    const xRealIp = req.headers["x-real-ip"];
    const xForwardedFor = req.headers["x-forwarded-for"];
    const rawIp = xRealIp || (xForwardedFor ? xForwardedFor.split(",")[0].trim() : null) || req.ip || req.socket?.remoteAddress || "Unknown IP";
    
    // Clean IPv6 prefix if present (e.g. ::ffff:103.145.xx.xx)
    const clientIp = rawIp.replace(/^::ffff:/, "");

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
        yellow: "\x1b[33m",
        boldWhite: "\x1b[1m\x1b[37m",
        GET: "\x1b[32mGET   \x1b[0m",
        POST: "\x1b[33mPOST  \x1b[0m",
        PUT: "\x1b[34mPUT   \x1b[0m",
        PATCH: "\x1b[35mPATCH \x1b[0m",
        DELETE: "\x1b[31mDELETE\x1b[0m",
      };

      const methodStr = colors[req.method] || (req.method + "      ").slice(0, 6);
      const timePadded = `${timeMs}ms`.padStart(6, " ");
      const sizePadded = sizeStr.padStart(8, " ");
      const statusPadded = `${statusColor}${status}${colors.reset}`;

      // Prevent URL from breaking onto new lines by limiting/truncating ultra-long query strings
      let displayUrl = req.originalUrl;
      if (displayUrl.length > 65) {
        displayUrl = displayUrl.slice(0, 62) + "...";
      }

      console.log(
        `${colors.gray}[${now}]${colors.reset} ` +
        `${statusIcon} ${statusPadded} | ` +
        `${colors.yellow}${timePadded}${colors.reset} | ` +
        `${colors.cyan}${sizePadded}${colors.reset} | ` +
        `${colors.gray}[IP: ${clientIp}]${colors.reset} | ` +
        `${methodStr} ${colors.boldWhite}${displayUrl}${colors.reset}`
      );
    });

    next();
  });

  app.get("/", (req, res) => {
    res.json({ "API is live": true });
  });

  app.use("/api/v1", coreRouter);
  app.use("/api/v1", attributeRouter);

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
