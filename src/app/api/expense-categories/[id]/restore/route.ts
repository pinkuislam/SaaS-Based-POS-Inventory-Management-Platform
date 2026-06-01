import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_expenses");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;

  const category = await prisma.expenseCategory.findFirst({
    where: { id, tenantId },
  });
  if (!category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const restored = await prisma.expenseCategory.update({
    where: { id },
    data: { deletedAt: null, isActive: true },
  });

  return NextResponse.json(restored);
}
