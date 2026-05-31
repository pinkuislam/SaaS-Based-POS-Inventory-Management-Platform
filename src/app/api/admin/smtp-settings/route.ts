import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin/require-admin";
import { getSmtpConfig, saveSmtpConfig } from "@/lib/smtp-settings";

export async function GET() {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const config = await getSmtpConfig();
  return NextResponse.json({
    smtpEnabled: config.enabled,
    smtpHost: config.host,
    smtpPort: String(config.port),
    smtpSecure: config.secure,
    smtpUser: config.user,
    smtpPass: config.pass ? "••••••••" : "",
    smtpFrom: config.from,
    configured: config.configured,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const existing = await getSmtpConfig();

  await saveSmtpConfig({
    enabled: body.smtpEnabled,
    host: body.smtpHost,
    port: parseInt(body.smtpPort || "587", 10),
    secure: body.smtpSecure,
    user: body.smtpUser,
    pass:
      body.smtpPass && body.smtpPass !== "••••••••"
        ? body.smtpPass
        : existing.pass,
    from: body.smtpFrom || body.smtpUser,
  });

  const updated = await getSmtpConfig();
  return NextResponse.json({
    success: true,
    configured: updated.configured,
  });
}
