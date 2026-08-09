import { logger } from "../../config/logger.js";

export const errorHandler = (err, req, res, next) => {
  const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || req.socket?.remoteAddress || "Unknown IP";
  const now = new Date().toISOString();
  console.error(`❌ [${now}] [IP: ${clientIp}] ERROR on ${req.method} ${req.originalUrl} - Message: ${err.message}`);
  if (err.stack) {
    console.error(err.stack);
  }

  let status = err.status ?? err.statusCode;
  let message = err.message ?? "Internal Server Error";

  if (err.name === "MulterError") {
    status = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File size exceeds the allowable limit (max 10MB)";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = `Unexpected form field '${err.field}'. Expected field name is 'image'.`;
    }
  }

  status = status ?? 500;

  res.status(status).json({
    status: "error",
    message,
  });
};

