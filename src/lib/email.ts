import nodemailer from "nodemailer";
import { getSmtpConfig } from "@/lib/smtp-settings";

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const smtp = await getSmtpConfig();
  if (!smtp.configured) {
    console.log("[Email skipped - SMTP not configured]", { to, subject });
    return { sent: false, reason: "smtp_not_configured" };
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

  await transporter.sendMail({
    from: smtp.from || smtp.user,
    to,
    subject,
    html,
    text: text || (html ? html.replace(/<[^>]*>/g, "") : ""),
  });

  return { sent: true };
}

export async function isEmailConfigured() {
  const smtp = await getSmtpConfig();
  return smtp.configured;
}

export async function sendLowStockAlertEmail({
  to,
  businessName,
  products,
}: {
  to: string;
  businessName: string;
  products: { name: string; stockQty: number; reorderLevel: number }[];
}) {
  const rows = products
    .map(
      (p) =>
        `<tr><td>${p.name}</td><td>${p.stockQty}</td><td>${p.reorderLevel}</td></tr>`
    )
    .join("");

  return sendEmail({
    to,
    subject: `[${businessName}] Low Stock Alert — ${products.length} product(s)`,
    html: `
      <h2>Low Stock Alert</h2>
      <p>The following products are at or below reorder level:</p>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse">
        <tr><th>Product</th><th>Stock</th><th>Reorder Level</th></tr>
        ${rows}
      </table>
      <p><a href="${process.env.NEXTAUTH_URL}/dashboard/inventory">View Inventory</a></p>
    `,
  });
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string;
  resetUrl: string;
}) {
  return sendEmail({
    to,
    subject: "Reset your InventoryPOS password",
    html: `
      <h2>Password reset</h2>
      <p>Click the link below to set a new password. This link expires in 2 hours.</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  });
}
