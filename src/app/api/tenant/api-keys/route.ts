import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/tenant-api-key";
import {
  getTenantPackageFeatures,
  hasPackageFeature,
  PACKAGE_FEATURES,
} from "@/lib/package-features";

export async function GET() {
  const authResult = await requirePermission("manage_settings");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const keys = await prisma.tenantApiKey.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      isActive: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json(keys);
}

export async function POST(request: Request) {
  const authResult = await requirePermission("manage_settings");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const features = await getTenantPackageFeatures(tenantId);
  if (!hasPackageFeature(features, PACKAGE_FEATURES.API_ACCESS)) {
    return NextResponse.json(
      { error: "API access requires Enterprise plan (or All Features)" },
      { status: 403 }
    );
  }

  const { name } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Key name required" }, { status: 400 });
  }

  const { raw, hash, prefix } = generateApiKey();
  const record = await prisma.tenantApiKey.create({
    data: {
      tenantId,
      name: name.trim(),
      keyHash: hash,
      keyPrefix: prefix,
    },
  });

  return NextResponse.json({
    id: record.id,
    name: record.name,
    keyPrefix: record.keyPrefix,
    apiKey: raw,
    message: "Copy this key now — it will not be shown again.",
  });
}

export async function DELETE(request: Request) {
  const authResult = await requirePermission("manage_settings");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  await prisma.tenantApiKey.deleteMany({
    where: { id, tenantId },
  });

  return NextResponse.json({ success: true });
}
