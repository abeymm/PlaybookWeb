import { Card, CardContent } from "@/components/ui/card";
import { LayoutDashboardIcon } from "lucide-react";

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">
          Your course dashboard at a glance.
        </p>
      </div>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <LayoutDashboardIcon className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-center text-muted-foreground">
            Dashboard overview coming soon. You&apos;ll see key metrics, recent activity,
            and quick actions here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
