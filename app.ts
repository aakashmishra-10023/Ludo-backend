import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import { env } from "./config/envConsts";
import routes from "./routes";
import { loggerMiddleware } from "./middlewares/loggerMiddleware";
import { errorMiddleware } from "./middlewares/errorMiddleware";
import { apiRateLimiter } from "./middlewares/rateLimitMiddleware";

const app: Application = express();

app.use(helmet());
// TODO: For production, set CORS origin whitelist
app.use(cors());
app.use(express.json());
app.use(mongoSanitize());
app.use(hpp());
app.use(loggerMiddleware);

app.use("/api/v1", apiRateLimiter, routes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", version: "1.0.0" });
});

app.use(errorMiddleware);

export default app;
