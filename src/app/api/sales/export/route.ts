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

  const sales = await prisma.sale.findMany({
    where: {
      tenantId,
      status: "COMPLETED",
      ...(from || to
        ? {
            saleDate: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
            },
          }
        : {}),
    },
    include: { customer: true, user: true },
    orderBy: { saleDate: "desc" },
    take: 5000,
  });

  const headers = [
    "invoice",
    "date",
    "customer",
    "cashier",
    "subtotal",
    "tax",
    "discount",
    "total",
    "paid",
    "due",
    "payment_method",
  ];
  const lines = [
    headers.join(","),
    ...sales.map((s) =>
      [
        s.invoiceNo,
        s.saleDate.toISOString().slice(0, 10),
        s.customer?.name || "Walk-in",
        s.user?.name || "",
        decimalToNumber(s.subtotal),
        decimalToNumber(s.tax),
        decimalToNumber(s.discount),
        decimalToNumber(s.total),
        decimalToNumber(s.paidAmount),
        decimalToNumber(s.dueAmount),
        s.paymentMethod,
      ]
        .map((v) => escapeCsvCell(v))
        .join(",")
    ),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="sales-export.csv"',
    },
  });
}
