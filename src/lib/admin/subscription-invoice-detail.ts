import { prisma } from "@/lib/prisma";
import { getPlatformSettings, PLATFORM_SETTING_KEYS } from "@/lib/admin/system-settings";
import { decimalToNumber, formatCurrency, formatDate } from "@/lib/utils";

export type SubscriptionInvoiceDetail = {
  invoice: {
    id: string;
    invoiceNo: string;
    amount: number;
    tax: number;
    discount: number;
    total: number;
    status: string;
    dueDate: string | null;
    paidAt: string | null;
    notes: string | null;
    createdAt: string;
  };
  tenant: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  } | null;
  platform: {
    name: string;
    email: string;
    supportEmail: string;
  };
};

export async function getSubscriptionInvoiceDetail(
  id: string
): Promise<SubscriptionInvoiceDetail | null> {
  const invoice = await prisma.subscriptionInvoice.findUnique({
    where: { id },
  });
  if (!invoice) return null;

  const [tenant, settings] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: invoice.tenantId },
      select: { name: true, email: true, phone: true, address: true },
    }),
    getPlatformSettings(),
  ]);

  return {
    invoice: {
      id: invoice.id,
      invoiceNo: invoice.invoiceNo,
      amount: decimalToNumber(invoice.amount),
      tax: decimalToNumber(invoice.tax),
      discount: decimalToNumber(invoice.discount),
      total: decimalToNumber(invoice.total),
      status: invoice.status,
      dueDate: invoice.dueDate?.toISOString() ?? null,
      paidAt: invoice.paidAt?.toISOString() ?? null,
      notes: invoice.notes,
      createdAt: invoice.createdAt.toISOString(),
    },
    tenant,
    platform: {
      name: settings[PLATFORM_SETTING_KEYS.platformName] || "InventoryPOS Platform",
      email: settings[PLATFORM_SETTING_KEYS.platformEmail] || "",
      supportEmail: settings[PLATFORM_SETTING_KEYS.supportEmail] || "",
    },
  };
}

export function buildSubscriptionInvoiceHtml(
  data: SubscriptionInvoiceDetail
): string {
  const { invoice, tenant, platform } = data;
  const statusLabel =
    invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice ${invoice.invoiceNo}</title>
  <style>
    body { font-family: system-ui, sans-serif; color: #111; margin: 0; padding: 32px; }
    .wrap { max-width: 720px; margin: 0 auto; }
    h1 { margin: 0 0 4px; font-size: 1.5rem; }
    .muted { color: #666; font-size: 0.875rem; }
    .header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #111; padding-bottom: 16px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e5e5e5; }
    th { background: #f5f5f5; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .totals td:last-child { text-align: right; font-weight: 600; }
    .grand { font-size: 1.25rem; font-weight: 700; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; background: #f0f0f0; font-size: 0.75rem; text-transform: uppercase; }
    .notes { margin-top: 24px; padding: 12px; background: #fafafa; border-radius: 8px; font-size: 0.875rem; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div>
        <h1>${escapeHtml(platform.name)}</h1>
        <p class="muted">Subscription Invoice</p>
        ${platform.email ? `<p class="muted">${escapeHtml(platform.email)}</p>` : ""}
      </div>
      <div style="text-align:right">
        <p style="font-size:1.25rem;font-weight:700;margin:0">${escapeHtml(invoice.invoiceNo)}</p>
        <p class="muted">Issued: ${formatDate(invoice.createdAt)}</p>
        <p class="muted">Due: ${invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</p>
        <span class="badge">${escapeHtml(statusLabel)}</span>
      </div>
    </div>
    <div style="display:flex;gap:48px;margin-bottom:8px">
      <div>
        <p class="muted" style="margin:0 0 4px">Bill to</p>
        <p style="margin:0;font-weight:600">${escapeHtml(tenant?.name || "—")}</p>
        ${tenant?.email ? `<p class="muted" style="margin:4px 0 0">${escapeHtml(tenant.email)}</p>` : ""}
        ${tenant?.phone ? `<p class="muted" style="margin:2px 0 0">${escapeHtml(tenant.phone)}</p>` : ""}
        ${tenant?.address ? `<p class="muted" style="margin:2px 0 0">${escapeHtml(tenant.address)}</p>` : ""}
      </div>
      ${
        invoice.paidAt
          ? `<div><p class="muted" style="margin:0 0 4px">Paid on</p><p style="margin:0;font-weight:600">${formatDate(invoice.paidAt)}</p></div>`
          : ""
      }
    </div>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Platform subscription</td>
          <td style="text-align:right">${formatCurrency(invoice.amount)}</td>
        </tr>
      </tbody>
    </table>
    <table class="totals" style="max-width:320px;margin-left:auto">
      <tr><td>Subtotal</td><td>${formatCurrency(invoice.amount)}</td></tr>
      <tr><td>Tax</td><td>${formatCurrency(invoice.tax)}</td></tr>
      <tr><td>Discount</td><td>-${formatCurrency(invoice.discount)}</td></tr>
      <tr class="grand"><td>Total</td><td>${formatCurrency(invoice.total)}</td></tr>
    </table>
    ${invoice.notes ? `<div class="notes"><strong>Notes:</strong> ${escapeHtml(invoice.notes)}</div>` : ""}
    <p class="muted" style="margin-top:32px;text-align:center">Thank you for your business.</p>
  </div>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
