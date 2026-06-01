import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin/require-admin";
import { invalidatePlatformFeaturesCache } from "@/lib/admin/platform-features";

const featureSelect = {
  id: true,
  key: true,
  name: true,
  module: true,
  description: true,
  isActive: true,
  sortOrder: true,
} as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await request.json();

  const data: {
    name?: string;
    module?: string;
    description?: string | null;
    isActive?: boolean;
    sortOrder?: number;
  } = {};

  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.module === "string") data.module = body.module;
  if (body.description !== undefined) data.description = body.description;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder);

  const feature = await prisma.platformFeature.update({
    where: { id },
    data,
    select: featureSelect,
  });

  invalidatePlatformFeaturesCache();

  return NextResponse.json(feature);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  await prisma.platformFeature.delete({ where: { id } });

  invalidatePlatformFeaturesCache();

  return NextResponse.json({ success: true });
}
