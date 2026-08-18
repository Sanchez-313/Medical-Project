/**
 * In-memory sliding-window rate limiter. Deliberately simple: no Redis, no
 * external service — this is a first line of defense against brute-force
 * login and mass registration, not a complete solution. Two real limits to
 * know about before relying on this in production:
 *   1. State is per-process. Cloud Run/App Engine can run multiple instances
 *      behind a load balancer, so an attacker spread across instances gets a
 *      higher effective limit than configured. For real protection at scale,
 *      back this with Redis (Memorystore) or use Google Cloud Armor's rate
 *      limiting at the load-balancer level instead.
 *   2. State resets on every redeploy/instance restart.
 * Good enough to stop a single-machine credential-stuffing script today;
 * upgrade the storage layer before treating it as the only defense.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

// Prevents unbounded memory growth from attackers cycling through IPs.
const MAX_TRACKED_KEYS = 5000;

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    if (buckets.size >= MAX_TRACKED_KEYS) buckets.clear();
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function clientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
