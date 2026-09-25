import { createApp } from "./app.js";
import { connectDatabase } from "./database/index.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { createShutdownHandler } from "./helper/sutdownHelper.js";
import { initWebSocketServer } from "./websocket.js";
import { initMediaSchedulers, stopMediaSchedulers } from "./schedulers/mediaScheduler.js";
import { initHeartbeatScheduler, stopHeartbeatScheduler } from "./schedulers/heartbeat.scheduler.js";

// Bootstraps dedicated business logic dashboard and management API server
const bootstrapDashboard = async () => {
  await connectDatabase();

  const app = await createApp({ role: "dashboard" });
  const port = Number.parseInt(process.env.DASHBOARD_PORT ?? process.env.PORT ?? "4002", 10);

  const server = app.listen(port, "0.0.0.0", () => {
    logger.info({ port, role: "dashboard", environment: env.NODE_ENV }, "Dashboard API listening");
  });

  const wss = initWebSocketServer(server);
  initMediaSchedulers();
  initHeartbeatScheduler();

  if (env.IMAP_SYNC_ENABLED) {
    import("./services/imapSync.service.js")
      .then(({ startImapIdleListener }) => {
        startImapIdleListener().catch((err) => {
          logger.error({ err }, "Failed to start IMAP IDLE listener");
        });
      })
      .catch((err) => {
        logger.error({ err }, "Could not load IMAP service");
      });
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
    logger.fatal({ err: error }, "Dashboard uncaught exception");
    void shutdown("uncaughtException");
  });
  process.on("unhandledRejection", (reason) => {
    logger.fatal({ err: reason }, "Dashboard unhandled rejection");
    void shutdown("unhandledRejection");
  });
};

void bootstrapDashboard();
