import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentsHub } from "@/components/payments/payments-hub";
import { PaymentsLedger } from "@/components/payments/payments-ledger";

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-muted-foreground">
          Customer collections, supplier payments, and due balances
        </p>
      </div>
      <PaymentsHub />
      <Card>
        <CardHeader>
          <CardTitle>Payment ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentsLedger />
        </CardContent>
      </Card>
    </div>
  );
}
