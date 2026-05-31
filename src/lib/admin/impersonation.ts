import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-secret";

export type ImpersonationPayload = {
  userId: string;
  tenantId: string;
  tenantSlug: string;
  adminId: string;
  adminName: string;
  exp: number;
};

export function createImpersonationToken(payload: Omit<ImpersonationPayload, "exp">) {
  const full: ImpersonationPayload = {
    ...payload,
    exp: Date.now() + 5 * 60 * 1000,
  };
  const body = Buffer.from(JSON.stringify(full)).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyImpersonationToken(token: string): ImpersonationPayload | null {
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const expected = createHmac("sha256", SECRET).update(body).digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    ) as ImpersonationPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
