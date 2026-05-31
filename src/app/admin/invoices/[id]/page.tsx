import { notFound } from "next/navigation";
import { getSubscriptionInvoiceDetail } from "@/lib/admin/subscription-invoice-detail";
import { SubscriptionInvoicePrint } from "@/components/admin/subscription-invoice-print";
import { InvoiceEditDialog } from "@/components/admin/invoice-edit-dialog";
import { InvoiceMarkPaidButton } from "@/components/admin/invoice-mark-paid";
import { InvoiceSendButton } from "@/components/admin/invoice-send-button";

export default async function SubscriptionInvoiceViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const { id } = await params;
  const { print } = await searchParams;
  const data = await getSubscriptionInvoiceDetail(id);

  if (!data) notFound();

  const autoPrint = print === "1";

  return (
    <div className="space-y-4">
      {!autoPrint ? (
        <div className="print:hidden flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Invoice {data.invoice.invoiceNo}</h1>
            <p className="text-muted-foreground">
              {data.tenant?.name || "Unknown tenant"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <InvoiceEditDialog
              invoice={{
                id: data.invoice.id,
                status: data.invoice.status,
                notes: data.invoice.notes,
              }}
            />
            <InvoiceSendButton invoiceId={data.invoice.id} />
            {data.invoice.status !== "paid" && (
              <InvoiceMarkPaidButton invoiceId={data.invoice.id} />
            )}
          </div>
        </div>
      ) : null}

      <SubscriptionInvoicePrint data={data} autoPrint={autoPrint} />
    </div>
  );
}
