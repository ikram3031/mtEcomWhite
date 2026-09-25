import { Router } from "express";
import express from "express";
import dashProductRouter from "../dashboard/routes/dashProduct.route.js";
import dashAssetsRouter from "../dashboard/routes/assets.route.js";
import productsRouter from "./ProductsRoute.js";
import reviewRouter from "./ReviewRoute.js";
import imagesRouter from "./ImagesRoute.js";
import authRouter from "./AuthRoute.js";
import usersRouter from "./UsersRoute.js";
import assetsRouter from "./AssetsRoute.js";
import membersRouter from "./MembersRoute.js";
import emailRouter from "./EmailRoute.js";
import ordersRouter from "./OrdersRoute.js";
import paymentsRouter from "./PaymentsRoute.js";
import billingRouter from "./BillingRoute.js";
import categoriesRouter from "./CategoryRoute.js";
import brandRouter from "./BrandRoute.js";
import dashboardRouter from "./DashboardRoute.js";
import couponRouter from "./CouponRoute.js";
import systemRouter from "./SystemRoute.js";
import searchRouter from "./SearchRoute.js";
import studioRouter from "./studio.js";
import logsRouter from "./LogsRoute.js";
import subscriberRouter from "./SubscriberRoute.js";
import contactRouter from "./ContactRoute.js";
import webmailRouter from "./WebmailRoute.js";
import storeUtilsRouter from "./StoreUtilsRoute.js";
import reportsRouter from "./ReportsRoute.js";
import sizeChartRouter from "./SizeChartRoute.js";
import settingsRouter from "./SettingsRoute.js";
import telemetryRouter from "./TelemetryRoute.js";
import { searchProducts } from "../controllers/SearchController.js";

const dashboardRoutes = Router();

// Dashboard admin and management endpoints
dashboardRoutes.use("/dash/products", dashProductRouter);
dashboardRoutes.use("/dash/assets", dashAssetsRouter);
dashboardRoutes.use("/products", productsRouter);
dashboardRoutes.use("/reviews", reviewRouter);
dashboardRoutes.use("/images", imagesRouter);
dashboardRoutes.use("/auth", authRouter);
dashboardRoutes.use("/users", usersRouter);
dashboardRoutes.use("/assets", assetsRouter);
dashboardRoutes.use("/members", membersRouter);
dashboardRoutes.use("/sendEmail", emailRouter);
dashboardRoutes.use("/orders", ordersRouter);
dashboardRoutes.use("/payments", paymentsRouter);
dashboardRoutes.use("/billing", billingRouter);
dashboardRoutes.use("/categories", categoriesRouter);
dashboardRoutes.use("/brands", brandRouter);
dashboardRoutes.use("/dashboard", dashboardRouter);
dashboardRoutes.use("/coupons", couponRouter);
dashboardRoutes.use("/size-charts", sizeChartRouter);
dashboardRoutes.use("/dashboard/size-charts", sizeChartRouter);
dashboardRoutes.use("/system", systemRouter);
dashboardRoutes.use("/subscribers", subscriberRouter);
dashboardRoutes.use("/contact", contactRouter);
dashboardRoutes.use("/webmail", webmailRouter);
dashboardRoutes.use("/store-utils", storeUtilsRouter);
dashboardRoutes.use("/settings", settingsRouter);
dashboardRoutes.use("/telemetry", telemetryRouter);
dashboardRoutes.use("/search", searchRouter);
dashboardRoutes.use("/logs", logsRouter);
dashboardRoutes.use("/reports", reportsRouter);
dashboardRoutes.use("/studio", express.json({ limit: "60mb" }), studioRouter);
dashboardRoutes.get("/search-products", searchProducts);

// Resolves client IP from request headers or socket
dashboardRoutes.get("/client-ip", (req, res) => {
  const ip =
    req.headers["cf-connecting-ip"] ||
    req.headers["x-real-ip"] ||
    req.headers["x-forwarded-for"]?.split(",")?.[0]?.trim() ||
    req.socket?.remoteAddress ||
    "";
  res.json({ status: "success", ip });
});

export default dashboardRoutes;
