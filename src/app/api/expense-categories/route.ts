import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const authResult = await requirePermission("manage_expenses");
  if ("error" in authResult) return authResult.error;

  const showAll = new URL(request.url).searchParams.get("show") === "all";

  const categories = await prisma.expenseCategory.findMany({
    where: {
      tenantId: authResult.session.user.tenantId!,
      ...(showAll ? {} : { deletedAt: null }),
    },
    include: {
      _count: { select: { expenses: { where: { deletedAt: null } } } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const authResult = await requirePermission("manage_expenses");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { name, description } = await request.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const category = await prisma.expenseCategory.create({
      data: {
        tenantId,
        name: name.trim(),
        description: description?.trim() || null,
      },
    });
    return NextResponse.json(category);
  } catch {
    return NextResponse.json(
      { error: "Category already exists" },
      { status: 400 }
    );
  }
}
