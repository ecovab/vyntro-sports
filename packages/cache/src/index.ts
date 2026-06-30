import Redis from "ioredis";

let client: Redis | null = null;

function getClient(): Redis {
  if (!client) {
    client = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", { lazyConnect: false });
  }
  return client;
}

/**
 * Cache-aside helper: returns the cached value for `key` if present, otherwise
 * computes it via `fn`, caches it for `ttlSeconds`, and returns it. Used only
 * for read paths backed by data already verified/persisted elsewhere — never
 * a source of truth itself, just a latency optimization in front of Postgres.
 */
export async function cacheWrap<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  const redis = getClient();
  const cached = await redis.get(key).catch(() => null);
  if (cached !== null) {
    return JSON.parse(cached) as T;
  }

  const value = await fn();
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds).catch(() => undefined);
  return value;
}

export async function cacheInvalidate(key: string): Promise<void> {
  await getClient()
    .del(key)
    .catch(() => undefined);
}
