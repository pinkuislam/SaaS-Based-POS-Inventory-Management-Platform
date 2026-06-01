import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_expenses");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;
  const body = await request.json();

  const expense = await prisma.expense.findFirst({
    where: { id, tenantId },
  });
  if (!expense) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.expense.update({
    where: { id },
    data: {
      ...(body.title?.trim() && { title: body.title.trim() }),
      ...(body.amount !== undefined && { amount: body.amount }),
      ...(body.categoryId !== undefined && { categoryId: body.categoryId || null }),
      ...(body.expenseDate && { expenseDate: new Date(body.expenseDate) }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.paymentMethod !== undefined && {
        paymentMethod: body.paymentMethod,
      }),
      ...(body.branchId !== undefined && { branchId: body.branchId || null }),
    },
    include: { category: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_expenses");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;

  const expense = await prisma.expense.findFirst({
    where: { id, tenantId },
  });
  if (!expense) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.expense.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await logActivity({
    tenantId,
    userId: authResult.session.user.id,
    userName: authResult.session.user.name || undefined,
    action: "archive_expense",
    module: "expenses",
    details: `Archived expense ${expense.title}`,
  });

  return NextResponse.json({ success: true });
}
