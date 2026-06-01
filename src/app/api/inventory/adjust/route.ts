import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { resolveUserPermissions } from "@/lib/permissions";
import { ADJUSTMENT_TYPES } from "@/lib/inventory";
import { logActivity } from "@/lib/activity-log";

export async function POST(request: Request) {
  const authResult = await requirePermission("manage_inventory");
  if ("error" in authResult) return authResult.error;

  const session = authResult.session;
  const tenantId = session.user.tenantId!;
  const body = await request.json();
  const { productId, quantity, type, notes, reason, requireApproval } = body;

  if (!productId || quantity === undefined || quantity === 0) {
    return NextResponse.json(
      { error: "Product and non-zero quantity required" },
      { status: 400 }
    );
  }

  const adjType = ADJUSTMENT_TYPES.find((t) => t.value === type) ?? ADJUSTMENT_TYPES[0];
  const movementType = adjType.movement as
    | "ADJUSTMENT"
    | "OPENING"
    | "DAMAGE"
    | "EXPIRED"
    | "RETURN";

  const user = session.user as {
    permissions?: string[];
    extraPermissions?: unknown;
  };
  const perms = resolveUserPermissions(
    user.permissions,
    user.extraPermissions
  );
  const canApprove = hasPermission(perms, "approve_stock_adjustment");
  const needsApproval =
    requireApproval === true ||
    (Math.abs(Number(quantity)) > 50 && !canApprove);
  const status = needsApproval && !canApprove ? "PENDING" : "APPROVED";

  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findFirst({
      where: { id: productId, tenantId },
    });
    if (!product) throw new Error("Product not found");

    const movement = await tx.stockMovement.create({
      data: {
        tenantId,
        branchId: session.user.branchId,
        productId,
        userId: session.user.id,
        type: movementType,
        quantity,
        reference: "ADJ",
        reason: reason || null,
        notes: notes || adjType.label,
        status,
      },
    });

    if (status === "APPROVED") {
      await tx.product.update({
        where: { id: productId },
        data: { stockQty: { increment: quantity } },
      });
    }

    return movement;
  });

  await logActivity({
    tenantId,
    userId: session.user.id,
    userName: session.user.name,
    action: status === "PENDING" ? "stock_adjust_pending" : "stock_adjust",
    module: "inventory",
    details: `${adjType.label}: ${quantity} (${productId})`,
  });

  return NextResponse.json(result);
}
