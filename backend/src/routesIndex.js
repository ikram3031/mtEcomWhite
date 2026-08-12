import { Router } from "express";
import productsRouter from "./routes/ProductsRoute.js";
import imagesRouter from "./routes/ImagesRoute.js";
import authRouter from "./routes/AuthRoute.js";
import usersRouter from "./routes/UsersRoute.js";
import assetsRouter from "./routes/AssetsRoute.js";
import membersRouter from "./routes/MembersRoute.js";
import emailRouter from "./routes/EmailRoute.js";
import ordersRouter from "./routes/OrdersRoute.js";
import paymentsRouter from "./routes/PaymentsRoute.js";
import billingRouter from "./routes/BillingRoute.js";
import categoriesRouter from "./routes/CategoryRoute.js";
import brandRouter from "./routes/BrandRoute.js";
import dashboardRouter from "./routes/DashboardRoute.js";
import couponRouter from "./routes/CouponRoute.js";
import { searchProducts } from "./controllers/SearchController.js";

const coreRouter = Router();

coreRouter.use("/products", productsRouter);
coreRouter.use("/images", imagesRouter);
coreRouter.use("/auth", authRouter);
coreRouter.use("/users", usersRouter);
coreRouter.use("/assets", assetsRouter);
coreRouter.use("/members", membersRouter);
coreRouter.use("/sendEmail", emailRouter);
coreRouter.use("/orders", ordersRouter);
coreRouter.use("/payments", paymentsRouter);
coreRouter.use("/billing", billingRouter);
coreRouter.use("/categories", categoriesRouter);
coreRouter.use("/brands", brandRouter);
coreRouter.use("/dashboard", dashboardRouter);
coreRouter.use("/coupons", couponRouter);
coreRouter.get("/search-products", searchProducts);

export default coreRouter;
