import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { tenantId: session.user.tenantId },
    include: { role: true, branch: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  const body = await request.json();
  const { name, email, password, roleId, branchId, phone } = body;

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

  const userCount = await prisma.user.count({ where: { tenantId } });
  const maxUsers = tenant?.package?.maxUsers ?? 10;
  if (userCount >= maxUsers) {
    return NextResponse.json(
      { error: `User limit reached (${maxUsers} users on your plan)` },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      tenantId,
      name: name.trim(),
      email: email.trim(),
      password: hashedPassword,
      roleId: roleId || null,
      branchId: branchId || null,
      phone,
      userType: "TENANT",
      isActive: true,
    },
    include: { role: true, branch: true },
  });

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    branch: user.branch,
  });
}
