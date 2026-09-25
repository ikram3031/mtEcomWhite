import { createApp } from "./app.js";
import { connectDatabase } from "./database/index.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { createShutdownHandler } from "./helper/sutdownHelper.js";

// Bootstraps dedicated high-throughput storefront customer API server
const bootstrapStorefront = async () => {
  await connectDatabase();

  const app = await createApp({ role: "storefront" });
  const port = Number.parseInt(process.env.STOREFRONT_PORT ?? process.env.PORT ?? "4001", 10);

  const server = app.listen(port, "0.0.0.0", () => {
    logger.info({ port, role: "storefront", environment: env.NODE_ENV }, "Storefront API listening");
  });

  const shutdown = (signal) => {
    const handler = createShutdownHandler(server);
    return handler(signal);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("uncaughtException", (error) => {
    logger.fatal({ err: error }, "Storefront uncaught exception");
    void shutdown("uncaughtException");
  });
  process.on("unhandledRejection", (reason) => {
    logger.fatal({ err: reason }, "Storefront unhandled rejection");
    void shutdown("unhandledRejection");
  });
};

void bootstrapStorefront();
