import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin/require-admin";

export async function GET() {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const features = await prisma.platformFeature.findMany({
    orderBy: [{ module: "asc" }, { sortOrder: "asc" }],
  });
  return NextResponse.json(features);
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
  });

  return NextResponse.json(feature, { status: 201 });
}
