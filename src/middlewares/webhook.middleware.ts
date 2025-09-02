import { Request, Response, NextFunction } from "express";

/**
 * Middleware to capture raw body for webhook signature verification
 */
export const webhookMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let data = "";

  req.setEncoding("utf8");

  req.on("data", (chunk) => {
    data += chunk;
  });

  req.on("end", () => {
    try {
      req.body = JSON.parse(data);
      next();
    } catch (error) {
      res.status(400).json({ error: "Invalid JSON" });
    }
  });
};
