import { Card, CardContent } from "@/components/ui/card";
import { BarChartIcon } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          View player engagement and offer performance analytics.
        </p>
      </div>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChartIcon className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-center text-muted-foreground">
            Analytics and reports coming soon. Track playbook views, QR scans,
            offer engagement, and player retention metrics.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
