import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin/require-admin";

export async function GET() {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const roles = await prisma.adminRole.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { admins: true } } },
  });
  return NextResponse.json(roles);
}

export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const { name, description, permissions = [], isActive = true } = body;

  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const role = await prisma.adminRole.create({
    data: { name, description, permissions, isActive },
  });

  return NextResponse.json(role, { status: 201 });
}
