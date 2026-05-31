import { NextResponse } from "next/server";
import { processSubscriptionExpiry } from "@/lib/subscription-expiry";

export async function GET(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (
    process.env.CRON_SECRET &&
    secret !== process.env.CRON_SECRET
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processSubscriptionExpiry();
  return NextResponse.json({
    success: true,
    ...result,
    ranAt: new Date().toISOString(),
  });
}
