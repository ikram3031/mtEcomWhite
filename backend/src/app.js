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

  app.use((req, res, next) => {
    logger.info({ method: req.method, path: req.originalUrl }, "route hit");
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
