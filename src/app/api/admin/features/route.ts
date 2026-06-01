import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin/require-admin";
import {
  getPlatformFeaturesForAdmin,
  invalidatePlatformFeaturesCache,
} from "@/lib/admin/platform-features";

export async function GET() {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const features = await getPlatformFeaturesForAdmin();
  return NextResponse.json(features, {
    headers: { "Cache-Control": "private, max-age=120" },
  });
}

export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const { key, name, module, description, isActive = true, sortOrder = 0 } = body;

  if (!key || !name || !module) {
    return NextResponse.json({ error: "key, name, module required" }, { status: 400 });
  }

  const feature = await prisma.platformFeature.create({
    data: { key, name, module, description, isActive, sortOrder },
    select: {
      id: true,
      key: true,
      name: true,
      module: true,
      description: true,
      isActive: true,
      sortOrder: true,
    },
  });

  invalidatePlatformFeaturesCache();

  return NextResponse.json(feature, { status: 201 });
}
