import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";

export async function GET() {
  const authResult = await requirePermission("manage_suppliers");
  if ("error" in authResult) return authResult.error;

  const suppliers = await prisma.supplier.findMany({
    where: { tenantId: authResult.session.user.tenantId! },
    orderBy: { name: "asc" },
  });

  const header = "name,company,phone,email,address,openingbalance,status";
  const rows = suppliers.map((s) =>
    [
      `"${s.name.replace(/"/g, '""')}"`,
      s.companyName || "",
      s.phone || "",
      s.email || "",
      `"${(s.address || "").replace(/"/g, '""')}"`,
      decimalToNumber(s.openingBalance),
      s.status,
    ].join(",")
  );

  return new Response([header, ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="suppliers-export.csv"',
    },
  });
}
