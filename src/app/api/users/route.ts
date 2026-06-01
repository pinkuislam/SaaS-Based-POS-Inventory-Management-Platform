import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { filterValidPermissions } from "@/lib/permissions";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  const authResult = await requirePermission("manage_users");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { searchParams } = new URL(request.url);
  const includeDeleted = searchParams.get("includeDeleted") === "1";

  const users = await prisma.user.findMany({
    where: {
      tenantId,
      ...(includeDeleted ? {} : { deletedAt: null }),
    },
    include: { role: true, branch: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const authResult = await requirePermission("manage_users");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const body = await request.json();
  const {
    name,
    email,
    password,
    roleId,
    branchId,
    phone,
    isActive,
    extraPermissions,
  } = body;

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json(
      { error: "Name, email, and password are required" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findFirst({
    where: { email: email.trim(), tenantId },
  });
  if (existing) {
    return NextResponse.json(
      { error: "User with this email already exists" },
      { status: 400 }
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { package: true },
  });

  const userCount = await prisma.user.count({
    where: { tenantId, deletedAt: null },
  });
  const maxUsers = tenant?.package?.maxUsers ?? 10;
  if (userCount >= maxUsers) {
    return NextResponse.json(
      { error: `User limit reached (${maxUsers} users on your plan)` },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const validExtra = filterValidPermissions(extraPermissions);

  const user = await prisma.user.create({
    data: {
      tenantId,
      name: name.trim(),
      email: email.trim(),
      password: hashedPassword,
      roleId: roleId || null,
      branchId: branchId || null,
      phone: phone?.trim() || null,
      userType: "TENANT",
      isActive: isActive !== false,
      extraPermissions: validExtra.length > 0 ? validExtra : undefined,
    },
    include: { role: true, branch: true },
  });

  await logActivity({
    tenantId,
    userId: authResult.session.user.id,
    userName: authResult.session.user.name || undefined,
    action: "create",
    module: "users",
    details: `Created user ${user.email}`,
  });

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    branch: user.branch,
  });
}
