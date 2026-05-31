import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const branches = await prisma.branch.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(branches);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  const body = await request.json();
  const { name, code, address, phone, isMain } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Branch name is required" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { package: true },
  });

  const branchCount = await prisma.branch.count({ where: { tenantId } });
  const maxBranches = tenant?.package?.maxBranches ?? 1;
  if (branchCount >= maxBranches) {
    return NextResponse.json(
      { error: `Branch limit reached (${maxBranches} on your plan)` },
      { status: 400 }
    );
  }

  if (isMain) {
    await prisma.branch.updateMany({
      where: { tenantId },
      data: { isMain: false },
    });
  }

  const branch = await prisma.branch.create({
    data: {
      tenantId,
      name: name.trim(),
      code: code?.trim() || null,
      address,
      phone,
      isMain: !!isMain,
    },
  });

  return NextResponse.json(branch);
}
