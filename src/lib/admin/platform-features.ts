import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";

export {
  DEFAULT_ADMIN_ROLES,
  DEFAULT_PLATFORM_FEATURES,
} from "@/lib/admin/platform-feature-seed";

export const PLATFORM_FEATURES_CACHE_TAG = "platform-features";

const adminListSelect = {
  id: true,
  key: true,
  name: true,
  module: true,
  description: true,
  isActive: true,
  sortOrder: true,
} as const;

export type PlatformFeatureListItem = {
  id: string;
  key: string;
  name: string;
  module: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
};

async function queryPlatformFeaturesForAdmin(): Promise<PlatformFeatureListItem[]> {
  return prisma.platformFeature.findMany({
    select: adminListSelect,
    orderBy: [{ module: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
}

/** Cached list for admin features page and GET /api/admin/features */
export const getPlatformFeaturesForAdmin = unstable_cache(
  queryPlatformFeaturesForAdmin,
  ["admin-platform-features-list"],
  { revalidate: 120, tags: [PLATFORM_FEATURES_CACHE_TAG] }
);

async function queryActivePlatformFeaturesForPackages() {
  return prisma.platformFeature.findMany({
    where: { isActive: true },
    select: { key: true, name: true, module: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export const getActivePlatformFeaturesForPackages = unstable_cache(
  queryActivePlatformFeaturesForPackages,
  ["active-platform-features-packages"],
  { revalidate: 120, tags: [PLATFORM_FEATURES_CACHE_TAG] }
);

export function invalidatePlatformFeaturesCache() {
  revalidateTag(PLATFORM_FEATURES_CACHE_TAG, "max");
}
