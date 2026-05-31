import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin/require-admin";
import {
  getAdminReportData,
  buildReportCsv,
  buildReportPdf,
} from "@/lib/admin/reports-export";

export async function GET(request: Request) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "pdf";
  const type = searchParams.get("type") || "overview";

  const data = await getAdminReportData(type);

  if (format === "csv" || format === "excel") {
    const csv = buildReportCsv(data);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${type}-report.csv"`,
      },
    });
  }

  const buffer = buildReportPdf(data);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${type}-report.pdf"`,
    },
  });
}
