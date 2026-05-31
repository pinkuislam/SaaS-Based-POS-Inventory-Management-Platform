import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin/require-admin";
import {
  getPlatformSettings,
  setPlatformSettings,
} from "@/lib/admin/system-settings";

export async function GET() {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const settings = await getPlatformSettings();
  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  await setPlatformSettings(body);
  const settings = await getPlatformSettings();
  return NextResponse.json(settings);
}
