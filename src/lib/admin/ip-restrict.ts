import { getPlatformSettings } from "@/lib/admin/system-settings";
import { PLATFORM_SETTING_KEYS } from "@/lib/admin/platform-setting-keys";

export function parseAllowedIps(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function getClientIp(request: Request | { headers: Headers }): string {
  const headers = request.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "";
  return headers.get("x-real-ip") || "";
}

export async function isAdminIpAllowed(request: Request): Promise<boolean> {
  const settings = await getPlatformSettings();
  const allowed = parseAllowedIps(settings[PLATFORM_SETTING_KEYS.adminAllowedIps]);
  if (allowed.length === 0) return true;

  const ip = getClientIp(request);
  if (!ip) return false;

  return allowed.some((entry) => {
    if (entry === ip) return true;
    if (entry.endsWith("*")) {
      const prefix = entry.slice(0, -1);
      return ip.startsWith(prefix);
    }
    return false;
  });
}
