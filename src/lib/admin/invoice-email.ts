import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { formatCurrency, decimalToNumber, formatDate } from "@/lib/utils";

export async function sendSubscriptionInvoiceEmail(invoiceId: string) {
  const invoice = await prisma.subscriptionInvoice.findUnique({
    where: { id: invoiceId },
  });
  if (!invoice) throw new Error("Invoice not found");

  const tenant = await prisma.tenant.findUnique({
    where: { id: invoice.tenantId },
  });
  if (!tenant?.email) throw new Error("Tenant email not found");

  const total = decimalToNumber(invoice.total);
  const amount = decimalToNumber(invoice.amount);
  const tax = decimalToNumber(invoice.tax);
  const discount = decimalToNumber(invoice.discount);

  const html = `
    <div style="font-family:sans-serif;max-width:600px">
      <h2>Subscription Invoice</h2>
      <p>Hello ${tenant.name},</p>
      <p>Please find your invoice details below:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Invoice #</strong></td><td style="padding:8px;border-bottom:1px solid #eee">${invoice.invoiceNo}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee">Amount</td><td style="padding:8px;border-bottom:1px solid #eee">${formatCurrency(amount)}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee">Tax</td><td style="padding:8px;border-bottom:1px solid #eee">${formatCurrency(tax)}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee">Discount</td><td style="padding:8px;border-bottom:1px solid #eee">${formatCurrency(discount)}</td></tr>
        <tr><td style="padding:8px"><strong>Total</strong></td><td style="padding:8px"><strong>${formatCurrency(total)}</strong></td></tr>
        <tr><td style="padding:8px">Status</td><td style="padding:8px">${invoice.status}</td></tr>
        <tr><td style="padding:8px">Due date</td><td style="padding:8px">${invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</td></tr>
      </table>
      ${invoice.notes ? `<p><em>${invoice.notes}</em></p>` : ""}
      <p>Thank you for using our platform.</p>
    </div>
  `;

  const result = await sendEmail({
    to: tenant.email,
    subject: `Invoice ${invoice.invoiceNo} — ${formatCurrency(total)}`,
    html,
  });

  return { tenantEmail: tenant.email, ...result };
}
