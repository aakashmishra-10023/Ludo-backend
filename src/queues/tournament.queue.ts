import { Queue } from "bullmq";
import IORedis from "ioredis";
import { URL } from "url";
import { env } from "../config/env.config";

const redisUrl = env.REDIS_URL || "redis://127.0.0.1:6379";
const parsed = new URL(redisUrl);

const connection = new IORedis({
  host: parsed.hostname,
  port: Number(parsed.port),
  username: parsed.username || undefined,
  password: parsed.password || undefined,
  tls: parsed.protocol === "rediss:" ? {} : undefined,
});

export const tournamentQueue = new Queue('tournamentQueue', { 
  connection,
  prefix: 'bull:{tournament}'
 });
