import { Card, CardContent } from "@/components/ui/card";
import { StoreIcon } from "lucide-react";

export default function OffCourseOffersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Off-Course Offers</h1>
        <p className="text-muted-foreground">
          Send promotions to bring players back after their round.
        </p>
      </div>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <StoreIcon className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-center text-muted-foreground">
            Off-course offers coming soon. Create tee time deals, merchandise promotions,
            and loyalty rewards to drive repeat visits.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
