import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { readdir, stat } from "fs/promises";
import path from "path";

async function listFilesRecursive(
  dir: string,
  baseDir: string
): Promise<
  { name: string; path: string; size: number; modified: string; type: string }[]
> {
  const results: {
    name: string;
    path: string;
    size: number;
    modified: string;
    type: string;
  }[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(baseDir, full).replace(/\\/g, "/");
      if (entry.isDirectory()) {
        results.push(...(await listFilesRecursive(full, baseDir)));
      } else {
        const s = await stat(full);
        const ext = path.extname(entry.name).toLowerCase();
        let type = "file";
        if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) {
          type = "image";
        } else if ([".pdf"].includes(ext)) {
          type = "document";
        }
        results.push({
          name: entry.name,
          path: rel,
          size: s.size,
          modified: s.mtime.toISOString(),
          type,
        });
      }
    }
  } catch {
    /* empty */
  }

  return results;
}

export async function GET() {
  const authResult = await requirePermission("manage_settings");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const uploadDir = path.join(process.cwd(), "public", "uploads", tenantId);
  const files = await listFilesRecursive(uploadDir, uploadDir);

  return NextResponse.json({
    files: files.sort(
      (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime()
    ),
    publicBase: `/uploads/${tenantId}`,
  });
}

export async function DELETE(request: Request) {
  const authResult = await requirePermission("manage_settings");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { filePath } = await request.json();

  if (!filePath || typeof filePath !== "string") {
    return NextResponse.json({ error: "File path required" }, { status: 400 });
  }

  const normalized = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, "");
  if (normalized.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const full = path.join(
    process.cwd(),
    "public",
    "uploads",
    tenantId,
    normalized
  );
  const base = path.join(process.cwd(), "public", "uploads", tenantId);
  if (!full.startsWith(base)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const { unlink } = await import("fs/promises");
    await unlink(full);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
