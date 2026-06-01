import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { buildReport } from "@/lib/reports";
import { isValidReportType, getReportMeta } from "@/lib/report-types";
import { parseISO, startOfMonth, endOfMonth } from "date-fns";

export async function GET(request: Request) {
  const authResult = await requirePermission("view_reports");
  if ("error" in authResult) return authResult.error;

  const tenantId = authResult.session.user.tenantId!;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "sales";

  if (!isValidReportType(type)) {
    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  }

  const meta = getReportMeta(type);
  if (meta?.advanced) {
    const { getTenantPackageFeatures, hasPackageFeature, PACKAGE_FEATURES } =
      await import("@/lib/package-features");
    const features = await getTenantPackageFeatures(tenantId);
    if (!hasPackageFeature(features, PACKAGE_FEATURES.ADVANCED_REPORTS)) {
      return NextResponse.json(
        {
          error:
            "Advanced reports are not included in your subscription package.",
        },
        { status: 403 }
      );
    }
  }

  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const from = fromParam
    ? parseISO(fromParam)
    : startOfMonth(new Date());
  const to = toParam ? parseISO(toParam) : endOfMonth(new Date());

  const result = await buildReport(type, {
    tenantId,
    from,
    to,
    branchId: searchParams.get("branchId"),
    userId: searchParams.get("userId"),
    customerId: searchParams.get("customerId"),
    supplierId: searchParams.get("supplierId"),
    productId: searchParams.get("productId"),
  });

  if (!result) {
    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  }

  return NextResponse.json(result);
}
