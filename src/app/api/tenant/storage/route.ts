import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { getTenantPackageLimits } from "@/lib/package-limits";
import { readdir, stat } from "fs/promises";
import path from "path";

async function dirSizeBytes(dir: string): Promise<number> {
  let total = 0;
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        total += await dirSizeBytes(full);
      } else {
        const s = await stat(full);
        total += s.size;
      }
    }
  } catch {
    return 0;
  }
  return total;
}

export async function GET() {
  const authResult = await requirePermission("manage_settings");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const pkg = await getTenantPackageLimits(tenantId);
  const limitMb = pkg?.storageLimitMb ?? 1024;

  const uploadDir = path.join(process.cwd(), "public", "uploads", tenantId);
  const usedBytes = await dirSizeBytes(uploadDir);
  const usedMb = Math.round((usedBytes / (1024 * 1024)) * 100) / 100;

  let fileCount = 0;
  try {
    const entries = await readdir(uploadDir);
    fileCount = entries.length;
  } catch {
    fileCount = 0;
  }

  return NextResponse.json({
    usedBytes,
    usedMb,
    limitMb,
    fileCount,
    percentUsed: limitMb > 0 ? Math.min(100, (usedMb / limitMb) * 100) : 0,
  });
}
