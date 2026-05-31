import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function logPlatformActivity(opts: {
  adminId?: string | null;
  adminName?: string | null;
  action: string;
  module: string;
  details?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  try {
    await prisma.platformActivityLog.create({
      data: {
        adminId: opts.adminId || undefined,
        adminName: opts.adminName || undefined,
        action: opts.action,
        module: opts.module,
        details: opts.details,
        metadata: opts.metadata,
      },
    });
  } catch (e) {
    console.error("Failed to log platform activity:", e);
  }
}
