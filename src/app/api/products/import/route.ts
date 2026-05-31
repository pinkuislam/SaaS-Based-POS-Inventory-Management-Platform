import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    if (values.every((v) => !v)) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }
  return rows;
}

export async function POST(request: Request) {
  const authResult = await requirePermission("manage_products");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const branchId = authResult.session.user.branchId;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const text = await file.text();
  const rows = parseCSV(text);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "CSV is empty or invalid. Header row required." },
      { status: 400 }
    );
  }

  const { prisma } = await import("@/lib/prisma");

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = row.name || row.product || row["product name"];
    if (!name) {
      errors.push(`Row ${i + 2}: missing name`);
      continue;
    }

    const sku = row.sku || null;
    const barcode = row.barcode || null;
    const purchasePrice = parseFloat(row.purchaseprice || row.cost || "0") || 0;
    const sellingPrice =
      parseFloat(row.sellingprice || row.price || "0") || 0;
    const stockQty = parseFloat(row.stock || row.stockqty || row.quantity || "0") || 0;
    const reorderLevel = parseFloat(row.reorderlevel || row.reorder || "10") || 10;

    try {
      const existing = sku
        ? await prisma.product.findFirst({
            where: { tenantId, sku },
          })
        : null;

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            name,
            barcode: barcode || existing.barcode,
            purchasePrice,
            sellingPrice,
            stockQty: { increment: stockQty },
            reorderLevel,
          },
        });
        updated++;
      } else {
        const product = await prisma.product.create({
          data: {
            tenantId,
            branchId,
            name,
            sku,
            barcode,
            purchasePrice,
            sellingPrice,
            stockQty,
            reorderLevel,
          },
        });
        if (stockQty > 0) {
          await prisma.stockMovement.create({
            data: {
              tenantId,
              branchId,
              productId: product.id,
              type: "ADJUSTMENT",
              quantity: stockQty,
              reference: "CSV Import",
            },
          });
        }
        created++;
      }
    } catch (e) {
      errors.push(`Row ${i + 2}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  return NextResponse.json({
    created,
    updated,
    total: rows.length,
    errors: errors.slice(0, 10),
  });
}
