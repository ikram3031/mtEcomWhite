import { createApp } from "./app.js";
import { connectDatabase } from "./common/database/index.js";
import { env } from "./common/config/env.js";
import { logger } from "./common/config/logger.js";
import { createShutdownHandler } from "./common/helper/sutdownHelper.js";
import { initWebSocketServer } from "./common/websocket.js";
import { initMediaSchedulers, stopMediaSchedulers } from "./common/schedulers/mediaScheduler.js";
import { initHeartbeatScheduler, stopHeartbeatScheduler } from "./common/schedulers/heartbeat.scheduler.js";

// Bootstraps backend server, database connections, and background schedulers
const bootstrap = async () => {
  await connectDatabase();

  const role = process.env.APP_ROLE || "all";
  const app = await createApp({ role });
  const defaultPort = role === "storefront" ? "4001" : role === "dashboard" ? "4002" : "4000";
  const port = Number.parseInt(process.env.PORT ?? process.env.BACKEND_PORT ?? defaultPort, 10);

  const server = app.listen(port, "0.0.0.0", () => {
    logger.info({ port, role, environment: env.NODE_ENV }, "Server listening");
  });

  if (role === "dashboard" || role === "all") {
    const wss = initWebSocketServer(server);
    initMediaSchedulers();
    initHeartbeatScheduler();

    if (env.IMAP_SYNC_ENABLED) {
      import("./common/services/imapSync.service.js")
        .then(({ startImapIdleListener }) => {
          startImapIdleListener().catch((err) => {
            logger.error({ err }, "Failed to start IMAP IDLE listener");
          });
        })
        .catch((err) => {
          logger.error({ err }, "Could not load IMAP service");
        });
    }
  }

  const shutdown = (signal) => {
    stopHeartbeatScheduler();
    stopMediaSchedulers();
    const handler = createShutdownHandler(server);
    return handler(signal);
  };

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
};

void bootstrap();

