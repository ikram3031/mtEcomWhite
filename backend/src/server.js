import { createApp } from "./app.js";
// import { connectMySQL } from "./database/mysql.js";
import { connectDatabase } from "./database/index.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { createShutdownHandler } from "./helper/sutdownHelper.js";
import { initWebSocketServer } from "./websocket.js";
import { initMediaSchedulers, stopMediaSchedulers } from "./schedulers/mediaScheduler.js";
import { initHeartbeatScheduler, stopHeartbeatScheduler } from "./schedulers/heartbeat.scheduler.js";

// Bootstraps backend server, database connections, and background schedulers
const bootstrap = async () => {
  // await connectMySQL();
  await connectDatabase();

  const app = await createApp();
  const port = Number.parseInt(process.env.PORT ?? process.env.BACKEND_PORT ?? "4000", 10);

  const server = app.listen(port, "0.0.0.0", () => {
    logger.info({ port, environment: env.NODE_ENV }, "Server listening");
  });

  // Initialize Real-time Notification WebSocket Server
  const wss = initWebSocketServer(server);

  // Initialize Cloudflare R2 Sync & Orphan Image Cleanup Background Schedulers
  initMediaSchedulers();

  // Initialize Fleet Telemetry Heartbeat Scheduler
  initHeartbeatScheduler();

  // Initialize Real-time IMAP Webmail Synchronizer
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
    logger.fatal({ err: error }, "Uncaught exception");
    void shutdown("uncaughtException");
  });
  process.on("unhandledRejection", (reason) => {
    logger.fatal({ err: reason }, "Unhandled rejection");
    void shutdown("unhandledRejection");
  });
};

void bootstrap();

