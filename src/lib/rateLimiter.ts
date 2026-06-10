interface Bucket {
  count: number
  resetAt: number
}

const store = new Map<string, Bucket>()

// Cleanup entries older than their window every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of store) {
    if (now > bucket.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000)

/**
 * Returns { ok: true } if the request is allowed, or
 * { ok: false, retryAfter: seconds } if the limit is exceeded.
 */
export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now()
  const bucket = store.get(key)

  if (!bucket || now > bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true }
  }

  if (bucket.count >= max) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) }
  }

  bucket.count++
  return { ok: true }
}
