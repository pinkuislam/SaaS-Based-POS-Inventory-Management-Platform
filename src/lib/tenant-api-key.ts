import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export function hashApiKey(rawKey: string) {
  return createHash("sha256").update(rawKey).digest("hex");
}

export function generateApiKey() {
  const raw = `inv_${randomBytes(24).toString("hex")}`;
  return {
    raw,
    hash: hashApiKey(raw),
    prefix: raw.slice(0, 12),
  };
}

export async function resolveTenantFromApiKey(
  authorization: string | null
): Promise<{ tenantId: string; keyId: string } | null> {
  if (!authorization?.startsWith("Bearer ")) return null;
  const raw = authorization.slice(7).trim();
  if (!raw.startsWith("inv_")) return null;

  const keyHash = hashApiKey(raw);
  const record = await prisma.tenantApiKey.findFirst({
    where: { keyHash, isActive: true },
    include: { tenant: { select: { id: true, status: true } } },
  });
  if (!record || record.tenant.status !== "ACTIVE") return null;

  await prisma.tenantApiKey.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  });

  return { tenantId: record.tenantId, keyId: record.id };
}
