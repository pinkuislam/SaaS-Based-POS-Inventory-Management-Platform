/** Edge-safe in-memory cache for maintenance flag (middleware only). */
let cache: { enabled: boolean; expiresAt: number } | null = null;

const TTL_MS = 10_000;

export function getCachedMaintenanceEnabled(): boolean | null {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.enabled;
  }
  return null;
}

export function setCachedMaintenanceEnabled(enabled: boolean) {
  cache = { enabled, expiresAt: Date.now() + TTL_MS };
}

export function clearMaintenanceCache() {
  cache = null;
}
