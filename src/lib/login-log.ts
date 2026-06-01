import { prisma } from "@/lib/prisma";

export async function logLoginAttempt(opts: {
  email: string;
  success: boolean;
  userId?: string | null;
  tenantId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}) {
  try {
    await prisma.loginLog.create({
      data: {
        email: opts.email,
        success: opts.success,
        userId: opts.userId ?? null,
        tenantId: opts.tenantId ?? null,
        ip: opts.ip ?? null,
        userAgent: opts.userAgent ?? null,
      },
    });
  } catch {
    /* ignore */
  }
}

export function clientIpFromRequest(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return request.headers.get("x-real-ip");
}
