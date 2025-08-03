import { ErrorRequestHandler } from "express";
import { logger } from "../utils/logger";

export const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  logger.error(err);
  res.status(err.status || 500).json({
    error: {
      code: err.code || "INTERNAL_ERROR",
      message: err.message || "Internal server error",
      details: err.details || null,
    },
  });
};
