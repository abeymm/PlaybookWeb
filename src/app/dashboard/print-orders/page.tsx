import { Card, CardContent } from "@/components/ui/card";
import { PrinterIcon } from "lucide-react";

export default function PrintOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Print Orders</h1>
        <p className="text-muted-foreground">
          Order printed yardage books at partner pricing.
        </p>
      </div>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <PrinterIcon className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-center text-muted-foreground">
            Print ordering coming soon. Order professional yardage books at $14.99 each
            (minimum 50) to sell in your pro shop.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
