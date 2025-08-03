import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.config";

export const authMiddleware: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "AUTH_REQUIRED" });
  }
  const token = authHeader.split(" ")[1];
  try {
    // In production, verify Firebase token if needed
    const decoded = jwt.verify(token, env.JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "AUTH_REQUIRED" });
  }
};
