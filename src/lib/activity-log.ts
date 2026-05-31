import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function logActivity({
  tenantId,
  userId,
  userName,
  action,
  module,
  details,
  metadata,
}: {
  tenantId?: string | null;
  userId?: string | null;
  userName?: string | null;
  action: string;
  module: string;
  details?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        tenantId: tenantId || null,
        userId: userId || null,
        userName: userName || null,
        action,
        module,
        details,
        metadata: (metadata as Prisma.InputJsonValue) || undefined,
      },
    });
  } catch (e) {
    console.error("Activity log failed:", e);
  }
}
