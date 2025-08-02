import { RequestHandler } from "express";
import { logger } from "../utils/logger";

export const loggerMiddleware: RequestHandler = (req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
};
