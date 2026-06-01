import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_expenses");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;
  const body = await request.json();
  const { name, description, isActive } = body;

  const category = await prisma.expenseCategory.findFirst({
    where: { id, tenantId },
  });
  if (!category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const updated = await prisma.expenseCategory.update({
      where: { id },
      data: {
        ...(name?.trim() && { name: name.trim() }),
        ...(description !== undefined && {
          description: description?.trim() || null,
        }),
        ...(typeof isActive === "boolean" && { isActive }),
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Category name already exists" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_expenses");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;

  const category = await prisma.expenseCategory.findFirst({
    where: { id, tenantId },
    include: {
      _count: { select: { expenses: { where: { deletedAt: null } } } },
    },
  });
  if (!category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (category.deletedAt) {
    return NextResponse.json(
      { error: "Category is already archived" },
      { status: 400 }
    );
  }

  await prisma.expenseCategory.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
  return NextResponse.json({ success: true });
}
