import { Router } from "express";
import productsRouter from "./ProductsRoute.js";
import reviewRouter from "./ReviewRoute.js";
import imagesRouter from "./ImagesRoute.js";
import authRouter from "./AuthRoute.js";
import assetsRouter from "./AssetsRoute.js";
import ordersRouter from "./OrdersRoute.js";
import paymentsRouter from "./PaymentsRoute.js";
import categoriesRouter from "./CategoryRoute.js";
import brandRouter from "./BrandRoute.js";
import couponRouter from "./CouponRoute.js";
import searchRouter from "./SearchRoute.js";
import subscriberRouter from "./SubscriberRoute.js";
import contactRouter from "./ContactRoute.js";
import storeUtilsRouter from "./StoreUtilsRoute.js";
import sizeChartRouter from "./SizeChartRoute.js";
import { searchProducts } from "../controllers/SearchController.js";

const storefrontRouter = Router();

// Storefront customer-facing endpoints
storefrontRouter.use("/products", productsRouter);
storefrontRouter.use("/reviews", reviewRouter);
storefrontRouter.use("/images", imagesRouter);
storefrontRouter.use("/auth", authRouter);
storefrontRouter.use("/assets", assetsRouter);
storefrontRouter.use("/orders", ordersRouter);
storefrontRouter.use("/payments", paymentsRouter);
storefrontRouter.use("/categories", categoriesRouter);
storefrontRouter.use("/brands", brandRouter);
storefrontRouter.use("/coupons", couponRouter);
storefrontRouter.use("/size-charts", sizeChartRouter);
storefrontRouter.use("/subscribers", subscriberRouter);
storefrontRouter.use("/contact", contactRouter);
storefrontRouter.use("/store-utils", storeUtilsRouter);
storefrontRouter.use("/search", searchRouter);
storefrontRouter.get("/search-products", searchProducts);

// Resolves client IP from request headers or socket
storefrontRouter.get("/client-ip", (req, res) => {
  const ip =
    req.headers["cf-connecting-ip"] ||
    req.headers["x-real-ip"] ||
    req.headers["x-forwarded-for"]?.split(",")?.[0]?.trim() ||
    req.socket?.remoteAddress ||
    "";
  res.json({ status: "success", ip });
});

export default storefrontRouter;
