import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin/require-admin";
import {
  buildSubscriptionInvoiceHtml,
  getSubscriptionInvoiceDetail,
} from "@/lib/admin/subscription-invoice-detail";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const data = await getSubscriptionInvoiceDetail(id);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const html = buildSubscriptionInvoiceHtml(data);
  const filename = `invoice-${data.invoice.invoiceNo.replace(/[^a-zA-Z0-9-_]/g, "-")}.html`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
