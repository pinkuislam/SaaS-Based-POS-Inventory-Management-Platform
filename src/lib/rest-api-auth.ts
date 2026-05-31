import { NextResponse } from "next/server";
import { resolveTenantFromApiKey } from "@/lib/tenant-api-key";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  getTenantPackageFeatures,
  hasPackageFeature,
  PACKAGE_FEATURES,
} from "@/lib/package-features";

export async function authenticateRestRequest(request: Request) {
  const auth = request.headers.get("authorization");
  const rateKey = auth?.slice(0, 40) || request.headers.get("x-forwarded-for") || "anon";
  const limit = checkRateLimit(`api:${rateKey}`);
  if (!limit.ok) {
    return {
      error: NextResponse.json(
        { error: "Rate limit exceeded", retryAfter: limit.retryAfter },
        { status: 429 }
      ),
    };
  }

  const resolved = await resolveTenantFromApiKey(auth);
  if (!resolved) {
    return {
      error: NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 }),
    };
  }

  const features = await getTenantPackageFeatures(resolved.tenantId);
  if (!hasPackageFeature(features, PACKAGE_FEATURES.API_ACCESS)) {
    return {
      error: NextResponse.json(
        { error: "API access is not included in your subscription package" },
        { status: 403 }
      ),
    };
  }

  return { tenantId: resolved.tenantId };
}
