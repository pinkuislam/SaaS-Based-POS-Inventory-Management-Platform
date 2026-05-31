import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin/require-admin";
import {
  generateTotpSecret,
  verifyTotpCode,
  getTotpQrDataUrl,
} from "@/lib/admin/totp";

export async function GET() {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const admin = await prisma.superAdmin.findUnique({
    where: { id: auth.session.user.id },
    select: { totpEnabled: true, email: true },
  });

  return NextResponse.json({
    enabled: admin?.totpEnabled ?? false,
  });
}

export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const action = body.action as string;

  const admin = await prisma.superAdmin.findUnique({
    where: { id: auth.session.user.id },
  });
  if (!admin) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  if (action === "setup") {
    const secret = generateTotpSecret();
    await prisma.superAdmin.update({
      where: { id: admin.id },
      data: { totpSecret: secret, totpEnabled: false },
    });
    const qrCode = await getTotpQrDataUrl(admin.email, secret);
    return NextResponse.json({ secret, qrCode });
  }

  if (action === "enable") {
    const code = body.code as string;
    if (!admin.totpSecret || !code) {
      return NextResponse.json({ error: "Code required" }, { status: 400 });
    }
    if (!(await verifyTotpCode(admin.totpSecret, code))) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }
    await prisma.superAdmin.update({
      where: { id: admin.id },
      data: { totpEnabled: true },
    });
    return NextResponse.json({ enabled: true });
  }

  if (action === "disable") {
    const code = body.code as string;
    if (admin.totpEnabled && admin.totpSecret) {
      if (!code || !(await verifyTotpCode(admin.totpSecret, code))) {
        return NextResponse.json({ error: "Invalid code" }, { status: 400 });
      }
    }
    await prisma.superAdmin.update({
      where: { id: admin.id },
      data: { totpEnabled: false, totpSecret: null },
    });
    return NextResponse.json({ enabled: false });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
