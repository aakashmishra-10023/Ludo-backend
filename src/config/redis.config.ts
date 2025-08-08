import { createClient } from 'redis';
import { env } from './env.config';

const REDIS_URL = env.REDIS_URL || 'redis://localhost:6379';

class RedisClient {
  private client: ReturnType<typeof createClient>;

  constructor() {
    this.client = createClient({
      url: REDIS_URL,
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
    });

    this.client.connect().catch(console.error);
  }

  getClient() {
    return this.client;
  }

  async set(key: string, value: any, expireTime?: number): Promise<string | null> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      if (expireTime) {
        return await this.client.set(key, stringValue, { EX: expireTime });
      }
      return await this.client.set(key, stringValue);
    } catch (error) {
      console.error('Redis Set Error:', error);
      return null;
    }
  }

  async get(key: string): Promise<any> {
    try {
      const value = await this.client.get(key);
      if (value) {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return null;
    } catch (error) {
      console.error('Redis Get Error:', error);
      return null;
    }
  }

  async delete(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (error) {
      console.error('Redis Delete Error:', error);
      return 0;
    }
  }
}

export const redisClient = new RedisClient();
