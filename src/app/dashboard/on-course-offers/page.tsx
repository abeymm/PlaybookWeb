import { Card, CardContent } from "@/components/ui/card";
import { GiftIcon } from "lucide-react";

export default function OnCourseOffersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">On-Course Offers</h1>
        <p className="text-muted-foreground">
          Create and manage offers shown to players during their round.
        </p>
      </div>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <GiftIcon className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-center text-muted-foreground">
            On-course offers coming soon. Create F&amp;B specials, beer cart promotions,
            and course amenity highlights that appear during play.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
