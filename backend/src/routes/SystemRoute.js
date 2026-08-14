import { Router } from "express";
import { getSystemInfo, getMetadata } from "../controllers/SystemController.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";

const systemRouter = Router();

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
