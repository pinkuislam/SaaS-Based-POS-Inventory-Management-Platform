import { format } from "date-fns";
import { escapeCsvCell } from "@/lib/utils";
import { notify } from "@/lib/notify";

export type ReportPayload = {
  title: string;
  businessName?: string;
  from: string;
  to: string;
  rows: Record<string, unknown>[];
  summary: { count: number; total: number };
};

export function formatCellValue(val: unknown): string {
  if (
    val instanceof Date ||
    (typeof val === "string" && /^\d{4}-\d{2}-\d{2}/.test(val))
  ) {
    try {
      return format(new Date(val as string), "dd/MM/yyyy");
    } catch {
      return String(val ?? "");
    }
  }
  if (typeof val === "number") return val.toLocaleString("en-BD", { minimumFractionDigits: 2 });
  return String(val ?? "");
}

export function downloadReportCsv(
  data: ReportPayload,
  reportType: string,
  from: string,
  to: string
) {
  const rows = data.rows;
  if (rows.length === 0) {
    notify.error("No data to export");
    return;
  }
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          const formatted =
            val instanceof Date ||
            (typeof val === "string" && val.includes("T"))
              ? format(new Date(val as string), "yyyy-MM-dd")
              : val;
          return escapeCsvCell(formatted);
        })
        .join(",")
    ),
    "",
    `"Total records","${data.summary.count}"`,
    `"Total","${data.summary.total}"`,
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${reportType}-report-${from}-${to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  notify.success("CSV downloaded");
}

/** Excel-compatible export (UTF-8 CSV with BOM) */
export function downloadReportExcel(
  data: ReportPayload,
  reportType: string,
  from: string,
  to: string
) {
  const rows = data.rows;
  if (rows.length === 0) {
    notify.error("No data to export");
    return;
  }
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          const formatted =
            val instanceof Date ||
            (typeof val === "string" && val.includes("T"))
              ? format(new Date(val as string), "yyyy-MM-dd")
              : val;
          return escapeCsvCell(formatted);
        })
        .join(",")
    ),
    "",
    `"Total records","${data.summary.count}"`,
    `"Total","${data.summary.total}"`,
  ];
  const bom = "\uFEFF";
  const blob = new Blob([bom + lines.join("\n")], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${reportType}-report-${from}-${to}.xls`;
  a.click();
  URL.revokeObjectURL(url);
  notify.success("Excel file downloaded");
}

export function printReport(
  data: ReportPayload,
  from: string,
  to: string
) {
  const rows = data.rows;
  const headers = rows.length > 0 ? Object.keys(rows[0]) : ["No data"];
  const html = `
    <html><head><title>${data.title}</title>
    <style>body{font-family:sans-serif;padding:24px} table{border-collapse:collapse;width:100%} th,td{border:1px solid #ddd;padding:8px;text-align:left} th{background:#f5f5f5}</style>
    </head><body>
    <h1>${data.businessName || "InventoryPOS"}</h1>
    <h2>${data.title}</h2>
    <p>${from} — ${to}</p>
    <table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
    <tbody>${rows
      .map(
        (row) =>
          `<tr>${headers.map((h) => `<td>${formatCellValue(row[h])}</td>`).join("")}</tr>`
      )
      .join("")}</tbody>
    </table>
    <p><strong>Total records:</strong> ${data.summary.count} | <strong>Total:</strong> ${data.summary.total}</p>
    </body></html>`;
  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    w.print();
  }
}

export async function downloadReportPdf(
  data: ReportPayload,
  reportType: string,
  from: string,
  to: string
) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.text(data.businessName || "InventoryPOS", pageWidth / 2, 15, {
    align: "center",
  });
  doc.setFontSize(12);
  doc.text(data.title, pageWidth / 2, 22, { align: "center" });
  doc.setFontSize(9);
  doc.text(
    `${format(new Date(data.from), "dd MMM yyyy")} — ${format(new Date(data.to), "dd MMM yyyy")}`,
    pageWidth / 2,
    28,
    { align: "center" }
  );

  const rows = data.rows;
  if (rows.length === 0) {
    doc.text("No data for selected period.", 14, 40);
  } else {
    const headers = Object.keys(rows[0]);
    const body = rows.map((row) => headers.map((h) => formatCellValue(row[h])));

    autoTable(doc, {
      startY: 34,
      head: [headers.map((h) => h.charAt(0).toUpperCase() + h.slice(1))],
      body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 30, 30] },
    });

    const finalY =
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        ?.finalY ?? 40;
    doc.setFontSize(10);
    doc.text(
      `Total records: ${data.summary.count} | Total: ৳${Number(data.summary.total).toLocaleString("en-BD", { minimumFractionDigits: 2 })}`,
      14,
      finalY + 10
    );
  }

  doc.save(`${reportType}-report-${from}-${to}.pdf`);
  notify.success("PDF downloaded");
}
