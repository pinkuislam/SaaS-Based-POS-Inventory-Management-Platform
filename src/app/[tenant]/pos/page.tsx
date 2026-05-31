import { PosScreen } from "@/components/pos/pos-screen";

export default function PosPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Point of Sale</h1>
        <p className="text-muted-foreground">Fast billing and checkout</p>
      </div>
      <PosScreen />
    </div>
  );
}
