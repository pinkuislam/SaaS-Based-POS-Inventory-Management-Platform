import { getPlatformSettings } from "@/lib/admin/system-settings";
import { PLATFORM_SETTING_KEYS } from "@/lib/admin/platform-setting-keys";

export type MaintenanceState = {
  maintenanceMode: boolean;
  maintenanceMessage: string;
};

export async function getMaintenanceState(): Promise<MaintenanceState> {
  const settings = await getPlatformSettings();
  return {
    maintenanceMode:
      settings[PLATFORM_SETTING_KEYS.maintenanceMode] === "true",
    maintenanceMessage:
      settings[PLATFORM_SETTING_KEYS.maintenanceMessage]?.trim() ||
      "Platform is under maintenance. Please try again later.",
  };
}
