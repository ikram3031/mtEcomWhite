import { Router } from "express";
import { getSystemInfo, getMetadata, getHealthCheck } from "../controllers/SystemController.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";

const systemRouter = Router();

// Public health check endpoint for uptime and fleet monitoring
systemRouter.get("/health", getHealthCheck);

// Protected endpoint for retrieving system & version information
systemRouter.get(
  "/info",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager", "Super Admin"),
  getSystemInfo
);

// Public utility endpoint for retrieving metadata (order/payment statuses, categories)
systemRouter.get("/metadata", getMetadata);

export default systemRouter;
