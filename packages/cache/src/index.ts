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

/** Directly writes a value to the cache, bypassing the compute step (e.g. a worker pre-warming a read others will hit). */
export async function cacheSet<T>(key: string, ttlSeconds: number, value: T): Promise<void> {
  await getClient().set(key, JSON.stringify(value), "EX", ttlSeconds);
}

/** Publishes a payload on a Redis pub/sub channel for fan-out to WS gateway instances. */
export async function publish(channel: string, payload: unknown): Promise<void> {
  await getClient().publish(channel, JSON.stringify(payload));
}

/**
 * Subscribes to a Redis pub/sub channel on a dedicated connection (required by
 * ioredis: a connection in subscriber mode can't also run normal commands).
 * Returns an unsubscribe function.
 */
export function subscribe(channel: string, handler: (payload: unknown) => void): () => void {
  const subscriber = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
  subscriber.subscribe(channel).catch((err) => console.error(`[cache] subscribe to ${channel} failed`, err));
  subscriber.on("message", (ch, message) => {
    if (ch !== channel) return;
    try {
      handler(JSON.parse(message));
    } catch (err) {
      console.error(`[cache] failed to parse message on ${channel}`, err);
    }
  });
  return () => {
    subscriber.unsubscribe(channel).finally(() => subscriber.quit());
  };
}
