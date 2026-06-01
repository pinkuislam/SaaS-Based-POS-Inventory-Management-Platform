import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_products");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;

  const category = await prisma.productCategory.findFirst({
    where: { id, tenantId },
  });
  if (!category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP, or GIF allowed" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File must be under 2MB" },
      { status: 400 }
    );
  }

  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const dir = path.join(process.cwd(), "public", "uploads", tenantId, "categories");
  await mkdir(dir, { recursive: true });

  const filename = `${id}.${ext}`;
  const filepath = path.join(dir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  const imageUrl = `/uploads/${tenantId}/categories/${filename}`;
  const updated = await prisma.productCategory.update({
    where: { id },
    data: { image: imageUrl },
  });

  return NextResponse.json({ image: updated.image });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_products");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;

  const category = await prisma.productCategory.findFirst({
    where: { id, tenantId },
  });
  if (!category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.productCategory.update({
    where: { id },
    data: { image: null },
  });

  return NextResponse.json({ success: true });
}
