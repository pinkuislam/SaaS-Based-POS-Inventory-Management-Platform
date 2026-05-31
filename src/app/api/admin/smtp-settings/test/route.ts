import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin/require-admin";
import { sendEmail } from "@/lib/email";
import { smtpTestSchema } from "@/lib/schemas/forms";
import { validateWithSchema } from "@/lib/validate-form";

export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = validateWithSchema(smtpTestSchema, body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: Object.values(parsed.errors)[0] || "Invalid email" },
      { status: 400 }
    );
  }

  const result = await sendEmail({
    to: parsed.data.testEmail,
    subject: "InventoryPOS — SMTP test email",
    html: `
      <p>This is a test email from your platform SMTP configuration.</p>
      <p>If you received this message, outbound email is working correctly.</p>
    `,
  });

  if (!result.sent) {
    return NextResponse.json(
      { error: "SMTP is not configured. Save valid settings first." },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, sent: true });
}
