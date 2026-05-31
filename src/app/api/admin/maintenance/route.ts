import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin/require-admin";
import { clearMaintenanceCache } from "@/lib/maintenance-cache";
import { getPlatformSettings, setPlatformSettings } from "@/lib/admin/system-settings";
import { PLATFORM_SETTING_KEYS } from "@/lib/admin/platform-setting-keys";

export async function GET() {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const settings = await getPlatformSettings();
  return NextResponse.json({
    maintenanceMode: settings[PLATFORM_SETTING_KEYS.maintenanceMode] === "true",
    maintenanceMessage:
      settings[PLATFORM_SETTING_KEYS.maintenanceMessage] ||
      "Platform is under maintenance. Please try again later.",
  });
}

export async function PATCH(request: Request) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  await setPlatformSettings({
    [PLATFORM_SETTING_KEYS.maintenanceMode]: body.maintenanceMode ? "true" : "false",
    [PLATFORM_SETTING_KEYS.maintenanceMessage]:
      body.maintenanceMessage ||
      "Platform is under maintenance. Please try again later.",
  });

  clearMaintenanceCache();

  return NextResponse.json({ success: true });
}
