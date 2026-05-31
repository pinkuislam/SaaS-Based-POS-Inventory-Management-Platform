import { prisma } from "@/lib/prisma";

export { PLATFORM_SETTING_KEYS } from "@/lib/admin/platform-setting-keys";

export async function getPlatformSettings(): Promise<Record<string, string>> {
  const rows = await prisma.systemSetting.findMany();
  const map: Record<string, string> = {};
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export async function setPlatformSetting(key: string, value: string) {
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function setPlatformSettings(settings: Record<string, string>) {
  for (const [key, value] of Object.entries(settings)) {
    await setPlatformSetting(key, value);
  }
}
