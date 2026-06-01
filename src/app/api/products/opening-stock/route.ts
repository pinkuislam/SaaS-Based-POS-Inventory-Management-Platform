import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
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
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "CSV file required" }, { status: 400 });
  }

  const text = await file.text();
  const rows = parseCSV(text);
  if (rows.length === 0) {
    return NextResponse.json({ error: "No data rows in CSV" }, { status: 400 });
  }

  let updated = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const sku = (row.sku || row.SKU || "").trim();
    const name = (row.name || row.product || "").trim();
    const stockRaw = row.stock || row.quantity || row.openingstock || "0";
    const stock = parseFloat(stockRaw);

    if (!sku && !name) {
      errors.push(`Row ${i + 2}: sku or name required`);
      continue;
    }
    if (Number.isNaN(stock) || stock < 0) {
      errors.push(`Row ${i + 2}: invalid stock quantity`);
      continue;
    }

    const product = await prisma.product.findFirst({
      where: {
        tenantId,
        ...(sku ? { sku } : { name }),
      },
    });

    if (!product) {
      errors.push(`Row ${i + 2}: product not found (${sku || name})`);
      continue;
    }

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: product.id },
        data: { stockQty: stock },
      });
      await tx.stockMovement.create({
        data: {
          tenantId,
          productId: product.id,
          type: "OPENING",
          quantity: stock,
          reason: "Opening stock import",
          status: "APPROVED",
          userId: authResult.session.user.id,
        },
      });
    });
    updated++;
  }

  await logActivity({
    tenantId,
    userId: authResult.session.user.id,
    userName: authResult.session.user.name || undefined,
    action: "import_opening_stock",
    module: "inventory",
    details: `${updated} products updated`,
  });

  return NextResponse.json({ updated, errors });
}
