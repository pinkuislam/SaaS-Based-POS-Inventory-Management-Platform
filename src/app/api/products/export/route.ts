import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";

export async function GET() {
  const authResult = await requirePermission("manage_products");
  if ("error" in authResult) return authResult.error;

  const products = await prisma.product.findMany({
    where: { tenantId: authResult.session.user.tenantId! },
    orderBy: { name: "asc" },
  });

  const header =
    "name,sku,barcode,purchaseprice,sellingprice,stock,reorderlevel,status";
  const rows = products.map((p) =>
    [
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku || "",
      p.barcode || "",
      decimalToNumber(p.purchasePrice),
      decimalToNumber(p.sellingPrice),
      decimalToNumber(p.stockQty),
      decimalToNumber(p.reorderLevel),
      p.status,
    ].join(",")
  );

  const csv = [header, ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="products-export.csv"',
    },
  });
}
