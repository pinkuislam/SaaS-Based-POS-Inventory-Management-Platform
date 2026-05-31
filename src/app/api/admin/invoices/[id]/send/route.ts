import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin/require-admin";
import { sendSubscriptionInvoiceEmail } from "@/lib/admin/invoice-email";
import { logPlatformActivity } from "@/lib/admin/log-activity";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;

  try {
    const result = await sendSubscriptionInvoiceEmail(id);
    await logPlatformActivity({
      adminId: auth.session.user.id,
      adminName: auth.session.user.name || undefined,
      action: "EMAIL",
      module: "invoices",
      details: `Sent invoice ${id} to ${result.tenantEmail}`,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Send failed" },
      { status: 400 }
    );
  }
}
