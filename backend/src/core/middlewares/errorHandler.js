import { logger } from "../../config/logger.js";

export const errorHandler = (err, req, res, next) => {
  logger.error({ err, path: req.originalUrl, method: req.method }, "Unhandled API Error");

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

