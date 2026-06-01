import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("manage_expenses");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { id } = await params;

  const expense = await prisma.expense.findFirst({
    where: { id, tenantId },
  });
  if (!expense) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Max 5MB" }, { status: 400 });
  }

  const ext =
    file.type === "application/pdf"
      ? "pdf"
      : file.type.split("/")[1] === "jpeg"
        ? "jpg"
        : file.type.split("/")[1];
  const dir = path.join(process.cwd(), "public", "uploads", tenantId, "expenses");
  await mkdir(dir, { recursive: true });
  const filename = `${id}.${ext}`;
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));

  const attachment = `/uploads/${tenantId}/expenses/${filename}`;
  const updated = await prisma.expense.update({
    where: { id },
    data: { attachment },
  });

  return NextResponse.json({ attachment: updated.attachment });
}
