import { createApp } from "./app.js";
// import { connectMySQL } from "./database/mysql.js";
import { connectDatabase } from "./database/index.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { createShutdownHandler } from "./helper/sutdownHelper.js";

async function bootstrap() {
  // await connectMySQL();
  await connectDatabase();

  const app = await createApp();
  const port = Number.parseInt(process.env.PORT ?? process.env.BACKEND_PORT ?? "4000", 10);

  const server = app.listen(port, "0.0.0.0", () => {
    logger.info({ port, environment: env.NODE_ENV }, "Server listening");
  });

  const shutdown = createShutdownHandler(server);

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("uncaughtException", (error) => {
    logger.fatal({ err: error }, "Uncaught exception");
    void shutdown("uncaughtException");
  });
  process.on("unhandledRejection", (reason) => {
    logger.fatal({ err: reason }, "Unhandled rejection");
    void shutdown("unhandledRejection");
  });
}

void bootstrap();
