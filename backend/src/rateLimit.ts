type Bucket = { count: number; resetAt: number };

export function createLimiter(max: number, windowMs: number) {
  const buckets = new Map<string, Bucket>();

  const live = (key: string) => {
    const b = buckets.get(key);
    if (b && b.resetAt > Date.now()) return b;
    buckets.delete(key);
    return undefined;
  };

  // Drop expired buckets so the map can't grow without bound.
  setInterval(() => {
    const now = Date.now();
    for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key);
  }, windowMs).unref();

  return {
    /** Seconds until the key may try again, or 0 if it's under the limit. */
    retryAfter(key: string): number {
      const b = live(key);
      return b && b.count >= max
        ? Math.ceil((b.resetAt - Date.now()) / 1000)
        : 0;
    },
    record(key: string): void {
      const b = live(key);
      if (b) b.count++;
      else buckets.set(key, { count: 1, resetAt: Date.now() + windowMs });
    },
    clear(key: string): void {
      buckets.delete(key);
    },
  };
}
