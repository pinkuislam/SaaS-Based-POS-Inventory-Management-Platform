import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin/require-admin";

export async function GET() {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const admins = await prisma.superAdmin.findMany({
    orderBy: { createdAt: "desc" },
    include: { role: true },
  });

  return NextResponse.json(
    admins.map(({ password: _, ...admin }) => admin)
  );
}

export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const { name, email, phone, password, roleId, isActive = true } = body;

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "name, email, password required" },
      { status: 400 }
    );
  }

  const existing = await prisma.superAdmin.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already exists" }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 10);
  const admin = await prisma.superAdmin.create({
    data: {
      name,
      email,
      phone: phone || null,
      password: hash,
      roleId: roleId || null,
      isActive,
    },
    include: { role: true },
  });

  const { password: _, ...safe } = admin;
  return NextResponse.json(safe, { status: 201 });
}
