import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, escapeCsvCell } from "@/lib/utils";

export async function GET(request: Request) {
  const authResult = await requirePermission("view_reports");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const purchases = await prisma.purchase.findMany({
    where: {
      tenantId,
      ...(from || to
        ? {
            purchaseDate: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
            },
          }
        : {}),
    },
    include: { supplier: true },
    orderBy: { purchaseDate: "desc" },
    take: 5000,
  });

  const headers = [
    "invoice",
    "date",
    "supplier",
    "subtotal",
    "tax",
    "total",
    "paid",
    "due",
    "status",
  ];
  const lines = [
    headers.join(","),
    ...purchases.map((p) =>
      [
        p.invoiceNo,
        p.purchaseDate.toISOString().slice(0, 10),
        p.supplier?.name || "",
        decimalToNumber(p.subtotal),
        decimalToNumber(p.tax),
        decimalToNumber(p.total),
        decimalToNumber(p.paidAmount),
        decimalToNumber(p.dueAmount),
        p.paymentStatus,
      ]
        .map((v) => escapeCsvCell(v))
        .join(",")
    ),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="purchases-export.csv"',
    },
  });
}
