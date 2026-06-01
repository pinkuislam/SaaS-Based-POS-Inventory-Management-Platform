import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureFormDialog } from "@/components/admin/feature-form-dialog";
import { FeaturesTable } from "@/components/admin/features-table";
import { getPlatformFeaturesForAdmin } from "@/lib/admin/platform-features";

export const revalidate = 120;

export default async function FeaturesPage() {
  const features = await getPlatformFeaturesForAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Package Features</h1>
          <p className="text-muted-foreground">
            Control platform features assignable to packages
          </p>
        </div>
        <FeatureFormDialog />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Features ({features.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <FeaturesTable features={features} />
        </CardContent>
      </Card>
    </div>
  );
}
