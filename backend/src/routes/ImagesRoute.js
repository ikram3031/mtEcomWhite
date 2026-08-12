import { Router } from "express";
import { uploadMiddleware, uploadProductImage } from "../controllers/ImagesController.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";

const imagesRouter = Router();

imagesRouter.get("/resize", async (req, res, next) => {
  try {
    const url = req.query.url;

    if (!url) {
      res.status(400).json({ status: "error", message: "query param `url` is required" });
      return;
    }

    res.redirect(String(url));
  } catch (err) {
    next(err);
  }
});

imagesRouter.post(
  "/upload",
  authenticateToken,
  authorizeRoles("Owner", "Admin"),
  uploadMiddleware,
  uploadProductImage
);

export default imagesRouter;

