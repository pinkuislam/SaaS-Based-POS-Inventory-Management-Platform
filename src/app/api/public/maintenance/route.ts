import { NextResponse } from "next/server";
import { getMaintenanceState } from "@/lib/maintenance-mode";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = await getMaintenanceState();
  return NextResponse.json(state, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
