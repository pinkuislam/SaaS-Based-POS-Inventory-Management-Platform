import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i]
      .split(",")
      .map((v) => v.trim().replace(/^"|"$/g, ""));
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
  const authResult = await requirePermission("manage_suppliers");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const rows = parseCSV(await file.text());
  if (rows.length === 0) {
    return NextResponse.json(
      { error: "CSV is empty or invalid" },
      { status: 400 }
    );
  }

  let created = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = row.name || row.supplier;
    if (!name) {
      errors.push(`Row ${i + 2}: missing name`);
      continue;
    }

    try {
      await prisma.supplier.create({
        data: {
          tenantId,
          name: name.trim(),
          companyName: row.company || row.companyname || null,
          phone: row.phone || null,
          email: row.email || null,
          address: row.address || null,
          openingBalance:
            parseFloat(row.openingbalance || row.balance || "0") || 0,
        },
      });
      created++;
    } catch {
      errors.push(`Row ${i + 2}: could not create "${name}"`);
    }
  }

  return NextResponse.json({ created, errors });
}
