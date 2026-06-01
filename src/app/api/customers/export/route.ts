import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";

export async function GET() {
  const authResult = await requirePermission("manage_customers");
  if ("error" in authResult) return authResult.error;

  const customers = await prisma.customer.findMany({
    where: { tenantId: authResult.session.user.tenantId! },
    orderBy: { name: "asc" },
  });

  const header =
    "name,phone,email,address,type,openingbalance,creditlimit,status";
  const rows = customers.map((c) =>
    [
      `"${c.name.replace(/"/g, '""')}"`,
      c.phone || "",
      c.email || "",
      `"${(c.address || "").replace(/"/g, '""')}"`,
      c.customerType,
      decimalToNumber(c.openingBalance),
      decimalToNumber(c.creditLimit),
      c.status,
    ].join(",")
  );

  return new Response([header, ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="customers-export.csv"',
    },
  });
}
