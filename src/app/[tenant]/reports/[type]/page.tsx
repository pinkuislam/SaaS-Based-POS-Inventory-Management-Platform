import { notFound } from "next/navigation";
import { ReportViewer } from "@/components/reports/report-viewer";
import { getReportMeta, isValidReportType } from "@/lib/report-types";

export default async function ReportTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!isValidReportType(type)) notFound();

  const meta = getReportMeta(type);
  if (!meta) notFound();

  return (
    <ReportViewer
      reportType={type}
      title={meta.label}
      advanced={meta.advanced}
    />
  );
}
