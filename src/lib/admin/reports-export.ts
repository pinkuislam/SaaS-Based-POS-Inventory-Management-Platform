import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";

export async function getAdminReportData(type: string) {
  if (type === "tenants") {
    const tenants = await prisma.tenant.findMany({
      where: { deletedAt: null },
      include: { package: { select: { name: true } } },
      orderBy: { name: "asc" },
    });
    return {
      title: "Tenant Report",
      headers: ["Business", "Email", "Slug", "Status", "Package"],
      rows: tenants.map((t) => [
        t.name,
        t.email,
        t.slug,
        t.status,
        t.package?.name || "—",
      ]),
    };
  }

  if (type === "revenue") {
    const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i));
    const rows: string[][] = [];
    for (const d of months) {
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const payments = await prisma.subscriptionPayment.findMany({
        where: { status: "PAID", paidAt: { gte: start, lte: end } },
      });
      const total = payments.reduce((s, p) => s + decimalToNumber(p.amount), 0);
      rows.push([
        start.toLocaleString("default", { month: "long", year: "numeric" }),
        String(payments.length),
        total.toFixed(2),
      ]);
    }
    return {
      title: "Revenue Report (6 months)",
      headers: ["Month", "Payments", "Revenue"],
      rows,
    };
  }

  const [tenantCount, active, trial, pending] = await Promise.all([
    prisma.tenant.count({ where: { deletedAt: null } }),
    prisma.tenant.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.subscription.count({ where: { status: "TRIAL" } }),
    prisma.subscriptionPayment.count({ where: { status: "PENDING" } }),
  ]);

  return {
    title: "Platform Overview",
    headers: ["Metric", "Value"],
    rows: [
      ["Total Tenants", String(tenantCount)],
      ["Active Tenants", String(active)],
      ["Trial Subscriptions", String(trial)],
      ["Pending Payments", String(pending)],
    ],
  };
}

export function buildReportCsv(data: {
  title: string;
  headers: string[];
  rows: string[][];
}) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [
    data.title,
    "",
    data.headers.map(escape).join(","),
    ...data.rows.map((r) => r.map(escape).join(",")),
  ];
  return lines.join("\n");
}

export function buildReportPdf(data: {
  title: string;
  headers: string[];
  rows: string[][];
}) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(data.title, 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
  autoTable(doc, {
    head: [data.headers],
    body: data.rows,
    startY: 34,
  });
  return doc.output("arraybuffer");
}
