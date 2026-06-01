import Link from "next/link";
import { ProductImportDialog } from "@/components/products/product-import-dialog";
import { CsvImportDialog } from "@/components/shared/csv-import-dialog";
import { OpeningStockImport } from "@/components/import-export/opening-stock-import";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { tenantDashboardPath } from "@/lib/tenant-path";

const CUSTOMER_SAMPLE = `name,phone,email,address,type,openingbalance,creditlimit
John Doe,01700000000,john@example.com,Dhaka,retail,0,5000`;

const SUPPLIER_SAMPLE = `name,company,phone,email,address,openingbalance
Acme Supplies,Acme Ltd,01700000001,acme@example.com,Dhaka,0`;

export default async function ImportExportPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: tenantSlug } = await params;
  const reportsBase = tenantDashboardPath(tenantSlug, "/reports");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import & Export</h1>
        <p className="text-muted-foreground">
          Bulk import and export business data with validation and error reports
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Import Products</CardTitle>
            <CardDescription>
              Upload CSV to create or update products (includes stock column)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <ProductImportDialog />
            <OpeningStockImport />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export Products</CardTitle>
            <CardDescription>Download product catalog as CSV</CardDescription>
          </CardHeader>
          <CardContent>
            <a href="/api/products/export" download>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Products CSV
              </Button>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customers</CardTitle>
            <CardDescription>Import or export customer list</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <CsvImportDialog
              title="Import Customers"
              apiPath="/api/customers/import"
              sampleCsv={CUSTOMER_SAMPLE}
              sampleFilename="customer-import-template.csv"
            />
            <a href="/api/customers/export" download>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Customers CSV
              </Button>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suppliers</CardTitle>
            <CardDescription>Import or export supplier list</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <CsvImportDialog
              title="Import Suppliers"
              apiPath="/api/suppliers/import"
              sampleCsv={SUPPLIER_SAMPLE}
              sampleFilename="supplier-import-template.csv"
            />
            <a href="/api/suppliers/export" download>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Suppliers CSV
              </Button>
            </a>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Transactions & reports export</CardTitle>
            <CardDescription>
              Export sales and purchases as CSV, or use Reports for filtered
              analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <a href="/api/sales/export" download>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Sales CSV
              </Button>
            </a>
            <a href="/api/purchases/export" download>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Purchases CSV
              </Button>
            </a>
            <Link href={`${reportsBase}/stock`}>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Stock / valuation report
              </Button>
            </Link>
            <Link href={reportsBase}>
              <Button variant="outline">All reports</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
