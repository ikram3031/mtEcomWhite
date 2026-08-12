import { Router } from "express";
import { getSystemInfo } from "../controllers/SystemController.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";

const systemRouter = Router();

// Protected endpoint for retrieving system & version information
systemRouter.get(
  "/info",
  authenticateToken,
  authorizeRoles("Owner", "Admin", "Manager", "Super Admin"),
  getSystemInfo
);

export default systemRouter;
