import { getTenantId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { BarcodeManager } from "@/components/barcode/barcode-manager";
import { decimalToNumber } from "@/lib/utils";

export default async function BarcodePage() {
  const tenantId = await getTenantId();
  const products = await prisma.product.findMany({
    where: { tenantId, status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      sku: true,
      barcode: true,
      sellingPrice: true,
    },
  });

  const initialProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    sellingPrice: decimalToNumber(p.sellingPrice),
  }));

  return <BarcodeManager initialProducts={initialProducts} />;
}
