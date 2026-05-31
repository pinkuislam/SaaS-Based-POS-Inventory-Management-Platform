const ROOT_HOSTS = new Set(["localhost", "127.0.0.1", "inventorypos.local"]);

export function getTenantSlugFromHost(host: string): string | null {
  const hostname = host.split(":")[0].toLowerCase();

  if (ROOT_HOSTS.has(hostname)) {
    return null;
  }

  const parts = hostname.split(".");
  if (parts.length < 2) return null;

  const slug = parts[0];
  if (!slug || slug === "www" || slug === "admin" || slug === "app") {
    return null;
  }

  return slug;
}

export function getAppBaseUrl(tenantSlug?: string | null) {
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  if (!tenantSlug) return base;

  try {
    const url = new URL(base);
    const hostParts = url.hostname.split(".");
    if (hostParts.length === 1) {
      url.hostname = `${tenantSlug}.${url.hostname}`;
    } else {
      url.hostname = `${tenantSlug}.${hostParts.slice(-2).join(".")}`;
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return base;
  }
}
